    ////???? Es posible perdida del viaje por parte del solicitante, si se genera una novedad (sea de ida o de vuelta) que requiere emitir una nueva entidad del boleto, pues el precio final puede cambiar

    ///// validar de nuevo si ocurre ''COTIZACION SELECCIONADA'' al crear boleto

import { Body, Controller, Get, Param, ParseIntPipe, Post, Request, UseGuards } from '@nestjs/common';
import { BoletoService } from './boleto.service';
import { EmitirBoletoDto } from './dto/emitir-boleto.dto';
import { NovedadBoletoDto } from './dto/novedad-boleto.dto';
import { ConservarBoletoDto } from './dto/conservar-boleto.dto';
import { ConfirmarBoletoDto } from './dto/confirmar-boleto.dto';
import { ReemplazarBoletoDto } from './dto/reemplazar-boleto.dto';

import { Roles } from '../../auth/decorators/roles.decorator'
import { DemoPolicy } from '../../auth/decorators/demo-policy.decorator'
import { DemoPolicyGuard } from '../../auth/guards/demo-policy.guard'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../auth/guards/roles.guard'


@Controller()
export class BoletoController {
  constructor(private readonly boletoService: BoletoService) {}



  // POST /cotizacion/:cotizacionId/boleto
  @Post('cotizacion/:cotizacionId/boleto')
  @Roles('SUPERADMIN', 'ADMIN', 'DEMO')
  @UseGuards(JwtAuthGuard, RolesGuard, DemoPolicyGuard)
  @DemoPolicy({ resource: 'boleto', action: 'create' })
  async emitirBoleto(
    @Param('cotizacionId') cotizacionId: string,
    @Body() data: EmitirBoletoDto,
    @Request() req: any,
  ) {
    const usuarioId = req.user.id;
    const userRole = req.user.role;
    return this.boletoService.emitirBoleto(Number(cotizacionId), usuarioId, data, userRole);
  }
  /*
  DESCRIPCIÓN: Admin emite un boleto a partir de una cotización aprobada. El boleto queda en estado "EMITIDO". Si se proporciona un reemplaza_boleto_id, el nuevo boleto reemplaza al anterior y este último queda anulado. La solicitud asociada a la cotización pasa a estado "BOLETO EMITIDO".
  ENDPOINT POST /cotizacion/:cotizacionId/boleto
              Ej: POST http://localhost:3000/cotizacion/7/boleto
  BODY   
    {
        "reemplaza_boleto_id": null,
        "cobertura": "IDA_Y_VUELTA", 
        "ruta": {
            "origen": "Bogota",
            "destino": "Cartagena"
        },
        "valor_final": 760000,
        "comentario": "",
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
            "url_archivo_adjunto": "https://dominio.com/boleto/4545.pdf"
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
            "url_archivo_adjunto": "https://dominio.com/boleto/4545.pdf"
            }
        ]
    }
  
  
  RESPUESTA
{
    "success": true,
    "message": "Boleto emitido correctamente",
    "data": {
        "boleto": {
            "id": 2,
            "estado": "BOLETO EMITIDO",
            "cotizacion_id": 7,
            "reemplaza_boleto_id": null,
            "cobertura": "IDA_Y_VUELTA",
            "ruta": {
                "origen": "Bogota",
                "destino": "Cartagena"
            },
            "valor_final": "760000",
            "created_at": "2026-03-21T20:30:54.000Z",
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
    },
    "event": {
        "type": "BOLETO_EMITIDO",
        "affected_entities": [
            {
                "entity": "solicitud",
                "id": 2,
                "new_state": "BOLETO CARGADO"
            },
            {
                "entity": "cotizacion",
                "id": 7,
                "new_state": "COTIZACION SELECCIONADA"
            },
            {
                "entity": "boleto",
                "id": 2,
                "new_state": "BOLETO EMITIDO"
            },
            {
                "entity": "cotizacion",
                "id": 6,
                "new_state": "COTIZACION ANULADA"
            }
        ]
    }
}
    
  */
 
  // POST /boleto/:id/novedad
  @Post('boleto/:id/novedad')
  @Roles('SUPERADMIN', 'ADMIN', 'SOLICITANTE', 'DEMO')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async generarNovedad(
    @Param('id') id: string,
    @Body() data: NovedadBoletoDto,
    @Request() req: any,
  ) {
    const usuarioId = req.user.id;
    const userRole = req.user.role;
    return this.boletoService.generarNovedad(Number(id), usuarioId, data, userRole);
  }

  /*
  DESCRIPCIÓN: El Solicitante puede generar una novedad relacionada con un boleto específico.

  ENDPOINT POST /boleto/:id/novedad
          Ej: http://localhost:3000/boleto/2/novedad
          Ej: http://localhost:3000/boleto/1/novedad

  BODY
  {
    "tipo_novedad": "CAMBIO DE VUELO",
    "comentario": "El vuelo de regreso ha sido cancelado por la aerolínea y se ha reprogramado para el día siguiente."
  }
  RESPUESTA
    {
        "success": true,
        "message": "Novedad registrada correctamente",
        "data": {
            "boleto": {
                "id": 2,
                "estado": "NOVEDAD"
            },
            "comentario": "El vuelo de regreso ha sido cancelado por la aerolínea y se ha reprogramado para el día siguiente."
        },
        "event": {
            "type": "BOLETO_NOVEDAD_GENERADA",
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

  // POST /boleto/:boletoId/reemplazar
  @Post('boleto/:boletoId/reemplazar')
  @Roles('SUPERADMIN', 'ADMIN', 'DEMO')
  @UseGuards(JwtAuthGuard, RolesGuard, DemoPolicyGuard)
  @DemoPolicy({ resource: 'boleto', action: 'create' })
  async reemplazarBoleto(
    @Param('boletoId') boletoId: string,
    @Body() data: ReemplazarBoletoDto,
    @Request() req: any,
  ) {
    const usuarioId = req.user.id;
    const userRole = req.user.role;
    return this.boletoService.reemplazarBoleto(Number(boletoId), usuarioId, data, userRole);
  }
/*
  DESCRIPCIÓN: Admin reemplaza un boleto ya emitido por uno nuevo. El boleto anterior queda anulado y el nuevo boleto queda en estado "EMITIDO". La solicitud asociada a la cotización del boleto reemplazado permanece en estado "BOLETO EMITIDO".
  ENDPOINT POST /boleto/:boletoId/reemplazar
              Ej: POST http://localhost:3000/boleto/2/reemplazar

    // La entidad Boleto en caso de correcciones (parcial o total) generara un nuevo boleto que reemplaza al anterior, quedando este último anulado. Esto se hace para mantener un historial claro de los cambios realizados en los boletos y para asegurar la trazabilidad de las modificaciones. Al crear un nuevo boleto en lugar de modificar el existente, se puede conservar un registro completo de las versiones anteriores del boleto, lo que es importante para auditorías y para entender el historial de cambios en caso de futuras consultas o disputas.

  BODY
  {
      "cobertura": "IDA_Y_VUELTA",   
      "ruta": {
        "origen": "Bogota",
        "destino": "Cartagena"
      },
      "valor_final": 840000,
      "comentario": "",
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
        "url_archivo_adjunto": "https://dominio.com/boleto/4545.pdf"
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
        "url_archivo_adjunto": "https://dominio.com/boleto/4552.pdf"
        }
    ]
  }
RESPUESTA
{
    "success": true,
    "message": "Boleto reemplazado correctamente",
    "data": {
        "boleto": {
            "id": 3,
            "cotizacion_id": 7,
            "estado": "BOLETO EMITIDO",
            "reemplaza_boleto_id": 2,
            "cobertura": "IDA_Y_VUELTA",
            "ruta": {
                "origen": "Bogota",
                "destino": "Cartagena"
            },
            "valor_final": "840000",
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
        }
    },
    "event": {
        "type": "BOLETO_REEMPLAZADO",
        "affected_entities": [
            {
                "entity": "solicitud",
                "id": 2,
                "new_state": "BOLETO CARGADO"
            },
            {
                "entity": "boleto",
                "id": 2,
                "new_state": "BOLETO ANULADO"
            },
            {
                "entity": "boleto",
                "id": 3,
                "new_state": "BOLETO EMITIDO"
            }
        ]
    }
}

  */


  // POST /boleto/:id/conservar
  @Post('boleto/:id/conservar')
  @Roles('SUPERADMIN', 'ADMIN', 'DEMO')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async conservarBoleto(
    @Param('id') id: string,
    @Body() data: ConservarBoletoDto,
    @Request() req: any,
  ) {
    const usuarioId = req.user.id;
    const userRole = req.user.role;
    return this.boletoService.conservarBoleto(Number(id), usuarioId, data, userRole);
  }


  /*
  DESCRIPCIÓN: El Admin puede conservar un boleto que se encuentra en estado "NOVEDAD" cuando la novedad no afecta la validez del boleto y no requiere emitir un nuevo boleto. El boleto conserva su estado "EMITIDO" y la solicitud asociada permanece en estado "BOLETO EMITIDO".

  ENDPOINT POST /boleto/:id/conservar
          Ej: http://localhost:3000/boleto/1/conservar
  BODY
  {
  "comentario": "La novedad reportada no afecta la validez del boleto, se conserva el boleto emitido."
  }
  RESPUESTA

  {
    "success": true,
    "message": "Boleto revisado y conservado correctamente",
    "data": {
        "boleto": {
            "id": 1,
            "estado": "BOLETO EMITIDO"
        }
    },
    "event": {
        "type": "BOLETO_CONSERVADO",
        "affected_entities": [
            {
                "entity": "solicitud",
                "id": 5,
                "new_state": "BOLETO CARGADO"
            }
        ]
    }
}
  
  */


  // POST /boleto/:id/confirmar
  @Post('boleto/:id/confirmar')
  @Roles('SUPERADMIN', 'SOLICITANTE', 'DEMO')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async confirmarBoleto(
    @Param('id') id: string,
    @Body() data: ConfirmarBoletoDto,
    @Request() req: any,
  ) {
    const usuarioId = req.user.id;
    const userRole = req.user.role;
    return this.boletoService.confirmarBoleto(Number(id), usuarioId, data, userRole);
  }
  /*
  DESCRIPCIÓN: El solicitante confirma finalmente estar conforme con  

  ENDPOINT  POST /boleto/:id/confirmar
            Ej:  http://localhost:3000/boleto/3/confirmar
  BODY
  {
     "comentario": "Confirmo que el boleto es correcto y estoy conforme con la solución propuesta."
  }
  RESPUESTA
{
    "success": true,
    "message": "Boleto confirmado correctamente",
    "data": {
        "boleto": {
            "id": 3,
            "estado": "CONFORME POR EL EMPLEADO"
        }
    },
    "event": {
        "type": "BOLETO_CONFIRMADO",
        "affected_entities": [
            {
                "entity": "solicitud",
                "id": 2,
                "new_state": "VIAJE PROGRAMADO"
            }
        ]
    }
}
    
  */

  // Obtener Boleto por ID
  // GET /boleto/:id
  // @Roles('SUPERADMIN', 'ADMIN', 'DEMO')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('boleto/:id')
    async obtenerPorId(@Param('id', ParseIntPipe) id: number) {
        return this.boletoService.obtenerPorId(id)
  }


    /*
    URL de ejemplo: http://localhost:3000/boleto/3

    RESPUESTA:
    {
    "success": true,
    "message": "Boleto obtenido correctamente",
    "data": {
        "boleto": {
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
        }
    }
}
    */

        // Obtener historial de estados de un boleto por ID
    // GET /boleto/:id/historial-estado
    @Get('boleto/:id/historial-estado')
    @Roles('SUPERADMIN', 'ADMIN', 'DEMO')
    @UseGuards(JwtAuthGuard, RolesGuard)
    async obtenerHistorialEstadoPorId(@Param('id', ParseIntPipe) id: number) {
        return this.boletoService.obtenerHistorialPorBoletoId(id)
    }
    /*
    DESCRIPCIÓN: Obtener el historial de estados de un boleto específico por su ID. Esto incluye todos los cambios de estado que ha tenido el boleto a lo largo del tiempo, junto con las fechas y los usuarios que realizaron cada cambio.
    ENDPOINT: GET /boleto/:id/historial-estado
              Ej: http://localhost:3000/boleto/3/historial-estado
    RESPUESTA:
    {
        "success": true,
        "message": "Historial de boleto obtenido correctamente",
        "data": {
            "boleto_id": 3,
            "historial_estado_boleto": [
                {
                    "id": 7,
                    "boleto_id": 3,
                    "estado_id": 2,
                    "usuario_id": 1,
                    "observacion": "Confirmo que el boleto es correcto y estoy conforme con la solución propuesta.",
                    "created_at": "2026-03-22T05:11:17.000Z",
                    "estado_boleto": {
                        "id": 2,
                        "estado": "CONFORME POR EL EMPLEADO",
                        "slug": "conforme_empleado"
                    },
                    "usuario": {
                        "id": 1,
                        "nombre": "Carlos",
                        "username": "carlos"
                    }
                },
                {
                    "id": 4,
                    "boleto_id": 3,
                    "estado_id": 1,
                    "usuario_id": 3,
                    "observacion": "Boleto reemplazado",
                    "created_at": "2026-03-22T05:07:25.000Z",
                    "estado_boleto": {
                        "id": 1,
                        "estado": "BOLETO EMITIDO",
                        "slug": "boleto_emitido"
                    },
                    "usuario": {
                        "id": 3,
                        "nombre": "ar",
                        "username": "ar"
                    }
                }
            ],
            "total": 2
        }
    }

    
    */

}



