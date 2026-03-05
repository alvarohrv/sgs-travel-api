import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import { CrearSolicitudDto } from './dto/crear-solicitud.dto'
import { IniciarRevisionDto } from './dto/iniciar-revision.dto'
import { RechazarSolicitudDto } from './dto/rechazar-solicitud.dto'
import { RespuestaApiEstandar } from './interfaces/respuesta-api.interface'

@Injectable()
export class SolicitudService {
  constructor(private prisma: PrismaService) {}

  /**
   * 1️⃣ Crear solicitud - Estado inicial: PENDIENTE
   */
  async crearSolicitud(data: CrearSolicitudDto, usuarioId: number): Promise<RespuestaApiEstandar> {
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
   * Obtener todas las solicitudes
   */
  async obtenerSolicitudes(): Promise<RespuestaApiEstandar> {
    const solicitudes = await this.prisma.solicitud.findMany({
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            username: true,
          }
        },
        estado_solicitud: true,
        cotizacion: {
          include: {
            estado_cotizacion: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    return {
      success: true,
      message: 'Solicitudes obtenidas correctamente',
      data: {
        solicitudes,
        total: solicitudes.length
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
        solicitud
      }
    }
  }

  /**
   * 2️⃣ Admin inicia revisión - PENDIENTE → EN_REVISION
   */
  async iniciarRevision(
    solicitudId: number, 
    usuarioId: number, 
    data?: IniciarRevisionDto
  ): Promise<RespuestaApiEstandar> {

    //Definimos qué estados pueden pasar a "EN REVISION"
    const estadosPermitidos = ['pendiente', 'cotizacion_rechazada', 'novedad'];
    
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
        observacion: data?.observacion || 'Administrador inició revisión de la solicitud'
      }
    })

    return {
      success: true,
      message: 'Solicitud en revisión',
      data: {
        solicitud_id: solicitudActualizada.id,
        estado: solicitudActualizada.estado_solicitud.estado
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
    data: RechazarSolicitudDto
  ): Promise<RespuestaApiEstandar> {
    
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
}
