/*
═══════════════════════════════════════════════════════════════════════════
  CONTROLADOR: COTIZACION
  Gestión del ciclo de vida de cotizaciones de vuelo
═══════════════════════════════════════════════════════════════════════════

📋 ENDPOINTS DISPONIBLES:

┌─────────────────────────────────────────────────────────────────────────┐
│ ACCIONES DEL FLUJO DE NEGOCIO                                           │
└─────────────────────────────────────────────────────────────────────────┘

  1️⃣  POST   /solicitud/:solicitudId/cotizacion
      ➤ Admin carga cotización sobre una solicitud (EN_REVISION)
      ➤ Si cotizacion_anterior_id = null  → cotización nueva
      ➤ Si cotizacion_anterior_id = id    → reemplaza y anula la anterior
      ➤ Body: { cotizacion_anterior_id, aerolinea, valor_total, moneda, cobertura, detalle? }
      ➤ Efecto: solicitud → COTIZACION_CARGADA
      ➤ Evento: COTIZACION_CREADA | COTIZACION_REEMPLAZADA

  2️⃣  POST   /cotizacion/:id/rechazar
      ➤ Empleado rechaza una cotización (comentario obligatorio)
      ➤ Body: { comentario: string }
      ➤ Efecto: solicitud → EN_REVISION
      ➤ Evento: COTIZACION_RECHAZADA

  3️⃣  POST   /cotizacion/:id/seleccionar
      ➤ Empleado selecciona cotización como opción primaria o secundaria
      ➤ Body: { preferencia: 'OPCION_PRIMARIA' | 'OPCION_SECUNDARIA' }
      ➤ Efecto: solicitud → PENDIENTE (pendiente de emisión de boleto)
      ➤ Evento: COTIZACION_OPCION_PRIMARIA | COTIZACION_OPCION_SECUNDARIA

  4️⃣  POST   /cotizacion/:id/novedad
      ➤ Empleado o Admin reportan novedad (comentario obligatorio)
      ➤ Body: { comentario: string }
      ➤ Efecto: solicitud → NOVEDAD
      ➤ Evento: COTIZACION_NOVEDAD

┌─────────────────────────────────────────────────────────────────────────┐
│ CONSULTAS                                                                │
└─────────────────────────────────────────────────────────────────────────┘

  5️⃣  GET    /solicitud/:solicitudId/cotizacion
      ➤ Listar todas las cotizaciones de una solicitud
      ➤ Incluye: estado, historial

  6️⃣  GET    /cotizacion/:id
      ➤ Obtener cotización específica por ID
      ➤ Incluye: solicitud, estado, boletos, historial completo

═══════════════════════════════════════════════════════════════════════════
*/

import { Body, Controller, Get, Post, Param } from '@nestjs/common'
import { CotizacionService } from './cotizacion.service'
import { CrearCotizacionDto } from './dto/crear-cotizacion.dto'
import { RechazarCotizacionDto } from './dto/rechazar-cotizacion.dto'
import { SeleccionarCotizacionDto } from './dto/seleccionar-cotizacion.dto'
import { NovedadCotizacionDto } from './dto/novedad-cotizacion.dto'

@Controller()
export class CotizacionController {
  constructor(private readonly cotizacionService: CotizacionService) {}

  // ========== ACCIONES DEL FLUJO ==========

  // 1️⃣ Admin carga cotización sobre una solicitud
  // POST /solicitud/:solicitudId/cotizacion
  @Post('solicitud/:solicitudId/cotizacion')
  async crearCotizacion(
    @Param('solicitudId') solicitudId: string,
    @Body() data: CrearCotizacionDto
  ) {
    // TODO: Obtener usuarioId del token JWT cuando se implemente autenticación
    const usuarioId = 1 // Temporal: usuario administrador hardcoded
    return this.cotizacionService.crearCotizacion(Number(solicitudId), usuarioId, data)
  }

  // 2️⃣ Empleado rechaza cotización (comentario obligatorio)
  // POST /cotizacion/:id/rechazar
  @Post('cotizacion/:id/rechazar')
  async rechazarCotizacion(
    @Param('id') id: string,
    @Body() data: RechazarCotizacionDto
  ) {
    // TODO: Obtener usuarioId del token JWT cuando se implemente autenticación
    const usuarioId = 1 // Temporal: hardcoded
    return this.cotizacionService.rechazarCotizacion(Number(id), usuarioId, data)
  }

  // 3️⃣ Empleado selecciona cotización (opción primaria o secundaria)
  // POST /cotizacion/:id/seleccionar
  @Post('cotizacion/:id/seleccionar')
  async seleccionarCotizacion(
    @Param('id') id: string,
    @Body() data: SeleccionarCotizacionDto
  ) {
    // TODO: Obtener usuarioId del token JWT cuando se implemente autenticación
    const usuarioId = 1 // Temporal: hardcoded
    return this.cotizacionService.seleccionarCotizacion(Number(id), usuarioId, data)
  }

  // 4️⃣ Empleado o Admin reportan novedad en cotización (comentario obligatorio)
  // POST /cotizacion/:id/novedad
  @Post('cotizacion/:id/novedad')
  async reportarNovedad(
    @Param('id') id: string,
    @Body() data: NovedadCotizacionDto
  ) {
    // TODO: Obtener usuarioId del token JWT cuando se implemente autenticación
    const usuarioId = 1 // Temporal: hardcoded
    return this.cotizacionService.reportarNovedad(Number(id), usuarioId, data)
  }

  // ========== CONSULTAS ==========

  // 5️⃣ Listar cotizaciones de una solicitud
  // GET /solicitud/:solicitudId/cotizacion
  @Get('solicitud/:solicitudId/cotizacion')
  async obtenerPorSolicitud(@Param('solicitudId') solicitudId: string) {
    return this.cotizacionService.obtenerPorSolicitud(Number(solicitudId))
  }

  // 6️⃣ Obtener cotización por ID
  // GET /cotizacion/:id
  @Get('cotizacion/:id')
  async obtenerPorId(@Param('id') id: string) {
    return this.cotizacionService.obtenerPorId(Number(id))
  }
}

