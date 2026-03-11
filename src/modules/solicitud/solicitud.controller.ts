// PENDIENTE
// -- volver a probar endpoint
// -- validar uso de los campos nuevos de auditoria (created_at, updated_at, closed_at disabled_at)









//// Archivo original (antes de la edición):
// import { Controller } from '@nestjs/common';
// import { SolicitudService } from './solicitud.service';
// @Controller('solicitud')
// export class SolicitudController {
//   constructor(private readonly solicitudService: SolicitudService) {}
// }



/*
═══════════════════════════════════════════════════════════════════════════
  CONTROLADOR: SOLICITUD
  Gestión del flujo de solicitudes de viaje
═══════════════════════════════════════════════════════════════════════════

📋 ENDPOINTS DISPONIBLES:

┌─────────────────────────────────────────────────────────────────────────┐
│ ACCIONES DEL FLUJO DE NEGOCIO                                           │
└─────────────────────────────────────────────────────────────────────────┘

  1️⃣  POST   /solicitud
      ➤ Crear nueva solicitud de viaje
      ➤ Estado inicial: PENDIENTE
      ➤ Body: { tipo_de_vuelo, ruta: { origen, destino }, fechas: { ida, vuelta? } }
      ➤ Evento: SOLICITUD_CREADA

  2️⃣  POST   /solicitud/:id/iniciar-revision
      ➤ Admin abre solicitud para revisión (PENDIENTE → EN_REVISION)
      ➤ Body (opcional): { observacion?: string }
      ➤ Evento: SOLICITUD_EN_REVISION

  3️⃣  POST   /solicitud/:id/rechazar
      ➤ Rechazar solicitud (comentario obligatorio)
      ➤ Body: { comentario: string }
      ➤ Evento: SOLICITUD_RECHAZADA

┌─────────────────────────────────────────────────────────────────────────┐
│ CONSULTAS                                                                │
└─────────────────────────────────────────────────────────────────────────┘

  4️⃣  GET    /solicitud
      ➤ Listar todas las solicitudes
      ➤ Incluye: usuario, estado, cotizaciones

  5️⃣  GET    /solicitud/todas
      ➤ Alias de /solicitud (listar todas)

  6️⃣  GET    /solicitud/:id
      ➤ Obtener solicitud específica por ID
      ➤ Incluye: usuario, estado, cotizaciones, boletos, historial completo

    7️⃣  DELETE /solicitud/:id
      ➤ Eliminar físicamente una solicitud y todas sus dependencias
      ➤ Body: { confirmacion: "ELIMINAR", motivo?: string }
      ➤ Evento: SOLICITUD_ELIMINADA_COMPLETAMENTE

═══════════════════════════════════════════════════════════════════════════
*/

import { Body, Controller, Delete, Get, Post, Param, Query } from '@nestjs/common'
import { SolicitudService } from './solicitud.service'
import { CrearSolicitudDto } from './dto/crear-solicitud.dto'
import { EliminarSolicitudDto } from './dto/eliminar-solicitud.dto'
import { EliminarTodasSolicitudesDto } from './dto/eliminar-todas-solicitudes.dto'
import { IniciarRevisionDto } from './dto/iniciar-revision.dto'
import { RechazarSolicitudDto } from './dto/rechazar-solicitud.dto'
//import { audit } from 'rxjs'

@Controller('solicitud') 
export class SolicitudController {

  //  inyección de dependencias desde el constructor <3
  // 'private'permitira el uso de this
  constructor(private solicitudService: SolicitudService) {}

  // ========== ENDPOINTS SEGÚN FLUJO DE NEGOCIO ==========

    ///// Las rutas fijas (estáticas) deben ir antes que las dinámicas. //////
    /*
    Para que tu código sea "a prueba de balas", acostúmbrate a este orden mental:
    POST (Crear).
    GET fijo (/todas, /pendientes).
    GET dinámico (/:id).
    GET raíz (/ con queries).
    */

  // 1️⃣ Crear solicitud (Empleado)
  // POST /solicitud
  @Post()
  async crearSolicitud(@Body() data: CrearSolicitudDto) {
    // TODO: Obtener usuarioId del token JWT cuando se implemente autenticación
    const usuarioId = 1 // Temporal: usuario hardcoded
    //// Extrae el cuerpo de la petición (JSON) y lo guarda en la variable 'data'.
    return this.solicitudService.crearSolicitud(data, usuarioId)
  }
  /*
  DESCRIPCION: Para crear una solicitud, el cliente envía un POST a /solicitud con un JSON que tiene el tipo de vuelo, la ruta (origen y destino) y las fechas. El controlador recibe esa información en el parámetro 'data' gracias al decorador @Body(). Luego, llama al método crearSolicitud del servicio, pasando esos datos junto con un usuarioId (que por ahora es fijo pero luego vendrá del token JWT). El servicio se encarga de toda la lógica para crear la solicitud en la base de datos y devuelve una respuesta estándar que el controlador retorna al cliente.
  ENDPOINT: POST /solicitud
            Ejemplo: POST http://localhost:3000/solicitud
  BODY:
    {
      "tipo_de_vuelo": "IDA_Y_VUELTA",
      "ruta": {
        "origen": "Bogotá",
        "destino": "Medellín",
        "preferencia_aerolinea": "LATAM"
      },
      "fechas": {
        "ida": "2026-03-10",  
        "vuelta": "2026-03-20"
      }
    }
  - nota: preferencia_aerolinea es un campo opcional.
  RESPUSTA:
 {
    "success": true,
    "message": "Solicitud creada correctamente",
    "data": {
        "solicitud": {
            "id": 6,
            "radicado": "EMP001-6",
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
            "created_at": "2026-03-10T01:04:47.000Z"
        }
    },
    "event": {
        "type": "SOLICITUD_CREADA"
    }
}
  */

  // 2️⃣ Admin abre solicitud para revisión
  // POST /solicitud/:id/iniciar-revision
  @Post(':id/iniciar-revision')
  async iniciarRevision(
    @Param('id') id: string,
    @Body() data: IniciarRevisionDto
  ) {
    // TODO: Obtener usuarioId del token JWT cuando se implemente autenticación
    const usuarioId = 1 // Temporal: usuario administrador hardcoded
    return this.solicitudService.iniciarRevision(Number(id), usuarioId, data)
  }
   /*
 DESCRIPCION: Cuando un administrador quiere iniciar la revisión de una solicitud, envía un POST a /solicitud/:id/iniciar-revision, donde :id es el ID de la solicitud que quiere revisar. El controlador captura ese ID a través del decorador @Param('id') y también puede recibir un cuerpo opcional con una observación. Luego, llama al método iniciarRevision del servicio, pasando el ID de la solicitud, el usuarioId del admin (que por ahora es fijo) y la observación. El servicio se encarga de cambiar el estado de la solicitud a EN_REVISION y registrar el evento correspondiente.
 ENDPOINT: POST /solicitud/:id/iniciar-revision
            Ejemplo: POST http://localhost:3000/solicitud/6/iniciar-revision
 BODY:
 {
  "observacion": "Revisión iniciada por el admin _S05"
 }
 RESPUESTA:
{
    "success": true,
    "message": "Solicitud en revisión",
    "data": {
        "solicitud_id": 6,
        "estado": "EN REVISION"
    },
    "event": {
        "type": "SOLICITUD_EN_REVISION"
    }
}
*/

  // 3️⃣ Rechazar solicitud (comentario obligatorio)
  // POST /solicitud/:id/rechazar
  @Post(':id/rechazar')
  async rechazarSolicitud(
    @Param('id') id: string,
    @Body() data: RechazarSolicitudDto
  ) {
    // TODO: Obtener usuarioId del token JWT cuando se implemente autenticación
    const usuarioId = 1 // Temporal: usuario hardcoded
    return this.solicitudService.rechazarSolicitud(Number(id), usuarioId, data)
  }

  /*
  DESCRIPCION: Cuando se rechaza una solicitud, el cliente envía un POST a /solicitud/:id/rechazar con un comentario obligatorio que explica el motivo del rechazo. El controlador captura el ID de la solicitud a través del parámetro de ruta y el comentario a través del cuerpo de la petición. Luego, llama al método rechazarSolicitud del servicio, que se encarga de cambiar el estado de la solicitud a RECHAZADA, registrar el comentario y disparar el evento correspondiente.
  ENDPOINT: POST /solicitud/:id/rechazar
            Ejemplo: POST http://localhost:3000/solicitud/1/rechazar
  BODY:
    {
      "comentario": "Solicitud no cumple con los requisitos mínimos para ser procesada. Por favor revise la información y genera una nueva solicitud." 
    }
  RESPUESTA:
  {
      "success": true,
      "message": "Solicitud rechazada correctamente",
      "data": {
          "solicitud_id": 1,
          "estado": "RECHAZADA",
          "comentario": "Solicitud no cumple con los requisitos mínimos para ser procesada. Por favor revise la información y genera una nueva solicitud."
      },
      "event": {
          "type": "SOLICITUD_RECHAZADA"
      }
  }
  */


  // ========== ENDPOINTS DE CONSULTA ==========

  // GET /solicitud/todas
  @Get('todas')
  async obtenerTodas() {
    // Sin parámetros → usa los defaults: page=1, limit=10, orden='desc'
    return this.solicitudService.obtenerSolicitudes()
  }
  /*
  DESCRIPCION: Este endpoint es un alias de GET /solicitud, es decir, hace exactamente lo mismo que GET /solicitud sin parámetros. Está pensado para facilitar la consulta de todas las solicitudes sin tener que usar query params. El controlador simplemente llama al método obtenerSolicitudes del servicio sin pasarle ningún parámetro, lo que hará que el servicio use los valores por defecto (página 1, 10 resultados por página, orden descendente).
  ENDPOINT: GET /solicitud/todas
*/




  // GET /solicitud
  // Por query string → GET /solicitud?id=5 (se considera una ruta estática)
  // Soporta query params opcionales:
  //   ?id=5           → busca una solicitud específica por ID
  //   ?page=2         → página 2 (default: 1)
  //   ?limit=5        → 5 resultados por página (default: 10)
  //   ?orden=asc      → más antiguas primero (default: 'desc' = más recientes primero)
  //
  // Ejemplos:
  //   GET /solicitud                      → página 1, 10 por página, más recientes primero
  //   GET /solicitud?page=2&limit=5       → página 2, 5 por página
  //   GET /solicitud?page=1&limit=3&orden=asc → 3 por página, más antiguas primero
  @Get()
  async obtenerSolicitudes(
    @Query('id') id?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('orden') orden?: string,
  ) {
    // Si llegó un ?id=X, buscamos esa solicitud específica (ignora paginación)
    if (id) {
      return this.solicitudService.buscarPorId(id)
    }

    // Convertimos los query params de string a número/tipo correcto.
    // Los query params SIEMPRE llegan como string desde la URL,
    // por eso usamos parseInt() y validamos que el valor sea válido.
    const pageNum  = parseInt(page  ?? '1',  10) // default: página 1
    const limitNum = parseInt(limit ?? '10', 10) // default: limite 10 por página

    // Validamos que 'orden' sea exactamente 'asc' o 'desc', cualquier otro valor → 'desc'
    const ordenVal: 'asc' | 'desc' = orden === 'asc' ? 'asc' : 'desc'

    return this.solicitudService.obtenerSolicitudes(pageNum, limitNum, ordenVal)
  }


  // RUTA DINÁMICA GET /solicitud/:id
  // Por parámetro de ruta → GET /solicitudes/5
  // GET /solicitud/:id
  @Get(':id') 
  async obtenerPorId(@Param('id') id: string) {
    return this.solicitudService.buscarPorId(id)
  }

//////////////// ESTE ENDPOINT AUNQUE EXITE NO SE EXPONDRA EN LA DOCUMENTACION PUBLICA /////////////////

  // 8️⃣ Eliminar físicamente todas las solicitudes con todas sus dependencias
  // DELETE /solicitud/eliminar-todas

  @Delete('eliminar-todas')
  async eliminarTodasLasSolicitudes(
    @Body() data: EliminarTodasSolicitudesDto,
  ) {
    return this.solicitudService.eliminarTodasLasSolicitudes(data)
  }
/*
DESCRIPCION: Este endpoint es para eliminar físicamente todas las solicitudes de viaje y todas sus dependencias (cotizaciones, boletos, historial) de la base de datos. Es un endpoint de seguridad crítica, por lo que requiere una confirmación explícita en el body (confirmacion: "ELIMINAR_TODAS") para evitar borrados accidentales. El controlador recibe los datos de confirmación en el cuerpo de la petición y luego llama al método eliminarTodasLasSolicitudes del servicio, que se encarga de realizar la eliminación física en la base de datos. Si la eliminación es exitosa, se dispara un evento SOLICITUDES_ELIMINADAS_COMPLETAMENTE para notificar a otros sistemas o servicios interesados.
ENDPOINT: DELETE /solicitud/eliminar-todas
  Ejemplo: DELETE http://localhost:3000/solicitud/eliminar-todas
BODY:
  {
    "confirmacion": "ELIMINAR_TODAS",
    "motivo": "Limpieza de datos de prueba después del desarrollo.",
    "reiniciar_indices": true
  }
RESPUESTA:
*/

//////////////// ESTE ENDPOINT AUNQUE EXITE NO SE EXPONDRA EN LA DOCUMENTACION PUBLICA /////////////////s
  // 7️⃣ Eliminar físicamente una solicitud con todas sus dependencias
  // DELETE /solicitud/:id
  @Delete(':id')
  async eliminarSolicitudCompletamente(
    @Param('id') id: string,
    @Body() data: EliminarSolicitudDto,
  ) {
    return this.solicitudService.eliminarSolicitudCompletamente(Number(id), data)
  }
}
/*
DESCRIPCION: Este endpoint es para eliminar físicamente una solicitud de viaje y todas sus dependencias (cotizaciones, boletos, historial) de la base de datos. Es un endpoint de seguridad crítica, por lo que requiere una confirmación explícita en el body (confirmacion: "ELIMINAR") para evitar borrados accidentales. El controlador recibe el ID de la solicitud a eliminar a través del parámetro de ruta y los datos de confirmación en el cuerpo de la petición. Luego, llama al método eliminarSolicitudCompletamente del servicio, que se encarga de realizar la eliminación física en la base de datos. Si la eliminación es exitosa, se dispara un evento SOLICITUD_ELIMINADA_COMPLETAMENTE para notificar a otros sistemas o servicios interesados.
ENDPOINT: DELETE /solicitud/:id
Ejemplo: DELETE /solicitud/5
BODY:
  {
    "confirmacion": "ELIMINAR",
    "motivo": "Solicitud duplicada, se creó por error."
  }
RESPUESTA:










/////////////////////////////////////////////////////////////////////
/*
DESCRIPCION: Esta ruto para eliminar una solicitud es un endpoint de seguridad crítica, por lo que requiere una confirmación explícita en el body (confirmacion: "ELIMINAR") para evitar borrados accidentales. El controlador recibe el ID de la solicitud a eliminar a través del parámetro de ruta y los datos de confirmación en el cuerpo de la petición. Luego, llama al método eliminarSolicitudCompletamente del servicio, que se encarga de eliminar físicamente la solicitud y todas sus dependencias (cotizaciones, boletos, historial) de la base de datos. Si la eliminación es exitosa, se dispara un evento SOLICITUD_ELIMINADA_COMPLETAMENTE para notificar a otros sistemas o servicios interesados.
ENDPOINT: DELETE /solicitud/:id
Ejemplo: DELETE /solicitud/5
BODY:
  {
    "confirmacion": "ELIMINAR",
    "motivo": "Solicitud duplicada, se creó por error."
  }
RESPUESTA:
  {
      "success": true,
      "message": "Solicitud eliminada completamente de la base de datos",
      "data": {
          "solicitud_id": 6,
          "radicado": "EMP001-6",
          "motivo": "Solicitud duplicada, se creó por error.",
          "eliminados": {
              "historial_boletos": 0,
              "boletos": 0,
              "historial_cotizaciones": 0,
              "segmentos_cotizacion": 0,
              "cotizaciones": 0,
              "detalle_vuelo_solicitud": 1,
              "historial_solicitud": 1,
              "solicitudes": 1
          }
      },
      "event": {
          "type": "SOLICITUD_ELIMINADA_COMPLETAMENTE"
      }
  }
/*
DESCRIPCION GENERAL DEL CONTROLADOR:
El controlador de solicitud es el encargado de manejar las rutas HTTP relacionadas con las solicitudes de viaje. Define los endpoints para crear una solicitud, iniciar su revisión, rechazarla y obtener solicitudes. Utiliza decoradores como @Controller para definir la ruta base, @Post y @Get para definir los métodos HTTP y las rutas específicas, y @Body, @Param y @Query para extraer datos de la petición. El controlador delega toda la lógica de negocio al servicio de solicitud, que se encarga de interactuar con la base de datos y procesar la información. El controlador simplemente recibe las peticiones, extrae los datos necesarios y llama al servicio para obtener una respuesta que luego retorna al cliente.
ENDPOINTS: Ej: GET /solicitud/2

RESPUESTA:
  nota: cuidado, se identifico que trae TODO el historia, y se requiere el ultimo estado para esta solicitud (ordenar por fecha y traer el ultimo registro del historial de esa solicitud)
  {
      "success": true,
      "message": "Solicitud obtenida correctamente",
      "data": {
          "solicitud": {
              "id": 1,
              "radicado": "RAD-2026-001",
              "usuario_id": 1,
              "estado_actual_id": 4,
              "tipo_de_vuelo": "IDA_Y_VUELTA",
              "created_at": "2026-03-05T11:30:21.000Z",
              "updated_at": null,
              "deleted_at": null,
              "usuario": {
                  "id": 1,
                  "nombre": "Alvaro",
                  "username": "alvaro",
                  "numero_documento": "12345678"
              },
              "estado_solicitud": {
                  "id": 4,
                  "estado": "BOLETO CARGADO",
                  "slug": "boleto_cargado",
                  "color_hexa_main": "#20c997",
                  "color_hexa_sec": "#63e6be",
                  "editable": true
              },
              "cotizacion": [
                  {
                      "id": 1,
                      "solicitud_id": 1,
                      "cotizacion_anterior_id": null,
                      "estado_actual_id": 7,
                      "cobertura": "IDA_Y_VUELTA",
                      "valor_total": "1500.5",
                      "aerolinea": "Avianca",
                      "created_at": "2026-03-05T11:30:21.000Z",
                      "estado_cotizacion": {
                          "id": 7,
                          "estado": "COTIZACION SELECCIONADA",
                          "slug": "cotizacion_seleccionada",
                          "editable": false
                      },
                      "boleto": [
                          {
                              "id": 1,
                              "cotizacion_id": 1,
                              "reemplaza_boleto_id": null,
                              "estado_actual_id": 1,
                              "aerolinea": "Avianca",
                              "codigo_reserva": "ABC123XYZ",
                              "numero_tiquete": "005-123456789",
                              "url_archivo_adjunto": null,
                              "valor_final": "1500.5",
                              "fecha_compra": null,
                              "created_at": "2026-03-05T11:30:21.000Z",
                              "estado_boleto": {
                                  "id": 1,
                                  "estado": "BOLETO EMITIDO",
                                  "slug": "boleto_emitido",
                                  "editable": true
                              }
                          }
                      ]
                  }
              ],
              "historial_estado_solicitud": []
          }
      }
  }

*/

/*
El flujo completo del código

Cliente HTTP (Postman, frontend)
        │
        │  POST /solicitudes  { ...datos... }
        ▼
@Controller('solicitudes')         ← define la ruta base
  @Post() crearSolicitud()         ← captura POST /solicitudes
    @Body() data                   ← extrae el body de la petición
        │
        ▼
  SolicitudService.crearSolicitud(data)   ← delega la lógica al servicio
        │
        ▼
  Respuesta al cliente


*/

/** LLEVAR A TEORIA NEST para borrar (aun no llevado)
 TEORIA:
Conceptos clave: decoradores, módulos y la inyección de dependencias.

¿Qué son los @decoradores?
Un decorador es una función que empieza con @ y se pega encima de una clase o método para agregarle comportamiento sin modificar su código interno.


¿Qué es @nestjs/common?
Es el paquete central de NestJS del que importas las herramientas más usadas. 
Controller - Marca una clase como controlador (maneja rutas HTTP)
Get - Indica que un método responde a GET /ruta
Post - Indica que un método responde a POST /ruta
Body - Extrae el cuerpo (body) de la petición HTTP

NestJS utiliza un paradigma llamado Programación Orientada a Aspectos y se apoya mucho en los Decoradores.
Decorador: agregar comportamiento sin tocar el código.
Un decorador no sobreescribe nada. Lo que hace es envolver una función o clase para agregarle algo extra por fuera, sin modificarla internamente.
@Controller('solicitudes')  // "Esta clase maneja rutas que empiezan con /solicitudes"
@Post()                    // "Este método responde a POST /solicitudes"
@Get()                     // "Este método responde a GET /solicitudes"
Por ejemplo, el decorador @get() ya valida el 'REQUEST_METHOD', si el requerimiento esta vacio ('/') o envia un 'id', etc.
Algo como:
app.get('/solicitudes', (req, res) => {
    const resultado = solicitudController.obtenerSolicitudes()
    res.json(resultado)
})

DTO significa Data Transfer Object. Es una clase que define la forma exacta que deben tener los datos que llegan en el body. Si el cliente manda campos de más o de menos, el DTO lo controla.
Es el equivalente a validar de forma estructurada y con tipos de TypeScript.

 */