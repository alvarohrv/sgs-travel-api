
    ////??? ////????? de las peticiones GET desacoplar el atributo 'historial_estado_solicitud' y crear un endpoint específico para consultar el historial de estados de una cotización, así evitamos cargar ese historial cada vez que se consulta una cotización o las cotizaciones de una solicitud, ejempl GET /cotizacion/:id/historial-estado

    ////???? PENDIENTE PROBAR DE NUEVO ENDPOINT GET para documentar finalmente luego de los cambios!!!!!!!!!!!!



    ///// ???? validar si un solicitante puede RECHAZAR una cotizacion que no es suya.

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
import { Roles } from '../../auth/decorators/roles.decorator'
import { DemoPolicy } from '../../auth/decorators/demo-policy.decorator'
import { DemoPolicyGuard } from '../../auth/guards/demo-policy.guard'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { Body, Controller, Get, Post, Param, Request, UseGuards } from '@nestjs/common'
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
  @Roles('SUPERADMIN', 'ADMIN', 'DEMO')
  @UseGuards(JwtAuthGuard, RolesGuard, DemoPolicyGuard)
  @DemoPolicy({ resource: 'cotizacion', action: 'create' })
  async crearCotizacion(
    @Param('solicitudId') solicitudId: string,
    @Body() data: CrearCotizacionDto,
    @Request() req: any,
  ) {
    const usuarioId = req.user.id
    const userRole = req.user.role
    return this.cotizacionService.crearCotizacion(Number(solicitudId), usuarioId, data, userRole)
  }

  /*
  DESCRIPCIÓN: Admin carga una nueva cotización para una solicitud que está en revisión o ya con cotizacion cargada. Si se proporciona un cotizacion_anterior_id, la nueva cotización reemplaza a la anterior y esta última queda anulada. La solicitud pasa a estado "COTIZACION CARGADA" y queda pendiente de revisión por parte del empleado.

  Nota: La cotizacion es flexible en cuanto a su detalle en cuanto a fechas, vuelos, cobertura, etc Sera el admin quien puede 

  ENDPOINT: POST /solicitud/:solicitudId/cotizacion
              Ej: POST http://localhost:3000/solicitud/2/cotizacion
  BODY (nueva cotización):
  {
    "cotizacion_anterior_id": null,
    "valor_total": 850000,
    "moneda": "COP",
    "cobertura": "IDA_Y_VUELTA",
    "ruta": {
        "origen": "Bogota",
        "destino": "Cartagena"
    },
    "detalle": {
      "ida": {
        "aerolinea": "Wingo",
        "fecha": "2026-02-02",
        "vuelo": "WA123",
        "clase_tarifaria": "ECONOMICA"
      },
      "vuelta": {
        "aerolinea": "Wingo",
        "fecha": "2026-03-15",
        "vuelo": "WA456"
      }
    }
  }


  RESPUESTA (nueva cotización)::
{
    "success": true,
    "message": "Cotización creada correctamente",
    "data": {
        "cotizacion": {
            "id": 5,
            "solicitud_id": 2,
            "cotizacion_anterior_id": null,
            "estado": "COTIZACION NUEVA",
            "valor_total": "850000",
            "moneda": "COP",
            "cobertura": "IDA_Y_VUELTA",
            "ruta": {
                "origen": "Bogota",
                "destino": "Cartagena"
            },
            "detalle": {
                "ida": {
                    "aerolinea": "Wingo",
                    "fecha": "2026-02-02",
                    "vuelo": "WA123",
                    "clase_tarifaria": "ECONOMICA"
                },
                "vuelta": {
                    "aerolinea": "Wingo",
                    "fecha": "2026-03-15",
                    "vuelo": "WA456"
                }
            },
            "created_at": "2026-03-21T20:05:02.000Z"
        }
    },
    "event": {
        "type": "COTIZACION_CREADA",
        "affected_entities": [
            {
                "entity": "solicitud",
                "id": 2,
                "new_state": "COTIZACION CARGADA"
            }
        ]
    }
}

  BODY (Para crear una cotizacion adicional para esta solicitud):
  {
    "cotizacion_anterior_id": null,
    "valor_total": 750000,
    "moneda": "COP",
    "cobertura": "IDA_Y_VUELTA",
    "ruta": {
        "origen": "Bogota",
        "destino": "Cartagena"
    },
    "detalle": {
      "ida": {
        "aerolinea": "LATAM",
        "fecha": "2026-02-02",
        "vuelo": "LA148",
        "clase_tarifaria": "ECONOMICA"
      },
      "vuelta": {
        "aerolinea": "Wingo",
        "fecha": "2026-03-16",
        "vuelo": "WA755"
      }
    }
  }
*/

  // 3️⃣ Empleado o Admin reportan novedad en cotización (comentario obligatorio)
  // Novedad: Es un impedimento objetivo del proceso. Se usa para reportar situaciones que requieren atención o corrección por parte del admin, como errores en la cotización, cambios en la disponibilidad de vuelos, cancelaciones, etc.
  // POST /cotizacion/:id/novedad
  @Post('cotizacion/:id/novedad')
  @Roles('SUPERADMIN', 'ADMIN', 'SOLICITANTE', 'DEMO')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async reportarNovedad(
    @Param('id') id: string,
    @Body() data: NovedadCotizacionDto,
    @Request() req: any,
  ) {
    const usuarioId = req.user.id
    const userRole = req.user.role
    return this.cotizacionService.reportarNovedad(Number(id), usuarioId, data, userRole)
  }
  /*
  DESCRIPCIÓN: Empleado genera una novedad en la cotización específica, proporcionando un comentario obligatorio. La cotización pasa a estado "COTIZACION RECHAZADA" y la solicitud vuelve a estado "EN REVISION" para que el admin pueda corregir o cargar una nueva cotización.
  ENDPOINT: POST /cotizacion/:id/novedad
            Ej: POST http://localhost:3000/cotizacion/5/novedad
  BODY:
  {
    "comentario": "El vuelo de ida no podra ser ese dia, ubicar el vuelo mas proximo porfavor" 
  }
  RESPUESTA:
  {
      "success": true,
      "message": "Novedad registrada correctamente",
      "data": {
          "cotizacion": {
              "id": 5,
              "estado": "NOVEDAD"
          },
          "comentario": "El vuelo de ida no podra ser ese dia, ubicar el vuelo mas proximo porfavor"
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

  RESPUESTA EN CASO DE FALTA DE COMENTARIO:
  {
      "message": "El comentario es obligatorio para reportar una novedad",
      "error": "Bad Request",
      "statusCode": 400
  }
 */


  //// Se recurre a un "Anidamiento explícito" en endpoind
  // 1️⃣.2 Admin modifica cotización.
  //nota: por logica de negocio no se permite modificaciones parciales o totales sobre una cotización ya creada, si el admin quiere modificar algo de la cotización debe crear una nueva cotización. 
  
  // POST /solicitud/:solicitudId/cotizacion/:cotizacionId/reemplazar
  @Post('solicitud/:solicitudId/cotizacion/:cotizacionId/reemplazar')
  @Roles('SUPERADMIN', 'ADMIN', 'DEMO')
  @UseGuards(JwtAuthGuard, RolesGuard, DemoPolicyGuard)
  @DemoPolicy({ resource: 'cotizacion', action: 'create' })
  async reemplazarCotizacion(
    @Param('solicitudId') solicitudId: string,
    @Param('cotizacionId') cotizacionId: string,
    @Body() data: ReemplazarCotizacionDto,
    @Request() req: any,
  ) {
    const usuarioId = req.user.id
    const userRole = req.user.role
    return this.cotizacionService.reemplazarCotizacion(
      Number(solicitudId),
      Number(cotizacionId),
      usuarioId,
      data,
      userRole,
    )
  }
/*
  DESCRIPCIÓN: Admin reemplaza una cotización existente para una solicitud que ya tiene cotización cargada. 
  El id de la cotización a reemplazar se pasa como parámetro en la URL (:cotizacionId) y los nuevos datos de la cotización se envían en el cuerpo de la solicitud. (ya no se envia en el body la referencia del id de la cotizacion a remplazar )
  La cotización anterior queda anulada y la nueva cotización toma su lugar. La solicitud permanece en estado "COTIZACION CARGADA" y queda pendiente de revisión por parte del empleado.

  ENDPOINT: POST /solicitud/:solicitudId/cotizacion/:cotizacionId/reemplazar
              Ej: http://localhost:3000/solicitud/2/cotizacion/5/reemplazar

BODY (nueva cotización):
  {
    "valor_total": 860000,
    "moneda": "COP",
    "cobertura": "IDA_Y_VUELTA",
    "ruta": {
        "origen": "Bogota",
        "destino": "Cartagena"
    },    
    "detalle": {
      "ida": {
        "aerolinea": "LATAM",
        "fecha": "2026-02-03",
        "vuelo": "LA129",
        "clase_tarifaria": "ECONOMICA",
        "politica_equipaje": "1 maleta de 23kg incluida"
      },
      "vuelta": {
        "aerolinea": "Wingo",
        "fecha": "2026-03-15",
        "vuelo": "WA456",
        "clase_tarifaria": "ECONOMICA"
      }
    }
  }


  RESPUESTA EN CASO DE REMPLAZO:
{
    "success": true,
    "message": "Cotización reemplazada correctamente",
    "data": {
        "cotizacion": {
            "id": 7,
            "solicitud_id": 2,
            "cotizacion_anterior_id": 5,
            "estado": "COTIZACION NUEVA",
            "valor_total": "860000",
            "moneda": "COP",
            "cobertura": "IDA_Y_VUELTA",
            "ruta": {
                "origen": "Bogota",
                "destino": "Cartagena"
            },
            "detalle": {
                "ida": {
                    "aerolinea": "LATAM",
                    "fecha": "2026-02-03",
                    "vuelo": "LA129",
                    "clase_tarifaria": "ECONOMICA",
                    "politica_equipaje": "1 maleta de 23kg incluida"
                },
                "vuelta": {
                    "aerolinea": "Wingo",
                    "fecha": "2026-03-15",
                    "vuelo": "WA456",
                    "clase_tarifaria": "ECONOMICA"
                }
            },
            "created_at": "2026-03-22T05:00:22.000Z"
        }
    },
    "event": {
        "type": "COTIZACION_REEMPLAZADA",
        "affected_entities": [
            {
                "entity": "cotizacion",
                "id": 5,
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
  @Roles('SUPERADMIN', 'ADMIN', 'SOLICITANTE', 'DEMO')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async rechazarCotizacion(
    @Param('id') id: string,
    @Body() data: RechazarCotizacionDto,
    @Request() req: any,
  ) {
    const usuarioId = req.user.id
    const userRole = req.user.role
    return this.cotizacionService.rechazarCotizacion(Number(id), usuarioId, data, userRole)
  }
  /*
  DESCRIPCIÓN: Empleado rechaza una cotización específica, proporcionando un comentario obligatorio. La cotización pasa a estado "COTIZACION RECHAZADA" y la solicitud vuelve a estado "EN REVISION" para que el admin pueda corregir o cargar una nueva cotización.
  ENDPOINT: POST /cotizacion/:id/rechazar
            Ej: POST http://localhost:3000/cotizacion/7/rechazar
  BODY:
  {
    "comentario": "El vuelo de regreso es muy tarde, necesito una opción con vuelo de vuelta más temprano." 
  }
  RESPUESTA:
{
    "success": true,
    "message": "Cotización rechazada correctamente",
    "data": {
        "cotizacion": {
            "id": 7,
            "estado": "COTIZACION RECHAZADA"
        },
        "comentario": "El vuelo de regreso es muy tarde, necesito una opción con vuelo de vuelta más temprano."
    },
    "event": {
        "type": "COTIZACION_RECHAZADA",
        "affected_entities": [
            {
                "entity": "solicitud",
                "id": 2,
                "new_state": "EN REVISION"
            }
        ]
    }
}
 */

  // 4️⃣ El admin revisa, decide NO crear una nueva cotización.
  @Post('cotizacion/:id/conservar')
  @Roles('SUPERADMIN', 'ADMIN', 'DEMO')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async conservarCotizacion(
    @Param('id') id: string,
    @Body() data: RechazarCotizacionDto,
    @Request() req: any,
  ) {
    const usuarioId = req.user.id
    const userRole = req.user.role
    return this.cotizacionService.conservarCotizacion(Number(id), usuarioId, data, userRole)
  }

  /*
    DESCRIPCIÓN
    ENDPOINT http://localhost:3000/cotizacion/7/conservar
    BODY
    {
      "comentario": "No hay vuelos mas tempranos por mal clima, se mantiene vigente el vuelo actual o seleccionar la otra cotización cargada."
    }
    RESPUESTA
{
    "success": true,
    "message": "Cotización conservada correctamente",
    "data": {
        "cotizacion": {
            "id": 7,
            "estado": "COTIZACION NUEVA"
        },
        "comentario": "No hay vuelos mas tempranos por mal clima, se mantiene vigente el vuelo actual o seleccionar la otra cotización cargada."
    },
    "event": {
        "type": "COTIZACION_CONSERVADA",
        "affected_entities": [
            {
                "entity": "solicitud",
                "id": 2,
                "new_state": "COTIZACION CARGADA"
            }
        ]
    }
}
  */


  // 5️⃣ Empleado selecciona cotizaciones para una solicitud
  // POST /solicitud/:solicitudId/seleccionar-cotizacion
  @Post('solicitud/:solicitudId/seleccionar-cotizacion')
  @Roles('SUPERADMIN', 'SOLICITANTE', 'DEMO')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async seleccionarCotizacion(
    @Param('solicitudId') solicitudId: string,
    @Body() data: SeleccionarCotizacionDto,
    @Request() req: any,
  ) {
    const usuarioId = req.user.id
    const userRole = req.user.role
    return this.cotizacionService.seleccionarCotizacion(Number(solicitudId), usuarioId, data, userRole)
  }
  /*
  DESCRIPCIÓN: El empleado selecciona en una sola acción la cotización primaria y opcionalmente una secundaria para una solicitud. Las cotizaciones elegidas cambian a "OPCION PRIMARIA" y "OPCION SECUNDARIA", cualquier otra cotización de esa misma solicitud pasa a "COTIZACION DESCARTADA" y la solicitud vuelve a "EN REVISION".
  ENDPOINT: POST /solicitud/:solicitudId/seleccionar-cotizacion
            Ej: http://localhost:3000/solicitud/2/seleccionar-cotizacion
            nota: no se eligio pasar la info de las preferencias por medio de query params porque por lo general se usan para filtros o paginación, no para decisiones de negocio cuya acción afecta varias entidades (solicitud y varias cotizaciones).

  BODY:
  Nota: crear una cotizacion adicional para este escenario de prueba.

  {
    "cotizacion_primaria_id": 7,
    "cotizacion_secundaria_id": 6,
    "comentario": "Selecciono esta opción principal y dejo otra como respaldo."
  }
  RESPUESTA:
{
    "success": true,
    "message": "Cotizaciones seleccionadas correctamente",
    "data": {
        "cotizacion": {
            "seleccion": {
                "primaria": {
                    "id": 7,
                    "estado": "OPCION PRIMARIA",
                    "sub_estado": "EN REVISION"
                },
                "secundaria": {
                    "id": 6,
                    "estado": "OPCION SECUNDARIA",
                    "sub_estado": "EN REVISION"
                }
            },
            "descartadas": [],
            "anuladas_sin_cambio": [
                {
                    "id": 5,
                    "estado": "COTIZACION ANULADA"
                }
            ]
        }
    },
    "event": {
        "type": "COTIZACIONES_SELECCIONADAS",
        "affected_entities": [
            {
                "entity": "solicitud",
                "id": 2,
                "new_state": "EN REVISION"
            }
        ]
    }
}
*/

  // ========== CONSULTAS ==========

  // 6️⃣ Listar cotizaciones de una solicitud
  // GET /solicitud/:solicitudId/cotizacion
  @Roles('SUPERADMIN', 'ADMIN', 'DEMO')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('solicitud/:solicitudId/cotizacion')
  async obtenerPorSolicitud(@Param('solicitudId') solicitudId: string) {
    return this.cotizacionService.obtenerPorSolicitud(Number(solicitudId))
  }
  /*
  URL de ejemplo: http://localhost:3000/solicitud/3/cotizacion

  RESPUESTA:
{
    "success": true,
    "message": "Cotizaciones obtenidas correctamente",
    "data": {
        "cotizaciones": [
            {
                "id": 3,
                "solicitud_id": 5,
                "cotizacion_anterior_id": null,
                "estado_actual_id": 1,
                "cobertura": "IDA_Y_VUELTA",
                "valor_total": "850",
                "created_at": "2026-03-20T10:36:12.000Z",
                "updated_at": null,
                "closed_at": null,
                "estado_cotizacion": {
                    "id": 1,
                    "estado": "COTIZACION NUEVA",
                    "slug": "cotizacion_nueva",
                    "editable": true,
                    "created_at": "2026-03-17T13:54:07.000Z"
                },
                "historial_estado_cotizacion": [],
                "ruta": {
                    "origen": "Bogotá",
                    "destino": "Cali"
                }
            }
        ],
        "total": 1
    }
}
}*/

  // 6️⃣ Obtener cotización por ID
  // GET /cotizacion/:id
  // @Roles('SUPERADMIN', 'ADMIN', 'DEMO')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('cotizacion/:id')
  async obtenerPorId(@Param('id') id: string) {
    return this.cotizacionService.obtenerPorId(Number(id))
  }


/*
URL de ejemplo: http://localhost:3000/cotizacion/7
{
    "success": true,
    "message": "Cotización obtenida correctamente",
    "data": {
        "cotizacion": {
            "id": 7,
            "solicitud_id": 2,
            "cotizacion_anterior_id": 5,
            "usuario_solicitante": {
                "id": 1,
                "nombre": "Carlos"
            },
            "usuario_emite_boleto": {
                "id": 3,
                "nombre": "ar"
            },
            "estado_actual_id": 7,
            "cobertura": "IDA_Y_VUELTA",
            "valor_total": "860000",
            "created_at": "2026-03-22T05:00:22.000Z",
            "updated_at": "2026-03-22T05:06:36.000Z",
            "closed_at": null,
            "estado_cotizacion": {
                "id": 7,
                "estado": "COTIZACION SELECCIONADA",
                "slug": "cotizacion_seleccionada",
                "editable": false,
                "created_at": "2026-03-21T23:34:07.000Z"
            },
            "ruta": {
                "origen": "Bogota",
                "destino": "Cartagena"
            },
            "detalle": {
                "ida": {
                    "aerolinea": "LATAM",
                    "fecha": "2026-02-03",
                    "vuelo": "LA129",
                    "clase_tarifaria": "ECONOMICA",
                    "politica_equipaje": "1 maleta de 23kg incluida"
                },
                "vuelta": {
                    "aerolinea": "Wingo",
                    "fecha": "2026-03-15",
                    "vuelo": "WA456",
                    "clase_tarifaria": "ECONOMICA",
                    "politica_equipaje": null
                }
            },
            "boleto": [
                {
                    "id": 3,
                    "cotizacion_id": 7,
                    "solicitud_id": 2,
                    "reemplaza_boleto_id": 2,
                    "usuario_solicitante": {
                        "id": 1,
                        "nombre": "Carlos"
                    },
                    "usuario_generador_boleto": {
                        "id": 3,
                        "nombre": "ar"
                    },
                    "estado_boleto": {
                        "id": 2,
                        "estado": "CONFORME POR EL EMPLEADO",
                        "slug": "conforme_empleado",
                        "editable": false,
                        "created_at": "2026-03-21T23:34:07.000Z"
                    },
                    "cobertura": "IDA_Y_VUELTA",
                    "valor_final": "840000",
                    "created_at": "2026-03-22T05:07:25.000Z",
                    "ruta": {
                        "origen": "Bogota",
                        "destino": "Cartagena"
                    },
                    "segmentos": [
                        {
                            "tipo_segmento": "IDA",
                            "aerolinea": "LATAM",
                            "codigo_reserva": "ZXCV12",
                            "numero_tiquete": "987654321",
                            "numero_vuelo": "LA148",
                            "fecha_vuelo": "2026-02-02",
                            "fecha_compra": "2026-02-01",
                            "clase_tarifaria": "Económica",
                            "politica_equipaje": "1 maleta 23kg",
                            "url_archivo_adjunto": "https://dominio.com/boleto/4545.pdf",
                            "estado": "REPROGRAMADO"
                        },
                        {
                            "tipo_segmento": "VUELTA",
                            "aerolinea": "Wingo",
                            "codigo_reserva": "ZXCV12",
                            "numero_tiquete": "5252525252",
                            "numero_vuelo": "WA577",
                            "fecha_vuelo": "2026-03-23",
                            "fecha_compra": "2026-02-01",
                            "clase_tarifaria": "Económica",
                            "politica_equipaje": "1 maleta 23kg",
                            "url_archivo_adjunto": "https://dominio.com/boleto/4552.pdf",
                            "estado": "REPROGRAMADO"
                        }
                    ]
                },
                {
                    "id": 2,
                    "cotizacion_id": 7,
                    "solicitud_id": 2,
                    "reemplaza_boleto_id": null,
                    "usuario_solicitante": {
                        "id": 1,
                        "nombre": "Carlos"
                    },
                    "usuario_generador_boleto": {
                        "id": 3,
                        "nombre": "ar"
                    },
                    "estado_boleto": {
                        "id": 3,
                        "estado": "BOLETO ANULADO",
                        "slug": "boleto_anulado",
                        "editable": false,
                        "created_at": "2026-03-21T23:34:07.000Z"
                    },
                    "cobertura": "IDA_Y_VUELTA",
                    "valor_final": "760000",
                    "created_at": "2026-03-22T05:06:36.000Z",
                    "ruta": {
                        "origen": "Bogota",
                        "destino": "Cartagena"
                    },
                    "segmentos": [
                        {
                            "tipo_segmento": "IDA",
                            "aerolinea": "LATAM",
                            "codigo_reserva": "ZXCV12",
                            "numero_tiquete": "987654321",
                            "numero_vuelo": "LA148",
                            "fecha_vuelo": "2026-02-02",
                            "fecha_compra": "2026-02-01",
                            "clase_tarifaria": "Económica",
                            "politica_equipaje": "1 maleta 23kg",
                            "url_archivo_adjunto": "https://dominio.com/boleto/4545.pdf",
                            "estado": "CONFIRMADO"
                        },
                        {
                            "tipo_segmento": "VUELTA",
                            "aerolinea": "Wingo",
                            "codigo_reserva": "ZXCV12",
                            "numero_tiquete": "987654321",
                            "numero_vuelo": "WA755",
                            "fecha_vuelo": "2026-03-16",
                            "fecha_compra": "2026-02-01",
                            "clase_tarifaria": "Económica",
                            "politica_equipaje": "1 maleta 23kg",
                            "url_archivo_adjunto": "https://dominio.com/boleto/4545.pdf",
                            "estado": "CONFIRMADO"
                        }
                    ]
                }
            ]
        }
    }
}

*/
  // 7️⃣ Obtener historial de estados de una cotización por ID
  // GET /cotizacion/:id/historial-estado

  @Get('cotizacion/:id/historial-estado')
  @Roles('SUPERADMIN', 'ADMIN', 'DEMO')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async obtenerHistorialEstadoPorId(@Param('id') id: string) {
    return this.cotizacionService.obtenerHistorialPorCotizacionId(Number(id))
  }

  /*
  DESCRIPCIÓN: Obtener el historial completo de estados por los que ha pasado una cotización específica, incluyendo fechas y comentarios asociados a cada cambio de estado. Esto permite tener un seguimiento detallado de la evolución de la cotización a lo largo del tiempo.
  ENDPOINT: GET /cotizacion/:id/historial-estado
            Ej: http://localhost:3000/cotizacion/7/historial-estado
    RESPUESTA:
    {
        "success": true,
        "message": "Historial de cotización obtenido correctamente",
        "data": {
            "cotizacion_id": 7,
            "historial_estado_cotizacion": [
                {
                    "id": 12,
                    "cotizacion_id": 7,
                    "estado_id": 7,
                    "usuario_id": 3,
                    "observacion": "Cotizacion seleccionada para emision de boleto",
                    "created_at": "2026-03-22T05:06:36.000Z",
                    "estado_cotizacion": {
                        "id": 7,
                        "estado": "COTIZACION SELECCIONADA",
                        "slug": "cotizacion_seleccionada"
                    },
                    "usuario": {
                        "id": 3,
                        "nombre": "ar",
                        "username": "ar"
                    }
                },
                {
                    "id": 10,
                    "cotizacion_id": 7,
                    "estado_id": 3,
                    "usuario_id": 1,
                    "observacion": "Seleccionada como OPCION_PRIMARIA por el solicitante. Selecciono esta opción principal y dejo otra como respaldo.",
                    "created_at": "2026-03-22T05:05:56.000Z",
                    "estado_cotizacion": {
                        "id": 3,
                        "estado": "OPCION PRIMARIA",
                        "slug": "opcion_primaria"
                    },
                    "usuario": {
                        "id": 1,
                        "nombre": "Carlos",
                        "username": "carlos"
                    }
                },
                {
                    "id": 8,
                    "cotizacion_id": 7,
                    "estado_id": 1,
                    "usuario_id": 3,
                    "observacion": "Cotización revisada y conservada",
                    "created_at": "2026-03-22T05:05:05.000Z",
                    "estado_cotizacion": {
                        "id": 1,
                        "estado": "COTIZACION NUEVA",
                        "slug": "cotizacion_nueva"
                    },
                    "usuario": {
                        "id": 3,
                        "nombre": "ar",
                        "username": "ar"
                    }
                },
                {
                    "id": 7,
                    "cotizacion_id": 7,
                    "estado_id": 2,
                    "usuario_id": 1,
                    "observacion": "RECHAZADA: El vuelo de regreso es muy tarde, necesito una opción con vuelo de vuelta más temprano.",
                    "created_at": "2026-03-22T05:04:21.000Z",
                    "estado_cotizacion": {
                        "id": 2,
                        "estado": "COTIZACION RECHAZADA",
                        "slug": "cotizacion_rechazada"
                    },
                    "usuario": {
                        "id": 1,
                        "nombre": "Carlos",
                        "username": "carlos"
                    }
                },
                {
                    "id": 5,
                    "cotizacion_id": 7,
                    "estado_id": 1,
                    "usuario_id": 3,
                    "observacion": "Cotización cargada - LATAM - IDA_Y_VUELTA - $860000 COP",
                    "created_at": "2026-03-22T05:00:22.000Z",
                    "estado_cotizacion": {
                        "id": 1,
                        "estado": "COTIZACION NUEVA",
                        "slug": "cotizacion_nueva"
                    },
                    "usuario": {
                        "id": 3,
                        "nombre": "ar",
                        "username": "ar"
                    }
                }
            ],
            "total": 5
        }
    }
    
  */
}
