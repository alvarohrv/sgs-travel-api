
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

═══════════════════════════════════════════════════════════════════════════
*/

import { Body, Controller, Get, Post, Param, Query } from '@nestjs/common'
import { SolicitudService } from './solicitud.service'
import { CrearSolicitudDto } from './dto/crear-solicitud.dto'
import { IniciarRevisionDto } from './dto/iniciar-revision.dto'
import { RechazarSolicitudDto } from './dto/rechazar-solicitud.dto'

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
  BODY:
    {
      "tipo_de_vuelo": "IDA_Y_VUELTA",
      "ruta": {
        "origen": "Bogotá",
        "destino": "Medellín"
      },
      "fechas": {
        "ida": "2026-03-10",  
        "vuelta": "2026-03-20"
      }
    }
  RESPUSTA:
    {
      "success": true,
      "message": "Solicitud creada correctamente",
      "data": {
          "solicitud": {
              "id": 2,
              "radicado": "EMP001-2",
              "estado": "PENDIENTE",
              "tipo_de_vuelo": "IDA_Y_VUELTA",
              "created_at": "2026-03-05T16:32:01.000Z"
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
            Ejemplo: POST /solicitud/2/iniciar-revision
 BODY: {
  "observacion": "Revisión iniciada por el admin"
 }
 RESPUESTA:
 {
    "success": true,
    "message": "Solicitud puesta en revisión",
    "data": {
        "solicitud_id": 2,
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

  // ========== ENDPOINTS DE CONSULTA ==========

  // GET /solicitud/todas
  @Get('todas')
  async obtenerTodas() {
    return this.solicitudService.obtenerSolicitudes()
  }

  // GET /solicitud
  // Por query string → GET /solicitudes?id=5 (se considera una ruta estática)
  @Get()
  async obtenerSolicitudes(@Query('id') id?: string) {
    if (id) {
      return this.solicitudService.buscarPorId(id)
    }
    return this.solicitudService.obtenerSolicitudes()
  }
  //@Get() sin argumento responde a la raíz del controlador, es decir /solicitud (luego, con o sin query)"


  // RUTA DINÁMICA GET /solicitud/:id
  // Por parámetro de ruta → GET /solicitudes/5
  // GET /solicitud/:id
  @Get(':id') 
  async obtenerPorId(@Param('id') id: string) {
    return this.solicitudService.buscarPorId(id)
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