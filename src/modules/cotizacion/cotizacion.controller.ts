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

    3️⃣  POST   /solicitud/:solicitudId/seleccionar-cotizacion
      ➤ Empleado selecciona cotización primaria y opcionalmente secundaria
      ➤ Body: { cotizacion_primaria_id, cotizacion_secundaria_id?, comentario? }
      ➤ Efecto: solicitud → EN_REVISION y las demás cotizaciones → COTIZACION DESCARTADA
      ➤ Evento: COTIZACIONES_SELECCIONADAS

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
import { ReemplazarCotizacionDto } from './dto/reemplazar-cotizacion.dto'
import { RechazarCotizacionDto } from './dto/rechazar-cotizacion.dto'
import { SeleccionarCotizacionDto } from './dto/seleccionar-cotizacion.dto'
import { NovedadCotizacionDto } from './dto/novedad-cotizacion.dto'

@Controller()
export class CotizacionController {
  constructor(private readonly cotizacionService: CotizacionService) {}

  // ========== ACCIONES DEL FLUJO ==========

  // 1️⃣.1 Admin carga cotización sobre una solicitud
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

  /*
  DESCRIPCIÓN: Admin carga una nueva cotización para una solicitud que está en revisión o ya con cotizacion cargada. Si se proporciona un cotizacion_anterior_id, la nueva cotización reemplaza a la anterior y esta última queda anulada. La solicitud pasa a estado "COTIZACION CARGADA" y queda pendiente de revisión por parte del empleado.

  Nota: La cotizacion es flexible en cuanto a su detalle en cuanto a fechas, vuelos, cobertura, etc Sera el admin quien puede 

  ENDPOINT: POST /solicitud/:solicitudId/cotizacion
              Ej: POST http://localhost:3000/solicitud/2/cotizacion
  BODY (nueva cotización):
  {
    "cotizacion_anterior_id": null,
    "aerolinea": "Wingo",
    "valor_total": 850000,
    "moneda": "COP",
    "cobertura": "IDA_Y_VUELTA",
    "detalle": {
      "ida": {
        "fecha": "2026-05-02",
        "vuelo": "WA123",
        "clase_tarifaria": "ECONOMICA"
      },
      "vuelta": {
        "fecha": "2026-03-15",
        "vuelo": "WA456"
      }
    }
  }

  RESPUESTA (nueva cotización)::
  {
    "success": true,
    "message": "Solicitud creada correctamente",
    "data": {
        "solicitud": {
            "id": 6,
            "radicado": "EMP002-6",
            "estado": "PENDIENTE",
            "tipo_de_vuelo": "IDA_Y_VUELTA",
            "ruta": {
                "origen": "Bogotá",
                "destino": "Medellín",
                "preferencia_aerolinea": "LATAM"
            },
            "fechas": {
                "ida": "2026-03-10",
                "vuelta": "2026-03-20"
            },
            "created_at": "2026-03-11T03:48:13.000Z"
        }
    },
    "event": {
        "type": "SOLICITUD_CREADA"
    }
}


*/
  //// Se recurre a un "Anidamiento explícito" 
  // 1️⃣.2 Admin modifica cotización.
  //nota: por logica de negocio no se permite modificaciones parciales o totales sobre una cotización ya creada, si el admin quiere modificar algo de la cotización debe crear una nueva cotización. 
  
  // POST /solicitud/:solicitudId/cotizacion/:cotizacionId/reemplazar
  @Post('solicitud/:solicitudId/cotizacion/:cotizacionId/reemplazar')
  async reemplazarCotizacion(
    @Param('solicitudId') solicitudId: string,
    @Param('cotizacionId') cotizacionId: string,
    @Body() data: ReemplazarCotizacionDto
  ) {
    // TODO: Obtener usuarioId del token JWT cuando se implemente autenticación
    const usuarioId = 1 // Temporal: usuario administrador hardcoded
    return this.cotizacionService.reemplazarCotizacion(
      Number(solicitudId),
      Number(cotizacionId),
      usuarioId,
      data,
    )
  }
/*
  DESCRIPCIÓN: Admin reemplaza una cotización existente para una solicitud que ya tiene cotización cargada. 
  El id de la cotización a reemplazar se pasa como parámetro en la URL (:cotizacionId) y los nuevos datos de la cotización se envían en el cuerpo de la solicitud. (ya no se envia en el body la referencia del id de la cotizacion a remplazar )
  La cotización anterior queda anulada y la nueva cotización toma su lugar. La solicitud permanece en estado "COTIZACION CARGADA" y queda pendiente de revisión por parte del empleado.

  ENDPOINT: POST /solicitud/:solicitudId/cotizacion/:cotizacionId/reemplazar
              Ej: http://localhost:3000/solicitud/4/cotizacion/3/reemplazar

              BODY (nueva cotización):
  {
    "aerolinea": "Wingo",
    "valor_total": 850000,
    "moneda": "COP",
    "cobertura": "IDA_Y_VUELTA",
    "detalle": {
      "ida": {
        "fecha": "2026-05-02",
        "vuelo": "WA123"
      },
      "vuelta": {
        "fecha": "2026-03-20",
        "vuelo": "WA788"
      }
    }
  }

  RESPUESTA EN CASO DE REMPLAZO:
{
    "success": true,
    "message": "Cotización reemplazada correctamente",
    "data": {
        "cotizacion": {
            "id": 5,
            "solicitud_id": 2,
            "cotizacion_anterior_id": 4,
            "estado": "COTIZACION NUEVA",
            "aerolinea": "Wingo",
            "valor_total": "850000",
            "moneda": "COP",
            "cobertura": "IDA_Y_VUELTA",
            "detalle": {
                "ida": {
                    "fecha": "2026-05-02",
                    "vuelo": "WA123"
                },
                "vuelta": {
                    "fecha": "2026-03-20",
                    "vuelo": "WA788"
                }
            },
            "created_at": "2026-03-10T05:26:17.000Z"
        }
    },
    "event": {
        "type": "COTIZACION_REEMPLAZADA",
        "affected_entities": [
            {
                "entity": "cotizacion",
                "id": 4,
                "new_state": "COTIZACION ANULADA"
            },
            {
                "entity": "solicitud",
                "id": 2,
                "new_state": "COTIZACION CARGADA"
            }
        ]
    }
}

  */

  ////// "Aplanamiento de Rutas" ////
  // 2️⃣ Empleado rechaza cotización (comentario obligatorio)
  // Rechazo: Es una decisión subjetiva del usuario.
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
  /*
  DESCRIPCIÓN: Empleado rechaza una cotización específica, proporcionando un comentario obligatorio. La cotización pasa a estado "COTIZACION RECHAZADA" y la solicitud vuelve a estado "EN REVISION" para que el admin pueda corregir o cargar una nueva cotización.
  ENDPOINT: POST /cotizacion/:id/rechazar
            Ej: http://localhost:3000/cotizacion/2/rechazar
  BODY:
  {
    "comentario": "El valor total no coincide con lo acordado, por favor corregir." 
  }
  RESPUESTA:

 */

  // 3️⃣ Empleado o Admin reportan novedad en cotización (comentario obligatorio)
  // Novedad: Es un impedimento objetivo del proceso. Se usa para reportar situaciones que requieren atención o corrección por parte del admin, como errores en la cotización, cambios en la disponibilidad de vuelos, cancelaciones, etc.
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
  /*
  DESCRIPCIÓN: Empleado genera una novedad en la cotización específica, proporcionando un comentario obligatorio. La cotización pasa a estado "COTIZACION RECHAZADA" y la solicitud vuelve a estado "EN REVISION" para que el admin pueda corregir o cargar una nueva cotización.
  ENDPOINT: POST /cotizacion/:id/novedad
            Ej: http://localhost:3000/cotizacion/2/novedad
  BODY:
  {
    "comentario": "El vuelo de regreso no podra ser ese dia, ubicar el vuelo mas proximo porfavor" 
  }
  RESPUESTA:
  {
      "success": true,
      "message": "Novedad registrada correctamente",
      "data": {
          "cotizacion": {
              "id": 4,
              "estado": "NOVEDAD"
          },
          "comentario": "El vuelo de regreso no podra ser ese dia, ubicar el vuelo mas proximo porfavor"
      },
      "event": {
          "type": "COTIZACION_NOVEDAD",
          "affected_entities": [
              {
                  "entity": "solicitud",
                  "id": 2,
                  "new_state": "NOVEDAD"
              }
          ]
      }
  }

 */


  // 4️⃣ Empleado selecciona cotizaciones para una solicitud
  // POST /solicitud/:solicitudId/seleccionar-cotizacion
  @Post('solicitud/:solicitudId/seleccionar-cotizacion')
  async seleccionarCotizacion(
    @Param('solicitudId') solicitudId: string,
    @Body() data: SeleccionarCotizacionDto
  ) {
    // TODO: Obtener usuarioId del token JWT cuando se implemente autenticación
    const usuarioId = 1 // Temporal: hardcoded
    return this.cotizacionService.seleccionarCotizacion(Number(solicitudId), usuarioId, data)
  }
  /*
  DESCRIPCIÓN: El empleado selecciona en una sola acción la cotización primaria y opcionalmente una secundaria para una solicitud. Las cotizaciones elegidas cambian a "OPCION PRIMARIA" y "OPCION SECUNDARIA", cualquier otra cotización de esa misma solicitud pasa a "COTIZACION DESCARTADA" y la solicitud vuelve a "EN REVISION".
  ENDPOINT: POST /solicitud/:solicitudId/seleccionar-cotizacion
            Ej: http://localhost:3000/solicitud/2/seleccionar-cotizacion
            nota: no se eligio pasar la info de las preferencias por medio de query params porque por lo general se usan para filtros o paginación, no para decisiones de negocio cuya acción afecta varias entidades (solicitud y varias cotizaciones).

  BODY:
{
  "cotizacion_primaria_id": 5,
  "cotizacion_secundaria_id": 6,
  "comentario": "Selecciono esta opción principal y dejo otra como respaldo."
}
  RESPUESTA:
  ???
*/

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

