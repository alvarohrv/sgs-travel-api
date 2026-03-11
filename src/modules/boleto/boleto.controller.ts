import { Body, Controller, Param, Post } from '@nestjs/common';
import { BoletoService } from './boleto.service';
import { EmitirBoletoDto } from './dto/emitir-boleto.dto';
import { NovedadBoletoDto } from './dto/novedad-boleto.dto';
import { ConservarBoletoDto } from './dto/conservar-boleto.dto';
import { ConfirmarBoletoDto } from './dto/confirmar-boleto.dto';
import { ReemplazarBoletoDto } from './dto/reemplazar-boleto.dto';

@Controller()
export class BoletoController {
  constructor(private readonly boletoService: BoletoService) {}

    /*
  DESCRIPCIÓN: Admin emite un boleto a partir de una cotización aprobada. El boleto queda en estado "EMITIDO". Si se proporciona un reemplaza_boleto_id, el nuevo boleto reemplaza al anterior y este último queda anulado. La solicitud asociada a la cotización pasa a estado "BOLETO EMITIDO".
  ENDPOINT POST /cotizacion/:cotizacionId/boleto
              Ej: POST http://localhost:3000/cotizacion/1/boleto
  BODY 
 {
  "reemplaza_boleto_id": null,
  "cobertura": "IDA",
  "aerolinea": "LATAM",
  "codigo_reserva": "ZXCV12",
  "numero_tiquete": "987654321", 
  "url_archivo_adjunto": "https://dominio.com/boleto/900.pdf",
  "valor_final": 850000,
  "fecha_compra": "2026-02-26",
  "comentario": "",
  "segmentos": [
    {
      "tipo_segmento": "IDA",
      "numero_vuelo": "LA123",
      "fecha_vuelo": "2026-03-10",
      "clase_tarifaria": "Económica",
      "politica_equipaje": "1 maleta 23kg",
      "comentario": ""
    },
    {
      "tipo_segmento": "VUELTA",
      "numero_vuelo": "LA456",
      "fecha_vuelo": "2026-03-15",
      "clase_tarifaria": "Económica",
      "politica_equipaje": "1 maleta 23kg",
      "comentario": ""
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
            "cotizacion_id": 1,
            "reemplaza_boleto_id": null,
            "cobertura": "IDA",
            "aerolinea": "LATAM",
            "codigo_reserva": "ZXCV12",
            "numero_tiquete": "987654321",
            "valor_final": "850000",
            "url_archivo_adjunto": "https://dominio.com/boleto/900.pdf",
            "fecha_compra": "2026-02-26T00:00:00.000Z",
            "created_at": "2026-03-10T20:59:25.000Z",
            "segmentos": [
                {
                    "tipo_segmento": "IDA",
                    "numero_vuelo": "LA123",
                    "fecha_vuelo": "2026-03-10",
                    "clase_tarifaria": "Económica",
                    "politica_equipaje": "1 maleta 23kg",
                    "comentario": ""
                },
                {
                    "tipo_segmento": "VUELTA",
                    "numero_vuelo": "LA456",
                    "fecha_vuelo": "2026-03-15",
                    "clase_tarifaria": "Económica",
                    "politica_equipaje": "1 maleta 23kg",
                    "comentario": ""
                }
            ]
        }
    },
    "event": {
        "type": "BOLETO_EMITIDO",
        "affected_entities": [
            {
                "entity": "solicitud",
                "id": 3,
                "new_state": "BOLETO CARGADO"
            },
            {
                "entity": "boleto",
                "id": 2,
                "new_state": "BOLETO EMITIDO"
            }
        ]
    }
}
    
  */

  // POST /cotizacion/:cotizacionId/boleto
  @Post('cotizacion/:cotizacionId/boleto')
  async emitirBoleto(
    @Param('cotizacionId') cotizacionId: string,
    @Body() data: EmitirBoletoDto,
  ) {
    // TODO: Obtener usuarioId del token JWT cuando se implemente autenticacion
    const usuarioId = 1;
    return this.boletoService.emitirBoleto(Number(cotizacionId), usuarioId, data);
  }



    /*
  DESCRIPCIÓN: Admin reemplaza un boleto ya emitido por uno nuevo. El boleto anterior queda anulado y el nuevo boleto queda en estado "EMITIDO". La solicitud asociada a la cotización del boleto reemplazado permanece en estado "BOLETO EMITIDO".
  ENDPOINT POST /boleto/:boletoId/reemplazar
              Ej: POST http://localhost:3000/boleto/2/reemplazar
  BODY
 {
  "cobertura": "IDA",
  "aerolinea": "LATAM",
  "codigo_reserva": "ZXCV12",
  "numero_tiquete": "987654321", 
  "url_archivo_adjunto": "https://dominio.com/boleto/900.pdf",
  "valor_final": 850000,
  "fecha_compra": "2026-02-26",
  "comentario": "",
  "segmentos": [
    {
      "tipo_segmento": "IDA",
      "numero_vuelo": "LA123",
      "fecha_vuelo": "2026-03-10",
      "clase_tarifaria": "Económica",
      "politica_equipaje": "1 maleta 23kg",
      "comentario": ""
    },
    {
      "tipo_segmento": "VUELTA",
      "numero_vuelo": "LA456",
      "fecha_vuelo": "2026-03-15",
      "clase_tarifaria": "Económica",
      "politica_equipaje": "1 maleta 23kg",
      "comentario": ""
    }
  ]
}


  RESPUESTA
  */

  // POST /boleto/:boletoId/reemplazar
  @Post('boleto/:boletoId/reemplazar')
  async reemplazarBoleto(
    @Param('boletoId') boletoId: string,
    @Body() data: ReemplazarBoletoDto,
  ) {
    // TODO: Obtener usuarioId del token JWT cuando se implemente autenticacion
    const usuarioId = 1;
    return this.boletoService.reemplazarBoleto(Number(boletoId), usuarioId, data);
  }


      /*
  DESCRIPCIÓN: El Solicitante puede generar una novedad relacionada con un boleto específico.

  ENDPOINT POST /boleto/:id/novedad
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
              "id": 1,
              "estado": "NOVEDAD"
          },
          "comentario": "El vuelo de regreso ha sido cancelado por la aerolínea y se ha reprogramado para el día siguiente."
      },
      "event": {
          "type": "BOLETO_NOVEDAD_GENERADA",
          "affected_entities": [
              {
                  "entity": "solicitud",
                  "id": 5,
                  "new_state": "NOVEDAD"
              }
          ]
      }
  }
  */
  // POST /boleto/:id/novedad
  @Post('boleto/:id/novedad')
  async generarNovedad(
    @Param('id') id: string,
    @Body() data: NovedadBoletoDto,
  ) {
    const usuarioId = 1;
    return this.boletoService.generarNovedad(Number(id), usuarioId, data);
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

  // POST /boleto/:id/conservar
  @Post('boleto/:id/conservar')
  async conservarBoleto(
    @Param('id') id: string,
    @Body() data: ConservarBoletoDto,
  ) {
    const usuarioId = 1;
    return this.boletoService.conservarBoleto(Number(id), usuarioId, data);
  }

  /*
  DESCRIPCIÓN: El solicitante confirma finalmente estar conforme con  

  ENDPOINT  POST /boleto/:id/confirmar
            Ej: http://localhost:3000/boleto/1/confirmar
  BODY
  {
    "c"
    
  }
  RESPUESTA

  {
    "success": true,
    "message": "Boleto confirmado correctamente",
    "data": {
        "boleto": {
            "id": 1,
            "estado": "CONFORME POR EL EMPLEADO"
        }
    },
    "event": {
        "type": "BOLETO_CONFIRMADO",
        "affected_entities": [
            {
                "entity": "solicitud",
                "id": 5,
                "new_state": "CERRADA"
            }
        ]
    }
}
    
  */

  // POST /boleto/:id/confirmar
  @Post('boleto/:id/confirmar')
  async confirmarBoleto(
    @Param('id') id: string,
    @Body() data: ConfirmarBoletoDto,
  ) {
    const usuarioId = 1;
    return this.boletoService.confirmarBoleto(Number(id), usuarioId, data);
  }
}


