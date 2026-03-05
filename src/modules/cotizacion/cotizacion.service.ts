import { 
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CrearCotizacionDto } from './dto/crear-cotizacion.dto';
import { RechazarCotizacionDto } from './dto/rechazar-cotizacion.dto';
import { SeleccionarCotizacionDto } from './dto/seleccionar-cotizacion.dto';
import { NovedadCotizacionDto } from './dto/novedad-cotizacion.dto';

// Estados de cotización que permiten ser rechazadas por el empleado
const ESTADOS_COTIZACION_RECHAZABLE = [
  'cotizacion_nueva',
  'opcion_primaria',
  'opcion_secundaria',
];

// Estados de solicitud que permiten recibir cotizaciones
const ESTADOS_SOLICITUD_PARA_COTIZAR = ['en_revision','novedad','cotizacion_cargada']; // nota: se permite cargar cotización incluso si la solicitud tiene novedad, para facilitar corrección de errores o si ya hay una cotización cargada pero se necesita reemplazarla o añadir una nueva.

@Injectable()
export class CotizacionService {
  constructor(private prisma: PrismaService) {}

  /**
   * 3️⃣ Admin carga cotización sobre una solicitud
   * URL: POST /solicitud/:solicitudId/cotizacion
   * - Si cotizacion_anterior_id = null  → cotización nueva
   * - Si cotizacion_anterior_id = id    → reemplaza la anterior (la anula)
   * Transición solicitud: EN_REVISION → COTIZACION_CARGADA
   */
  async crearCotizacion(
    solicitudId: number,
    usuarioId: number,
    data: CrearCotizacionDto,
  ) {
    // Verificar que la solicitud existe y está en estado válido
    const solicitud = await this.prisma.solicitud.findUnique({
      where: { id: solicitudId },
      include: { estado_solicitud: true },
    });
    console.log('Solicitud encontrada:', solicitud); // Debug: Verificar que la solicitud se encuentra correctamente

    if (!solicitud) {
      throw new NotFoundException(
        `Solicitud con ID ${solicitudId} no encontrada`,
      );
    }

    if (
      !ESTADOS_SOLICITUD_PARA_COTIZAR.includes(solicitud.estado_solicitud.slug)
    ) {
      throw new BadRequestException(
        `No se puede cargar cotización. La solicitud está en estado: ${solicitud.estado_solicitud.estado}`,
      );
    }

    // Obtener estados necesarios
    const [
      estadoCotizacionNueva,
      estadoCotizacionAnulada,
      estadoSolicitudCotizacionCargada,
    ] = await Promise.all([
      this.prisma.estado_cotizacion.findUnique({
        where: { slug: 'cotizacion_nueva' },
      }), // estado inicial para nuevas cotizaciones
      this.prisma.estado_cotizacion.findUnique({
        where: { slug: 'cotizacion_anulada' },
      }), // cotización anulada para reemplazos
      this.prisma.estado_solicitud.findUnique({
        where: { slug: 'cotizacion_cargada' },
      }), // estado de solicitud cuando se carga una cotización
    ]);

    if (
      !estadoCotizacionNueva ||
      !estadoCotizacionAnulada ||
      !estadoSolicitudCotizacionCargada
    ) {
      throw new NotFoundException(
        'Estados requeridos no encontrados en la base de datos',
      );
    }

    // Si reemplaza una cotización anterior, validar y anularla
    if (
      data.cotizacion_anterior_id !== null &&
      data.cotizacion_anterior_id !== undefined
    ) {
      const cotizacionAnterior = await this.prisma.cotizacion.findUnique({
        where: { id: data.cotizacion_anterior_id },
        include: { estado_cotizacion: true },
      });

      if (!cotizacionAnterior) {
        throw new NotFoundException(
          `Cotización anterior con ID ${data.cotizacion_anterior_id} no encontrada`,
        );
      }

      if (cotizacionAnterior.solicitud_id !== solicitudId) {
        throw new BadRequestException(
          'La cotización anterior no pertenece a esta solicitud',
        );
      }

      // Anular cotización anterior (en caso de remplzao)
      await this.prisma.cotizacion.update({
        where: { id: data.cotizacion_anterior_id },
        data: { estado_actual_id: estadoCotizacionAnulada.id },
      });

      // Registrar historial de cambio en cotización anterior
      await this.prisma.historial_estado_cotizacion.create({
        data: {
          cotizacion_id: data.cotizacion_anterior_id,
          estado_id: estadoCotizacionAnulada.id,
          usuario_id: usuarioId,
          observacion: `Anulada por reemplazo con nueva cotización`,
        },
      });
    }

    // Crear la nueva cotización
    const cotizacion = await this.prisma.cotizacion.create({
      data: {
        solicitud_id: solicitudId,
        cotizacion_anterior_id: data.cotizacion_anterior_id ?? null,
        estado_actual_id: estadoCotizacionNueva.id,
        aerolinea: data.aerolinea,
        valor_total: data.valor_total,
        cobertura: data.cobertura,
      },
      include: { estado_cotizacion: true },
    });

    // Registrar historial de la nueva cotización
    await this.prisma.historial_estado_cotizacion.create({
      data: {
        cotizacion_id: cotizacion.id,
        estado_id: estadoCotizacionNueva.id,
        usuario_id: usuarioId,
        observacion: `Cotización cargada - ${data.aerolinea} - ${data.cobertura} - $${data.valor_total} ${data.moneda}`,
      },
    });

    // Persistir segmentos de vuelo
    if (data.detalle) {
      const segmentos: {
        cotizacion_id: number;
        tipo_segmento: 'IDA' | 'VUELTA';
        numero_vuelo: string;
        fecha_vuelo: Date;
        clase_tarifaria: string | null;
        politica_equipaje: string | null;
      }[] = [
        {
          cotizacion_id: cotizacion.id,
          tipo_segmento: 'IDA',
          numero_vuelo: data.detalle.ida.vuelo,
          fecha_vuelo: new Date(data.detalle.ida.fecha),
          clase_tarifaria: data.detalle.ida.clase_tarifaria ?? null,
          politica_equipaje: data.detalle.ida.politica_equipaje ?? null,
        },
      ];
      if (data.detalle.vuelta) {
        segmentos.push({
          cotizacion_id: cotizacion.id,
          tipo_segmento: 'VUELTA',
          numero_vuelo: data.detalle.vuelta.vuelo,
          fecha_vuelo: new Date(data.detalle.vuelta.fecha),
          clase_tarifaria: data.detalle.vuelta.clase_tarifaria ?? null,
          politica_equipaje: data.detalle.vuelta.politica_equipaje ?? null,
        });
      }
      await this.prisma.segmento_cotizacion.createMany({ data: segmentos });
    }

    // Actualizar estado de la solicitud → COTIZACION_CARGADA
    await this.prisma.solicitud.update({
      where: { id: solicitudId },
      data: { estado_actual_id: estadoSolicitudCotizacionCargada.id },
    });

    // Registrar historial de la solicitud
    await this.prisma.historial_estado_solicitud.create({
      data: {
        solicitud_id: solicitudId,
        estado_id: estadoSolicitudCotizacionCargada.id,
        usuario_id: usuarioId,
        observacion: `Cotización #${cotizacion.id} cargada por administrador`,
      },
    });

    const esReemplazo =
      data.cotizacion_anterior_id !== null &&
      data.cotizacion_anterior_id !== undefined;

    return {
      success: true,
      message: esReemplazo
        ? 'Cotización reemplazada correctamente'
        : 'Cotización creada correctamente',
      data: {
        cotizacion: {
          id: cotizacion.id,
          solicitud_id: cotizacion.solicitud_id,
          cotizacion_anterior_id: cotizacion.cotizacion_anterior_id,
          estado: cotizacion.estado_cotizacion.estado,
          aerolinea: cotizacion.aerolinea,
          valor_total: cotizacion.valor_total,
          moneda: data.moneda,
          cobertura: cotizacion.cobertura,
          detalle: data.detalle ?? null,
          created_at: cotizacion.created_at,
        },
      },
      event: {
        type: esReemplazo ? 'COTIZACION_REEMPLAZADA' : 'COTIZACION_CREADA',
        affected_entities: [
          ...(esReemplazo
            ? [
                {
                  entity: 'cotizacion',
                  id: data.cotizacion_anterior_id,
                  new_state: 'COTIZACION ANULADA',
                },
              ]
            : []),
          {
            entity: 'solicitud',
            id: solicitudId,
            new_state: 'COTIZACION CARGADA',
          },
        ],
      },
    };
  }

  /**
   * 4️⃣ Empleado rechaza una cotización (comentario obligatorio)
   * URL: POST /cotizacion/:id/rechazar
   * Transición cotización: COTIZACION_NUEVA → COTIZACION_RECHAZADA
   * Efecto colateral: solicitud → EN_REVISION
   */
  async rechazarCotizacion(
    cotizacionId: number,
    usuarioId: number,
    data: RechazarCotizacionDto,
  ) {
    if (!data.comentario || data.comentario.trim() === '') {
      throw new BadRequestException(
        'El comentario es obligatorio para rechazar una cotización',
      );
    }

    const cotizacion = await this.prisma.cotizacion.findUnique({
      where: { id: cotizacionId },
      include: {
        estado_cotizacion: true,
        solicitud: { include: { estado_solicitud: true } },
      },
    });

    if (!cotizacion) {
      throw new NotFoundException(
        `Cotización con ID ${cotizacionId} no encontrada`,
      );
    }

    if (
      !ESTADOS_COTIZACION_RECHAZABLE.includes(cotizacion.estado_cotizacion.slug)
    ) {
      throw new BadRequestException(
        `No se puede rechazar. La cotización está en estado: ${cotizacion.estado_cotizacion.estado}`,
      );
    }

    // Obtener estados necesarios
    const [estadoCotizacionRechazada, estadoSolicitudEnRevision] =
      await Promise.all([
        this.prisma.estado_cotizacion.findUnique({
          where: { slug: 'cotizacion_rechazada' },
        }),
        this.prisma.estado_solicitud.findUnique({
          where: { slug: 'en_revision' },
        }),
      ]);

    if (!estadoCotizacionRechazada || !estadoSolicitudEnRevision) {
      throw new NotFoundException(
        'Estados requeridos no encontrados en la base de datos',
      );
    }

    // Actualizar estado de la cotización → COTIZACION_RECHAZADA
    await this.prisma.cotizacion.update({
      where: { id: cotizacionId },
      data: { estado_actual_id: estadoCotizacionRechazada.id },
    });

    // Registrar historial de cotización con el comentario
    await this.prisma.historial_estado_cotizacion.create({
      data: {
        cotizacion_id: cotizacionId,
        estado_id: estadoCotizacionRechazada.id,
        usuario_id: usuarioId,
        observacion: `RECHAZADA: ${data.comentario}`,
      },
    });

    // Actualizar estado de la solicitud → EN_REVISION
    await this.prisma.solicitud.update({
      where: { id: cotizacion.solicitud_id },
      data: { estado_actual_id: estadoSolicitudEnRevision.id },
    });

    // Registrar historial de la solicitud
    await this.prisma.historial_estado_solicitud.create({
      data: {
        solicitud_id: cotizacion.solicitud_id,
        estado_id: estadoSolicitudEnRevision.id,
        usuario_id: usuarioId,
        observacion: `Cotización #${cotizacionId} rechazada: ${data.comentario}`,
      },
    });

    return {
      success: true,
      message: 'Cotización rechazada correctamente',
      data: {
        cotizacion: {
          id: cotizacionId,
          estado: estadoCotizacionRechazada.estado,
        },
        comentario: data.comentario,
      },
      event: {
        type: 'COTIZACION_RECHAZADA',
        affected_entities: [
          {
            entity: 'solicitud',
            id: cotizacion.solicitud_id,
            new_state: 'EN REVISION',
          },
        ],
      },
    };
  }

  /**
   * 4️⃣ Empleado selecciona cotización como opción primaria o secundaria
   * URL: POST /cotizacion/:id/seleccionar
   * Transición: COTIZACION_NUEVA → OPCION_PRIMARIA | OPCION_SECUNDARIA
   * Efecto colateral: solicitud → PENDIENTE (pendiente de emisión de boleto)
   */
  async seleccionarCotizacion(
    cotizacionId: number,
    usuarioId: number,
    data: SeleccionarCotizacionDto,
  ) {
    const cotizacion = await this.prisma.cotizacion.findUnique({
      where: { id: cotizacionId },
      include: { estado_cotizacion: true },
    });

    if (!cotizacion) {
      throw new NotFoundException(
        `Cotización con ID ${cotizacionId} no encontrada`,
      );
    }

    if (cotizacion.estado_cotizacion.slug !== 'cotizacion_nueva') {
      throw new BadRequestException(
        `Solo se pueden seleccionar cotizaciones en estado COTIZACION NUEVA. Estado actual: ${cotizacion.estado_cotizacion.estado}`,
      );
    }

    const slugNuevoEstado =
      data.preferencia === 'OPCION_PRIMARIA'
        ? 'opcion_primaria'
        : 'opcion_secundaria';

    const [estadoNuevoCotizacion, estadoSolicitudPendiente] = await Promise.all(
      [
        this.prisma.estado_cotizacion.findUnique({
          where: { slug: slugNuevoEstado },
        }),
        this.prisma.estado_solicitud.findUnique({
          where: { slug: 'pendiente' },
        }),
      ],
    );

    if (!estadoNuevoCotizacion || !estadoSolicitudPendiente) {
      throw new NotFoundException(
        'Estados requeridos no encontrados en la base de datos',
      );
    }

    // Actualizar estado de la cotización
    await this.prisma.cotizacion.update({
      where: { id: cotizacionId },
      data: { estado_actual_id: estadoNuevoCotizacion.id },
    });

    await this.prisma.historial_estado_cotizacion.create({
      data: {
        cotizacion_id: cotizacionId,
        estado_id: estadoNuevoCotizacion.id,
        usuario_id: usuarioId,
        observacion: `Seleccionada como ${data.preferencia} por el solicitante`,
      },
    });

    // Actualizar solicitud → PENDIENTE (pendiente de emisión de boleto)
    await this.prisma.solicitud.update({
      where: { id: cotizacion.solicitud_id },
      data: { estado_actual_id: estadoSolicitudPendiente.id },
    });

    await this.prisma.historial_estado_solicitud.create({
      data: {
        solicitud_id: cotizacion.solicitud_id,
        estado_id: estadoSolicitudPendiente.id,
        usuario_id: usuarioId,
        observacion: `Cotización #${cotizacionId} seleccionada como ${data.preferencia}. Pendiente de emisión de boleto`,
      },
    });

    return {
      success: true,
      message: `Cotización seleccionada como ${data.preferencia}`,
      data: {
        cotizacion: {
          id: cotizacionId,
          estado: estadoNuevoCotizacion.estado,
        },
      },
      event: {
        type: `COTIZACION_${data.preferencia}`,
        affected_entities: [
          {
            entity: 'solicitud',
            id: cotizacion.solicitud_id,
            new_state: 'PENDIENTE',
          },
        ],
      },
    };
  }

  /**
   * Empleado o Admin reporta novedad en cotización (comentario obligatorio)
   * URL: POST /cotizacion/:id/novedad
   * Transición: * → NOVEDAD
   * Efecto colateral: solicitud → NOVEDAD
   */
  async reportarNovedad(
    cotizacionId: number,
    usuarioId: number,
    data: NovedadCotizacionDto,
  ) {
    if (!data.comentario || data.comentario.trim() === '') {
      throw new BadRequestException(
        'El comentario es obligatorio para reportar una novedad',
      );
    }

    const cotizacion = await this.prisma.cotizacion.findUnique({
      where: { id: cotizacionId },
      include: { estado_cotizacion: true },
    });

    if (!cotizacion) {
      throw new NotFoundException(
        `Cotización con ID ${cotizacionId} no encontrada`,
      );
    }

    const [estadoNovedadCotizacion, estadoNovedadSolicitud] = await Promise.all(
      [
        this.prisma.estado_cotizacion.findUnique({
          where: { slug: 'novedad' },
        }),
        this.prisma.estado_solicitud.findUnique({ where: { slug: 'novedad' } }),
      ],
    );

    if (!estadoNovedadCotizacion || !estadoNovedadSolicitud) {
      throw new NotFoundException(
        'Estado NOVEDAD no encontrado en la base de datos',
      );
    }

    await this.prisma.cotizacion.update({
      where: { id: cotizacionId },
      data: { estado_actual_id: estadoNovedadCotizacion.id },
    });

    await this.prisma.historial_estado_cotizacion.create({
      data: {
        cotizacion_id: cotizacionId,
        estado_id: estadoNovedadCotizacion.id,
        usuario_id: usuarioId,
        observacion: `NOVEDAD: ${data.comentario}`,
      },
    });

    await this.prisma.solicitud.update({
      where: { id: cotizacion.solicitud_id },
      data: { estado_actual_id: estadoNovedadSolicitud.id },
    });

    await this.prisma.historial_estado_solicitud.create({
      data: {
        solicitud_id: cotizacion.solicitud_id,
        estado_id: estadoNovedadSolicitud.id,
        usuario_id: usuarioId,
        observacion: `Novedad en cotización #${cotizacionId}: ${data.comentario}`,
      },
    });

    return {
      success: true,
      message: 'Novedad registrada correctamente',
      data: {
        cotizacion: {
          id: cotizacionId,
          estado: estadoNovedadCotizacion.estado,
        },
        comentario: data.comentario,
      },
      event: {
        type: 'COTIZACION_NOVEDAD',
        affected_entities: [
          {
            entity: 'solicitud',
            id: cotizacion.solicitud_id,
            new_state: 'NOVEDAD',
          },
        ],
      },
    };
  }

  /**
   * Obtener cotizaciones de una solicitud
   * URL: GET /solicitud/:solicitudId/cotizacion
   */
  async obtenerPorSolicitud(solicitudId: number) {
    const cotizaciones = await this.prisma.cotizacion.findMany({
      where: { solicitud_id: solicitudId },
      include: {
        estado_cotizacion: true,
        historial_estado_cotizacion: {
          include: {
            estado_cotizacion: true,
            usuario: { select: { id: true, nombre: true, username: true } },
          },
          orderBy: { created_at: 'desc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return {
      success: true,
      message: 'Cotizaciones obtenidas correctamente',
      data: { cotizaciones, total: cotizaciones.length },
    };
  }

  /**
   * Obtener cotización por ID
   * URL: GET /cotizacion/:id
   */
  async obtenerPorId(id: number) {
    const cotizacion = await this.prisma.cotizacion.findUnique({
      where: { id },
      include: {
        estado_cotizacion: true,
        solicitud: { include: { estado_solicitud: true } },
        boleto: { include: { estado_boleto: true } },
        historial_estado_cotizacion: {
          include: {
            estado_cotizacion: true,
            usuario: { select: { id: true, nombre: true, username: true } },
          },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!cotizacion) {
      throw new NotFoundException(`Cotización con ID ${id} no encontrada`);
    }

    return {
      success: true,
      message: 'Cotización obtenida correctamente',
      data: { cotizacion },
    };
  }
}
