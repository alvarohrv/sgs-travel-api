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

import { Body, Controller, Delete, Get, Post, Param, Query, Request, UseGuards } from '@nestjs/common'
import { DemoPolicy } from '../../auth/decorators/demo-policy.decorator'
import { Roles } from '../../auth/decorators/roles.decorator'
import { DemoPolicyGuard } from '../../auth/guards/demo-policy.guard'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { SolicitudService } from './solicitud.service'
import { CerrarSolicitudDto } from './dto/cerrar-solicitud.dto'
import { CrearSolicitudDto } from './dto/crear-solicitud.dto'
import { EliminarSolicitudDto } from './dto/eliminar-solicitud.dto'
import { EliminarSolicitudesUsuarioDto } from './dto/eliminar-solicitudes-usuario.dto'
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
  @Roles('SUPERADMIN', 'ADMIN', 'SOLICITANTE', 'DEMO')
  @UseGuards(JwtAuthGuard, RolesGuard, DemoPolicyGuard)
  @DemoPolicy({ resource: 'solicitud', action: 'create' })
  async crearSolicitud(@Body() data: CrearSolicitudDto, @Request() req: any) {
    const usuarioId = req.user.id
    const userRole = req.user.role
    //// Extrae el cuerpo de la petición (JSON) y lo guarda en la variable 'data'.
    return this.solicitudService.crearSolicitud(data, usuarioId, userRole)
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
            "id": 7,
            "radicado": "EMP002-7",
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
            "created_at": "2026-03-11T22:36:34.000Z"
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
  @Roles('SUPERADMIN', 'ADMIN', 'DEMO')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async iniciarRevision(
    @Param('id') id: string,
    @Body() data: IniciarRevisionDto,
    @Request() req: any,
  ) {
    const usuarioId = req.user.id
    const userRole = req.user.role
    return this.solicitudService.iniciarRevision(Number(id), usuarioId, data, userRole)
  }
   /*
 DESCRIPCION: Cuando un administrador quiere iniciar la revisión de una solicitud, envía un POST a /solicitud/:id/iniciar-revision, donde :id es el ID de la solicitud que quiere revisar. El controlador captura ese ID a través del decorador @Param('id') y también puede recibir un cuerpo opcional con una observación. Luego, llama al método iniciarRevision del servicio, pasando el ID de la solicitud, el usuarioId del admin (que por ahora es fijo) y la observación. El servicio se encarga de cambiar el estado de la solicitud a EN_REVISION y registrar el evento correspondiente.
 ENDPOINT: POST /solicitud/:id/iniciar-revision
            Ejemplo: POST http://localhost:3000/solicitud/7/iniciar-revision
 BODY:
 {
  "observacion": "Revisión iniciada por el admin _S05"
 }
 RESPUESTA:
{
    "success": true,
    "message": "Solicitud en revisión",
    "data": {
        "solicitud_id": 7,
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
  @Roles('SUPERADMIN', 'ADMIN', 'DEMO')
  @UseGuards(JwtAuthGuard, RolesGuard)

  async rechazarSolicitud(
    @Param('id') id: string,
    @Body() data: RechazarSolicitudDto,
    @Request() req: any,
  ) {
    const usuarioId = req.user.id
    const userRole = req.user.role
    return this.solicitudService.rechazarSolicitud(Number(id), usuarioId, data, userRole)
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


  ///// NOTA: La ruta fija debe ir antes de la dinámica /////

  // GET /solicitud/mis-solicitudes
  // Reutiliza el mismo servicio de listado, pero fuerza el filtro por usuario autenticado.
  @Get('mis-solicitudes')
  @UseGuards(JwtAuthGuard)
  async obtenerMisSolicitudes(
    @Request() req: any,
    @Query('estado') estado?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('orden') orden?: string,
  ) {
    const pageNum = parseInt(page ?? '1', 10)
    const limitNum = parseInt(limit ?? '10', 10)
    const ordenVal: 'asc' | 'desc' = orden === 'asc' ? 'asc' : 'desc'

    // Ignoramos cualquier intento de filtrar por otro usuario y usamos el del token.
    return this.solicitudService.obtenerSolicitudes(
      pageNum,
      limitNum,
      ordenVal,
      estado,
      req.user.id,
    )
  }
  /*
  DESCRIPCION: Este endpoint permite a un usuario autenticado obtener solo sus propias solicitudes. El controlador está protegido por JwtAuthGuard, lo que significa que el usuario debe enviar un token JWT válido en la cabecera de la petición. El controlador extrae el ID del usuario del token (req.user.id) y luego llama al método obtenerSolicitudes del servicio, pasando ese ID como filtro para que solo se devuelvan las solicitudes creadas por ese usuario. También soporta los mismos query params de paginación y filtrado por estado que el endpoint general de listado de solicitudes.
  ENDPOINT: GET /solicitud/mis-solicitudes
  Ejemplo: GET http://localhost:3000/solicitud/mis-solicitudes?estado=pendiente&page=1&limit=5
  BODY: No requiere body, pero sí debe incluir un token JWT válido en la cabecera Authorization
  RESPUESTA:
  {

  */



  // GET /solicitud/todas
  @Get('todas')
  @Roles('SUPERADMIN', 'ADMIN', 'DEMO')
  @UseGuards(JwtAuthGuard, RolesGuard)
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
  //   ?estado=pendiente  → filtra por estado de la solicitud
  //   ?usuario_id=3      → filtra por usuario creador
  //   ?page=2         → página 2 (default: 1)
  //   ?limit=5        → 5 resultados por página (default: 10)
  //   ?orden=asc      → más antiguas primero (default: 'desc' = más recientes primero)
  //
  // Ejemplos:
  //   GET http://localhost:3000/solicitud      → página 1, 10 por página, más recientes primero
  //   GET /solicitud?page=2&limit=5       → página 2, 5 por página
  //   GET /solicitud?page=1&limit=3&orden=asc → 3 por página, más antiguas primero
  //   GET /solicitud?estado=pendiente      → filtra por estado pendiente
  //   GET /solicitud?usuario_id=1         → filtra por solicitudes creadas por el usuario con ID 3
  //   GET /solicitud?id=5                  → busca la solicitud con ID 5 (ignora paginación y otros filtros)
  // Buscar por usuario, por estado y paginación al mismo tiempo
  // GET /solicitud?usuario_id=1&estado=rechazada
  // GET /solicitud?usuario_id=3&estado=aprobada&page=1&limit=5
  //Cuidado:
  //   GET /solicitud?id=5&estado=pendiente → busca la solicitud con ID 5, el filtro de estado se ignora porque el ID tiene prioridad
  @Get()
  @Roles('SUPERADMIN', 'ADMIN', 'DEMO')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async obtenerSolicitudes(
    @Query('id') id?: string,
    @Query('estado') estado?: string,
    @Query('usuario_id') usuarioId?: string,
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
    const usuarioIdNum = usuarioId ? parseInt(usuarioId, 10) : undefined

    // Validamos que 'orden' sea exactamente 'asc' o 'desc', cualquier otro valor → 'desc'
    const ordenVal: 'asc' | 'desc' = orden === 'asc' ? 'asc' : 'desc'

    return this.solicitudService.obtenerSolicitudes(
      pageNum,
      limitNum,
      ordenVal,
      estado,
      Number.isNaN(usuarioIdNum) ? undefined : usuarioIdNum,
    )
  }


  // RUTA DINÁMICA GET /solicitud/:id
  // Por parámetro de ruta → GET /solicitudes/5
  // GET /solicitud/:id
  @Get(':id') 
  @Roles('SUPERADMIN', 'ADMIN', 'DEMO')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async obtenerPorId(@Param('id') id: string) {
    return this.solicitudService.buscarPorId(id)
  }

  // 7.5 Cerrar solicitud (marca closed_at, sin borrado físico)
  // POST /solicitud/:id/cerrar
  @Post(':id/cerrar')
  @Roles('SUPERADMIN', 'ADMIN', 'DEMO')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async cerrarSolicitud(
    @Param('id') id: string,
    @Body() data: CerrarSolicitudDto,
    @Request() req: any,
  ) {
    console.log('CERRAR SOLICITUD - Controller')
    const userId = req.user.id
    const userRole = req.user.role
    return this.solicitudService.cerrarSolicitud(Number(id), data, userId, userRole)
  }
  /*
  DESCRIPCION: Este endpoint permite "cerrar" una solicitud sin eliminarla físicamente de la base de datos. Al cerrar una solicitud, se marca el campo closed_at con la fecha y hora actual, lo que indica que la solicitud ya no está activa ni visible en los listados normales.
  ENDPOINT POST /solicitud/:id/cerrar
  Ejemplo: POST http://localhost:3000/solicitud/5/cerrar

  BODY:
  {
    "confirmacion": "CERRAR",
    "motivo": "El viaje se realizó con éxito y ya no se necesitan cambios en esta solicitud."
  }
  RESPUESTA:
{
    "success": true,
    "message": "Solicitud cerrada correctamente",
    "data": {
        "solicitud_id": 10,
        "radicado": "EMP003-10",
        "closed_at": "2026-03-17T23:58:09.811Z",
        "motivo": "El viaje se realizó con éxito y ya no se necesitan cambios en esta solicitud.",
        "resumen_cierre": {
            "boletos": [
                {
                    "boleto_id": 2,
                    "estado_boleto": "CONFORME POR EL EMPLEADO",
                    "cotizacion_asociada": {
                        "id": 14,
                        "estado": "COTIZACION SELECCIONADA",
                        "slug": "cotizacion_seleccionada"
                    }
                }
            ],
            "cotizaciones_sin_boleto": [
                {
                    "cotizacion_id": 12,
                    "estado": "COTIZACION ANULADA",
                    "slug": "cotizacion_anulada"
                },
                {
                    "cotizacion_id": 13,
                    "estado": "COTIZACION ANULADA",
                    "slug": "cotizacion_anulada"
                }
            ]
        }
    },
    "event": {
        "type": "SOLICITUD_CERRADA"
    }
}
*/
//////////////// ESTE ENDPOINT AUNQUE EXITE NO SE EXPONDRA EN LA DOCUMENTACION PUBLICA /////////////////


  // 8️⃣ Eliminar físicamente todas las solicitudes con todas sus dependencias
  // DELETE /solicitud/eliminar-todas
  @Delete('eliminar-todas')
  @Roles('SUPERADMIN','ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
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
  // DELETE /solicitud/usuario/:usuarioId

  @Delete('usuario/:usuarioId')
  @Roles('SUPERADMIN','DEMO')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async eliminarSolicitudesPorUsuario(
    @Param('usuarioId') usuarioId: string,
    @Body() data: EliminarSolicitudesUsuarioDto,
  ) {
    return this.solicitudService.eliminarSolicitudesPorUsuario(Number(usuarioId), data)
  }
/*
DESCRIPCION: Este endpoint es para eliminar físicamente todas las solicitudes de viaje creadas por un usuario específico, junto con todas sus dependencias (cotizaciones, boletos, historial) de la base de datos. Es un endpoint de seguridad crítica, por lo que requiere una confirmación explícita en el body (confirmacion: "ELIMINAR_POR_USUARIO") para evitar borrados accidentales. 

ENDPOINT: DELETE /solicitud/usuario/:usuarioId
  Ejemplo: DELETE http://localhost:3000/solicitud/usuario/5
BODY:
  {
    "confirmacion": "ELIMINAR_POR_USUARIO",
    "motivo": "El usuario 5 es un demo y queremos eliminar todas sus solicitudes de prueba."
  }
RESPUESTA:

*/



  // 7️⃣ Eliminar físicamente una solicitud con todas sus dependencias
  // DELETE /solicitud/:id
  @Delete(':id')
  @Roles('SUPERADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async eliminarSolicitudCompletamente(
    @Param('id') id: string,
    @Body() data: EliminarSolicitudDto,
    @Request() req: any,
  ) {
    const userId = req.user.id
    const userRole = req.user.role
    return this.solicitudService.eliminarSolicitudCompletamente(Number(id), data, userId, userRole)
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