import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../../prisma/prisma.service'
import { DemoPolicyService } from '../../auth/demo-policy.service'
import { CerrarSolicitudDto } from './dto/cerrar-solicitud.dto'
import { CrearSolicitudDto } from './dto/crear-solicitud.dto'
import { EliminarSolicitudDto } from './dto/eliminar-solicitud.dto'
import { EliminarSolicitudesUsuarioDto } from './dto/eliminar-solicitudes-usuario.dto'
import { EliminarTodasSolicitudesDto } from './dto/eliminar-todas-solicitudes.dto'
import { RechazarSolicitudDto } from './dto/rechazar-solicitud.dto'
import { RespuestaApiEstandar } from './interfaces/respuesta-api.interface'

@Injectable()
export class SolicitudService {
  private readonly tablasReiniciables = [
    'historial_estado_boleto',
    'segmento_boleto',
    'historial_estado_cotizacion',
    'segmento_cotizacion',
    'boleto',
    'historial_estado_solicitud',
    'detalle_vuelo_solicitud',
    'cotizacion',
    'solicitud',
  ]

  constructor(
    private prisma: PrismaService,
    private readonly demoPolicyService: DemoPolicyService,
  ) {}

  private formatearFechaSoloDia(fecha: Date | null | undefined): string | null {
    if (!fecha) {
      return null
    }
    return fecha.toISOString().slice(0, 10)
  }

  private enriquecerConDetalleVuelo<T extends { detalle_vuelo_solicitud?: Array<{
    origen: string
    destino: string
    preferencia_aerolinea: string | null
    fecha_ida: Date
    fecha_vuelta: Date | null
  }> }>(solicitud: T) {
    const detalle = solicitud.detalle_vuelo_solicitud?.[0]
    const { detalle_vuelo_solicitud, ...solicitudBase } = solicitud as T & {
      detalle_vuelo_solicitud?: unknown
    }

    return {
      ...solicitudBase,
      ruta: {
        origen: detalle?.origen ?? null,
        destino: detalle?.destino ?? null,
        preferencia_aerolinea: detalle?.preferencia_aerolinea ?? null,
      },
      fechas: {
        ida: this.formatearFechaSoloDia(detalle?.fecha_ida),
        vuelta: this.formatearFechaSoloDia(detalle?.fecha_vuelta),
      },
    }
  }

  /**
   * 1️⃣ Crear solicitud - Estado inicial: PENDIENTE
   */
  async crearSolicitud(
    data: CrearSolicitudDto,
    usuarioId: number,
    userRole?: string,
  ): Promise<RespuestaApiEstandar> {
    await this.demoPolicyService.assertCanCreate('solicitud', usuarioId, userRole)

    // Buscar estado PENDIENTE por slug
    const estadoPendiente = await this.prisma.estado_solicitud.findUnique({
      where: { slug: 'pendiente' }
    })
    if (!estadoPendiente) {
      throw new NotFoundException('Estado pendiente no encontrado en la base de datos')
    }
    // Generar radicado único (puedes personalizar el formato)
    const radicado = await this.generarRadicado(usuarioId)
    // Crear solicitud
    const solicitud = await this.prisma.solicitud.create({
      data: {
        usuario_id: usuarioId,
        estado_actual_id: estadoPendiente.id,
        tipo_de_vuelo: data.tipo_de_vuelo,
        radicado: radicado,
      },
      include: {
        estado_solicitud: true,
        usuario: {
          select: {
            id: true,
            nombre: true,
            username: true,
          }
        }
      }
    })
    // Registrar en historial
    await this.prisma.historial_estado_solicitud.create({
      data: {
        solicitud_id: solicitud.id,
        estado_id: estadoPendiente.id,
        usuario_id: usuarioId,
        observacion: `Solicitud creada - ${data.tipo_de_vuelo} de ${data.ruta.origen} a ${data.ruta.destino}`
      }
    })

    // Persistir detalle del vuelo
    await this.prisma.detalle_vuelo_solicitud.create({
      data: {
        solicitud_id: solicitud.id,
        origen: data.ruta.origen,
        destino: data.ruta.destino,
        fecha_ida: new Date(data.fechas.ida),
        fecha_vuelta: data.fechas.vuelta ? new Date(data.fechas.vuelta) : null,
        preferencia_aerolinea: data.ruta.preferencia_aerolinea ?? null,
      }
    })

    await this.demoPolicyService.incrementUsage('solicitud', usuarioId, userRole)

    return {
      success: true,
      message: 'Solicitud creada correctamente',
      data: {
        solicitud: {
          id: solicitud.id,
          radicado: solicitud.radicado,
          estado: solicitud.estado_solicitud.estado,
          tipo_de_vuelo: solicitud.tipo_de_vuelo,
          ruta: {
            origen: data.ruta.origen,
            destino: data.ruta.destino,
            preferencia_aerolinea: data.ruta.preferencia_aerolinea ?? null,
          },
          fechas: {
            ida: data.fechas.ida,
            vuelta: data.fechas.vuelta ?? null,
          },
          created_at: solicitud.created_at
        }
      },
      event: {
        type: 'SOLICITUD_CREADA'
      }
    }
  }

  /**
   * Obtener solicitudes con paginación y orden configurable
   *
   * Parámetros opcionales recibidos desde el controlador:
   * @param page  - Número de página (empieza en 1). Default: 1
   * @param limit - Cuántos registros traer por página. Default: 10
   * @param orden - 'asc' (más antiguas primero) | 'desc' (más recientes primero). Default: 'desc'
   *
   * Cómo funciona skip/take en Prisma (equivale a SQL LIMIT/OFFSET):
   *   take  → cuántos registros tomar  (como LIMIT en SQL)
   *   skip  → cuántos registros saltar (como OFFSET en SQL)
   *
   * Ejemplo visual con limit=3:
   *   Página 1 → skip=0,  take=3 → registros 1,2,3
   *   Página 2 → skip=3,  take=3 → registros 4,5,6
   *   Página 3 → skip=6,  take=3 → registros 7,8,9
   *
   * Fórmula: skip = (page - 1) * limit
   */
  async obtenerSolicitudes(
    page: number = 1,
    limit: number = 10,
    orden: 'asc' | 'desc' = 'desc',
    estado?: string,
    usuarioId?: number,
  ): Promise<RespuestaApiEstandar> {

    // Armamos where dinámico para soportar filtros opcionales.
    const where: Prisma.solicitudWhereInput = {}

    if (typeof usuarioId === 'number') {
      where.usuario_id = usuarioId
    }

    if (estado && estado.trim()) {
      const estadoRaw = estado.trim()
      const estadoSlug = estadoRaw
        .toLowerCase()
        .replace(/\s+/g, '_')

      where.estado_solicitud = {
        is: {
          OR: [
            { slug: estadoSlug },
            { estado: estadoRaw },
            { estado: estadoRaw.toUpperCase() },
          ],
        },
      }
    }

    // Calculamos cuántos registros saltar para llegar a la página pedida
    const skip = (page - 1) * limit

    // Ejecutamos dos consultas en paralelo:
    // 1. Los registros de la página actual (con skip/take)
    // 2. El total de registros en la tabla (para que el cliente sepa cuántas páginas hay)
    const [solicitudes, total] = await Promise.all([
      this.prisma.solicitud.findMany({
        where,
        skip,      // saltar los registros de páginas anteriores
        take: limit, // tomar solo 'limit' registros
        include: {
          usuario: {
            select: { id: true, nombre: true, username: true }
          },
          estado_solicitud: true,
          cotizacion: {
            include: { estado_cotizacion: true }
          },
          detalle_vuelo_solicitud: {
            select: {
              origen: true,
              destino: true,
              preferencia_aerolinea: true,
              fecha_ida: true,
              fecha_vuelta: true,
            },
            take: 1,
            orderBy: {
              created_at: 'desc',
            },
          }
        },
        orderBy: { created_at: orden } // 'desc' = más recientes primero
      }),
      this.prisma.solicitud.count({ where }) // total real según filtros aplicados
    ])

    const solicitudesEnriquecidas = solicitudes.map((solicitud) =>
      this.enriquecerConDetalleVuelo(solicitud),
    )

    // Calculamos el total de páginas para que el cliente pueda construir la navegación
    const totalPaginas = Math.ceil(total / limit)

    return {
      success: true,
      message: 'Solicitudes obtenidas correctamente',
      data: {
        solicitudes: solicitudesEnriquecidas,
        paginacion: {
          total,         // total de registros en la BD
          totalPaginas,  // cuántas páginas existen con este limit
          paginaActual: page,
          limit,
          orden,
          filtros: {
            estado: estado ?? null,
            usuario_id: usuarioId ?? null,
          },
        }
      }
    }
  }

  /**
   * Método wrapper para buscarPorId (compatibilidad con controlador)
   */
  async buscarPorId(id: string) {
    return this.obtenerSolicitudPorId(Number(id))
  }

  /**
   * Obtener solicitud por ID
   */
  async obtenerSolicitudPorId(id: number): Promise<RespuestaApiEstandar> {
    const solicitud = await this.prisma.solicitud.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            username: true,
            numero_documento: true
          }
        },
        estado_solicitud: true,
        cotizacion: {
          include: {
            estado_cotizacion: true,
            boleto: {
              include: {
                estado_boleto: true
              }
            }
          }
        },
        detalle_vuelo_solicitud: {
          select: {
            origen: true,
            destino: true,
            preferencia_aerolinea: true,
            fecha_ida: true,
            fecha_vuelta: true,
          },
          take: 1,
          orderBy: {
            created_at: 'desc',
          },
        },
        historial_estado_solicitud: {
          include: {
            estado_solicitud: true,
            usuario: {
              select: {
                id: true,
                nombre: true,
                username: true
              }
            }
          },
          orderBy: {
            created_at: 'desc'
          }
        }
      }
    })

    if (!solicitud) {
      throw new NotFoundException(`Solicitud con ID ${id} no encontrada`)
    }

    return {
      success: true,
      message: 'Solicitud obtenida correctamente',
      data: {
        solicitud: this.enriquecerConDetalleVuelo(solicitud)
      }
    }
  }

  /**
   * 2️⃣ Admin inicia revisión - PENDIENTE → EN_REVISION
   */
  async iniciarRevision(
    solicitudId: number, 
    usuarioId: number, 
    userRole?: string,
  ): Promise<RespuestaApiEstandar> {
    await this.demoPolicyService.assertSolicitudOwnershipIfDemo(
      solicitudId,
      usuarioId,
      userRole,
    )

    //Definimos qué estados pueden pasar a "EN REVISION"
    const estadosPermitidos = ['pendiente', 'cotizacion_rechazada', 'novedad','rechazada'];
    
    // Verificar que la solicitud existe
    const solicitud = await this.prisma.solicitud.findUnique({
      where: { id: solicitudId },
      include: { estado_solicitud: true }
    })
    //console.log('Solicitud encontrada para iniciar revisión:', solicitud) // Debug

    if (!solicitud) {
      throw new NotFoundException(`Solicitud con ID ${solicitudId} no encontrada`)
    }

    // 2. Validamos si el slug actual está en esa lista
    if (!estadosPermitidos.includes(solicitud.estado_solicitud.slug)) {
      throw new BadRequestException(
        `No se puede iniciar revisión. El estado actual (${solicitud.estado_solicitud.estado}) no permite esta acción.`
      );
    }

    // Buscar estado EN_REVISION
    const estadoEnRevision = await this.prisma.estado_solicitud.findUnique({
      where: { slug: 'en_revision' }
    })

    if (!estadoEnRevision) {
      throw new NotFoundException('Estado en_revision no encontrado')
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        nombre: true,
        username: true,
        cod_empleado: true,
      },
    })

    const nombreBase = (usuario?.nombre || usuario?.username || 'USUARIO').trim()
    const nombreSistema = nombreBase.toUpperCase()
    const codEmpleado = (usuario?.cod_empleado || 'SIN_CODIGO').trim().toUpperCase()
    const msnSistema = `Revisión iniciada por ${nombreSistema} (${codEmpleado})`

    // Actualizar estado de la solicitud
    const solicitudActualizada = await this.prisma.solicitud.update({
      where: { id: solicitudId },
      data: {
        estado_actual_id: estadoEnRevision.id
      },
      include: {
        estado_solicitud: true
      }
    })

    // Registrar en historial
    await this.prisma.historial_estado_solicitud.create({
      data: {
        solicitud_id: solicitudId,
        estado_id: estadoEnRevision.id,
        usuario_id: usuarioId,
        observacion: msnSistema,
      }
    })

    return {
      success: true,
      message: 'Solicitud en revisión',
      data: {
        solicitud_id: solicitudActualizada.id,
        estado: solicitudActualizada.estado_solicitud.estado,
        msn_sistema: msnSistema,
      },
      event: {
        type: 'SOLICITUD_EN_REVISION'
      }
    }
  }

  /**
   * Rechazar solicitud (requiere comentario obligatorio)
   */
  async rechazarSolicitud(
    solicitudId: number,
    usuarioId: number,
    data: RechazarSolicitudDto,
    userRole?: string,
  ): Promise<RespuestaApiEstandar> {
    await this.demoPolicyService.assertSolicitudOwnershipIfDemo(
      solicitudId,
      usuarioId,
      userRole,
    )
    
    // Validar que el comentario no esté vacío
    if (!data.comentario || data.comentario.trim() === '') {
      throw new BadRequestException('El comentario es obligatorio para rechazar una solicitud')
    }

    // Verificar que la solicitud existe
    const solicitud = await this.prisma.solicitud.findUnique({
      where: { id: solicitudId },
      include: { estado_solicitud: true }
    })

    if (!solicitud) {
      throw new NotFoundException(`Solicitud con ID ${solicitudId} no encontrada`)
    }

    // Buscar estado RECHAZADA
    const estadoRechazada = await this.prisma.estado_solicitud.findUnique({
      where: { slug: 'rechazada' }
    })

    if (!estadoRechazada) {
      throw new NotFoundException('Estado rechazada no encontrado')
    }

    // Actualizar estado
    const solicitudActualizada = await this.prisma.solicitud.update({
      where: { id: solicitudId },
      data: {
        estado_actual_id: estadoRechazada.id
      },
      include: {
        estado_solicitud: true
      }
    })

    // Registrar en historial con el comentario
    await this.prisma.historial_estado_solicitud.create({
      data: {
        solicitud_id: solicitudId,
        estado_id: estadoRechazada.id,
        usuario_id: usuarioId,
        observacion: `RECHAZADA: ${data.comentario}`
      }
    })

    return {
      success: true,
      message: 'Solicitud rechazada correctamente',
      data: {
        solicitud_id: solicitudActualizada.id,
        estado: solicitudActualizada.estado_solicitud.estado,
        comentario: data.comentario
      },
      event: {
        type: 'SOLICITUD_RECHAZADA'
      }
    }
  }

  /**
   * Generar radicado único para la solicitud
   */
  private async generarRadicado(usuarioId: number): Promise<string> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId }
    })

    const ultimaSolicitud = await this.prisma.solicitud.findFirst({
      orderBy: { id: 'desc' }
    })

    const consecutivo = ultimaSolicitud ? ultimaSolicitud.id + 1 : 1
    const codEmpleado = usuario?.cod_empleado || 'EMP'
    
    return `${codEmpleado}-${consecutivo}`
  }

  /**
   * Cerrar solicitud de forma segura (soft-close con closed_at)
   */
  async cerrarSolicitud(
    solicitudId: number,
    data: CerrarSolicitudDto,
    userId: number,
    userRole?: string,
  ): Promise<RespuestaApiEstandar> {
    if (!Number.isInteger(solicitudId) || solicitudId <= 0) {
      throw new BadRequestException('El ID de la solicitud debe ser un número entero positivo')
    }

    if (data.confirmacion?.trim().toUpperCase() !== 'CERRAR') {
      throw new BadRequestException('Debe enviar la confirmación exacta "CERRAR" para cerrar la solicitud')
    }

    await this.demoPolicyService.assertSolicitudOwnershipIfDemo(
      solicitudId,
      userId,
      userRole,
    )

    const solicitud = await this.prisma.solicitud.findUnique({
      where: { id: solicitudId },
      select: {
        id: true,
        radicado: true,
        closed_at: true,
        estado_actual_id: true,
      },
    })

    if (!solicitud) {
      throw new NotFoundException(`Solicitud con ID ${solicitudId} no encontrada`)
    }

    if (solicitud.closed_at) {
      throw new BadRequestException('La solicitud ya se encuentra cerrada')
    }

    const estadoCerrada = await this.prisma.estado_solicitud.findUnique({
      where: { slug: 'cerrada' },
    })

    const ahora = new Date()
    const estadoFinalId = estadoCerrada?.id ?? solicitud.estado_actual_id

    await this.prisma.$transaction(async (tx) => {
      await tx.solicitud.update({
        where: { id: solicitudId },
        data: {
          closed_at: ahora,
          ...(estadoCerrada ? { estado_actual_id: estadoCerrada.id } : {}),
        },
      })

      await tx.historial_estado_solicitud.create({
        data: {
          solicitud_id: solicitudId,
          estado_id: estadoFinalId,
          usuario_id: userId,
          observacion:
            data.motivo?.trim() || 'Solicitud cerrada de forma manual con soft-close',
        },
      })
    })

    await this.demoPolicyService.decrementUsage('solicitud', userId, userRole)

    const cotizacionesRelacionadas = await this.prisma.cotizacion.findMany({
      where: { solicitud_id: solicitudId },
      include: {
        estado_cotizacion: true,
        boleto: {
          include: {
            estado_boleto: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    })

    const boletos = cotizacionesRelacionadas.flatMap((cotizacion) =>
      cotizacion.boleto.map((boleto) => ({
        boleto_id: boleto.id,
        estado_boleto: boleto.estado_boleto.estado,
        cotizacion_asociada: {
          id: cotizacion.id,
          estado: cotizacion.estado_cotizacion.estado,
          slug: cotizacion.estado_cotizacion.slug,
        },
      })),
    )

    const cotizacionesSinBoleto = cotizacionesRelacionadas
      .filter((cotizacion) => cotizacion.boleto.length === 0)
      .map((cotizacion) => ({
        cotizacion_id: cotizacion.id,
        estado: cotizacion.estado_cotizacion.estado,
        slug: cotizacion.estado_cotizacion.slug,
      }))

    const resumenCierre =
      boletos.length > 0
        ? {
            boletos,
            cotizaciones_sin_boleto: cotizacionesSinBoleto,
          }
        : {
            cotizaciones: cotizacionesRelacionadas.map((cotizacion) => ({
              cotizacion_id: cotizacion.id,
              estado: cotizacion.estado_cotizacion.estado,
              slug: cotizacion.estado_cotizacion.slug,
            })),
          }

    return {
      success: true,
      message: 'Solicitud cerrada correctamente',
      data: {
        solicitud_id: solicitud.id,
        radicado: solicitud.radicado,
        closed_at: ahora,
        motivo: data.motivo?.trim() || null,
        resumen_cierre: resumenCierre,
      },
      event: {
        type: 'SOLICITUD_CERRADA',
      },
    }
  }

  /**
   * Eliminar físicamente una solicitud y todos sus registros dependientes
   */
  async eliminarSolicitudCompletamente(
    solicitudId: number,
    data: EliminarSolicitudDto,
    userId?: number,
    userRole?: string,
  ): Promise<RespuestaApiEstandar> {
    if (typeof userId === 'number') {
      await this.demoPolicyService.assertSolicitudOwnershipIfDemo(
        solicitudId,
        userId,
        userRole,
      )
    }

    if (!Number.isInteger(solicitudId) || solicitudId <= 0) {
      throw new BadRequestException('El ID de la solicitud debe ser un número entero positivo')
    }

    if (data.confirmacion?.trim().toUpperCase() !== 'ELIMINAR') {
      throw new BadRequestException('Debe enviar la confirmación exacta "ELIMINAR" para borrar la solicitud')
    }

    const solicitud = await this.prisma.solicitud.findUnique({
      where: { id: solicitudId },
      select: {
        id: true,
        radicado: true,
        cotizacion: {
          select: {
            id: true,
            boleto: {
              select: {
                id: true,
              }
            }
          }
        }
      }
    })

    if (!solicitud) {
      throw new NotFoundException(`Solicitud con ID ${solicitudId} no encontrada`)
    }

    const cotizacionIds = solicitud.cotizacion.map((cotizacion) => cotizacion.id)
    const boletoIds = solicitud.cotizacion.flatMap((cotizacion) =>
      cotizacion.boleto.map((boleto) => boleto.id)
    )
    const cotizacionesEliminadas = cotizacionIds.length
    const boletosEliminados = boletoIds.length

    const eliminados = await this.prisma.$transaction(async (tx) => {
      const resumen = await this.eliminarDependenciasSolicitudes(
        tx,
        [solicitudId],
        cotizacionIds,
        boletoIds,
      )

      await tx.solicitud.delete({
        where: { id: solicitudId }
      })

      return {
        ...resumen,
        solicitudes: 1,
      }
    })

    if (typeof userId === 'number') {
      await this.demoPolicyService.decrementUsage('solicitud', userId, userRole)
      await this.demoPolicyService.decrementUsageByAmount(
        'cotizacion',
        userId,
        cotizacionesEliminadas,
        userRole,
      )
      await this.demoPolicyService.decrementUsageByAmount(
        'boleto',
        userId,
        boletosEliminados,
        userRole,
      )
    }

    return {
      success: true,
      message: 'Solicitud eliminada completamente de la base de datos',
      data: {
        solicitud_id: solicitud.id,
        radicado: solicitud.radicado,
        motivo: data.motivo?.trim() || null,
        eliminados,
      },
      event: {
        type: 'SOLICITUD_ELIMINADA_COMPLETAMENTE'
      }
    }
  }

  /**
   * Eliminar físicamente todas las solicitudes y sus registros dependientes
   */
  async eliminarTodasLasSolicitudes(
    data: EliminarTodasSolicitudesDto,
  ): Promise<RespuestaApiEstandar> {
    if (data.confirmacion?.trim().toUpperCase() !== 'ELIMINAR_TODAS') {
      throw new BadRequestException('Debe enviar la confirmación exacta "ELIMINAR_TODAS" para borrar todas las solicitudes')
    }

    const solicitudes = await this.prisma.solicitud.findMany({
      select: {
        id: true,
        radicado: true,
        cotizacion: {
          select: {
            id: true,
            boleto: {
              select: {
                id: true,
              }
            }
          }
        }
      }
    })

    const solicitudIds = solicitudes.map((solicitud) => solicitud.id)
    const cotizacionIds = solicitudes.flatMap((solicitud) =>
      solicitud.cotizacion.map((cotizacion) => cotizacion.id)
    )
    const boletoIds = solicitudes.flatMap((solicitud) =>
      solicitud.cotizacion.flatMap((cotizacion) =>
        cotizacion.boleto.map((boleto) => boleto.id)
      )
    )

    const eliminados = await this.prisma.$transaction(async (tx) => {
      const resumen = await this.eliminarDependenciasSolicitudes(
        tx,
        solicitudIds,
        cotizacionIds,
        boletoIds,
      )

      const solicitudesEliminadas = await tx.solicitud.deleteMany({
        where: {
          id: {
            in: solicitudIds,
          }
        }
      })

      return {
        ...resumen,
        solicitudes: solicitudesEliminadas.count,
      }
    })

    let indicesReiniciados: string[] = []

    if (data.reiniciar_indices) {
      indicesReiniciados = await this.reiniciarAutoIncrementTablasSolicitudes()
    }

    return {
      success: true,
      message: 'Todas las solicitudes fueron eliminadas completamente de la base de datos',
      data: {
        total_solicitudes_encontradas: solicitudIds.length,
        radicados_eliminados: solicitudes.map((solicitud) => solicitud.radicado),
        motivo: data.motivo?.trim() || null,
        reiniciar_indices: Boolean(data.reiniciar_indices),
        tablas_con_indices_reiniciados: indicesReiniciados,
        eliminados,
      },
      event: {
        type: 'TODAS_LAS_SOLICITUDES_ELIMINADAS_COMPLETAMENTE'
      }
    }
  }

  /**
   * Eliminar físicamente todas las solicitudes de un usuario y sus registros dependientes
   */
  async eliminarSolicitudesPorUsuario(
    usuarioId: number,
    data: EliminarSolicitudesUsuarioDto,
  ): Promise<RespuestaApiEstandar> {
    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      throw new BadRequestException('El ID del usuario debe ser un número entero positivo')
    }

    if (data.confirmacion?.trim().toUpperCase() !== 'ELIMINAR_USUARIO') {
      throw new BadRequestException('Debe enviar la confirmación exacta "ELIMINAR_USUARIO" para borrar por usuario')
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        nombre: true,
        username: true,
        rol: true,
      },
    })

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${usuarioId} no encontrado`)
    }

    const solicitudes = await this.prisma.solicitud.findMany({
      where: { usuario_id: usuarioId },
      select: {
        id: true,
        radicado: true,
        cotizacion: {
          select: {
            id: true,
            boleto: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    })

    const solicitudIds = solicitudes.map((solicitud) => solicitud.id)
    const cotizacionIds = solicitudes.flatMap((solicitud) =>
      solicitud.cotizacion.map((cotizacion) => cotizacion.id),
    )
    const boletoIds = solicitudes.flatMap((solicitud) =>
      solicitud.cotizacion.flatMap((cotizacion) =>
        cotizacion.boleto.map((boleto) => boleto.id),
      ),
    )

    const eliminados = await this.prisma.$transaction(async (tx) => {
      const resumen = await this.eliminarDependenciasSolicitudes(
        tx,
        solicitudIds,
        cotizacionIds,
        boletoIds,
      )

      const solicitudesEliminadas = solicitudIds.length
        ? await tx.solicitud.deleteMany({
            where: {
              id: {
                in: solicitudIds,
              },
            },
          })
        : { count: 0 }

      return {
        ...resumen,
        solicitudes: solicitudesEliminadas.count,
      }
    })

    let indicesReiniciados: string[] = []

    if (data.reiniciar_indices) {
      indicesReiniciados = await this.reiniciarAutoIncrementTablasSolicitudes()
    }

    return {
      success: true,
      message: 'Solicitudes del usuario eliminadas completamente de la base de datos',
      data: {
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          username: usuario.username,
          rol: usuario.rol,
        },
        total_solicitudes_encontradas: solicitudIds.length,
        radicados_eliminados: solicitudes.map((solicitud) => solicitud.radicado),
        motivo: data.motivo?.trim() || null,
        reiniciar_indices: Boolean(data.reiniciar_indices),
        tablas_con_indices_reiniciados: indicesReiniciados,
        eliminados,
      },
      event: {
        type: 'SOLICITUDES_USUARIO_ELIMINADAS_COMPLETAMENTE',
      },
    }
  }

  /////  helper de borrado en cascada para eliminar dependencias de solicitudes, cotizaciones y boletos
  private async eliminarDependenciasSolicitudes(
    tx: Prisma.TransactionClient,
    solicitudIds: number[],
    cotizacionIds: number[],
    boletoIds: number[],
  ) {
    const historialBoletosEliminados = boletoIds.length
      ? await tx.historial_estado_boleto.deleteMany({
          where: {
            boleto_id: {
              in: boletoIds,
            }
          }
        })
      : { count: 0 }

    const segmentosBoletosEliminados = boletoIds.length
      ? await tx.segmento_boleto.deleteMany({
          where: {
            boleto_id: {
              in: boletoIds,
            }
          }
        })
      : { count: 0 }

    if (boletoIds.length) {
      await tx.boleto.updateMany({
        where: {
          id: {
            in: boletoIds,
          }
        },
        data: {
          reemplaza_boleto_id: null,
        }
      })
    }

    const boletosEliminados = boletoIds.length
      ? await tx.boleto.deleteMany({
          where: {
            id: {
              in: boletoIds,
            }
          }
        })
      : { count: 0 }

    const historialCotizacionesEliminados = cotizacionIds.length
      ? await tx.historial_estado_cotizacion.deleteMany({
          where: {
            cotizacion_id: {
              in: cotizacionIds,
            }
          }
        })
      : { count: 0 }

    const segmentosEliminados = cotizacionIds.length
      ? await tx.segmento_cotizacion.deleteMany({
          where: {
            cotizacion_id: {
              in: cotizacionIds,
            }
          }
        })
      : { count: 0 }

    if (cotizacionIds.length) {
      await tx.cotizacion.updateMany({
        where: {
          id: {
            in: cotizacionIds,
          }
        },
        data: {
          cotizacion_anterior_id: null,
        }
      })
    }

    const cotizacionesEliminadas = cotizacionIds.length
      ? await tx.cotizacion.deleteMany({
          where: {
            id: {
              in: cotizacionIds,
            }
          }
        })
      : { count: 0 }

    const detallesEliminados = solicitudIds.length
      ? await tx.detalle_vuelo_solicitud.deleteMany({
          where: {
            solicitud_id: {
              in: solicitudIds,
            }
          }
        })
      : { count: 0 }

    const historialSolicitudEliminado = solicitudIds.length
      ? await tx.historial_estado_solicitud.deleteMany({
          where: {
            solicitud_id: {
              in: solicitudIds,
            }
          }
        })
      : { count: 0 }

    return {
      historial_boletos: historialBoletosEliminados.count,
      segmentos_boleto: segmentosBoletosEliminados.count,
      boletos: boletosEliminados.count,
      historial_cotizaciones: historialCotizacionesEliminados.count,
      segmentos_cotizacion: segmentosEliminados.count,
      cotizaciones: cotizacionesEliminadas.count,
      detalle_vuelo_solicitud: detallesEliminados.count,
      historial_solicitud: historialSolicitudEliminado.count,
    }
  }

  private async reiniciarAutoIncrementTablasSolicitudes(): Promise<string[]> {
    for (const tabla of this.tablasReiniciables) {
      await this.prisma.$executeRawUnsafe(`ALTER TABLE ${tabla} AUTO_INCREMENT = 1`)
    }

    return this.tablasReiniciables
  }
}
