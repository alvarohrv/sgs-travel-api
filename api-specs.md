
Contratos JSON entre módulos y eventos encadenados, en un sistema orientado a eventos.
COTIZACION DESCARTADA
Ddiseño de workflows.
Acción → Validación → Transición controlada → Evento

Estructura base para respuestas
~~~json
{
  "success": true,
  "message": "Cotización creada correctamente",
  "data": { }, //LO QUE EL FORNTEND REQUIERE RENDERIZAR
  "event": {   // LO QUE EL SISTEMA DEBE CAMBIAR  
    "type": "COTIZACION_CREADA",
    "affected_entities": []
  }
}
~~~
Tu estructura es buena si planeas agregar:
Permite:
✔ Informar resultado
✔ Indicar qué cambió
✔ Indicar qué entidades fueron afectadas
✔ Consistente con arquitectura orientada a eventos
✔ Permite facilidad para la paginación, filtrado y manejo de errores en el futuro
El JSON tiene 3 niveles:
🔹 success / message
    Resultado técnico.
🔹 data
    Información de la entidad principal creada o modificada.
🔹 event
    Cambios derivados que afectan otras entidades.

---

Siempre hay dos JSON en una API REST:
✅ JSON de solicitud (request) → Frontend → Backend
✅ JSON de respuesta (response) → Backend → Frontend

---
# 🧩 2. Sobre los permisos

En cada endpoint se define:
🔒 Acceso: Público o Protegido (requiere autenticación)
🔑 Roles permitidos: SOLICITANTE, DEMO, ADMIN, SUPERADMIN

- SOLICITANTE: Solo puede crear solicitudes y ver sus propias solicitudes.

- DEMO: Puede crear solicitudes y ver todas las solicitudes, cotizaciones y boletos (GET).
  Nota: DEMO es un rol especial para pruebas, solo puede manipular solicitudes creadas con su usuario (y las cotizaciones y boletos asociadas a esas solicitudes creadas por él), este ROL sí puede ver todas las solicitudes, cotizaciones, boletos para facilitar la demostración de esta aplicacion de Portafolio.
  El rol DEMO es un "rol híbrido" o de "política especial":
  El Usuario con rol DEMO puede crear hasta 5 solicitudes de prueba, y solo puede manipular esas solicitudes y sus cotizaciones y boletos asociados. No puede modificar solicitudes de otros usuarios. Si borra una solicitud de prueba, esa acción le permite crear otra solicitud (si llega al límite el sistema le indicara que debe eliminar solicitudes creadas por él).
  El Usuario con rol DEMO puede crear hasta 10 cotizaciones de prueba (independiente de los estados que tengan) , y solo puede ver esas cotizaciones y sus boletos asociados. No puede modificar cotizaciones de otros usuarios.
  El Usuario con rol DEMO puede crear hasta 15 boletos de prueba (independiente de los estados que tengan) , y solo puede ver esos boletos asociados a sus cotizaciones de prueba. No puede modificar boletos de otros usuarios.

Como estrategia no se sobrecarga el RoleGuard. Crea un DemoPolicyGuard específico para el rol DEMO.
RoleGuard: Verifica si el usuario es SOLICITANTE, ADMIN o DEMO.
DemoPolicyGuard (o un Guard específico para Demo): Solo se activa si el rol es DEMO. Este guard verifica sus contadores (5 solicitudes, 10 cotizaciones, 15 boletos.) antes de permitir la acción.

@Roles('ADMIN','SUPERADMIN','DEMO')
@UseGuards(JwtAuthGuard, RolesGuard, DemoPolicyGuard)

Se crea la tabla 'estadísticas_de_uso_demo' con columnas como:
user_id, solicitudes_creadas, cotizaciones_creadas, boletos_creados, ultima_actualizacion, etc.
Logica:
Si ultima_actualizacion es distinta a la fecha de hoy al realizar el login, el servicio resetea las columnas a 0 y actualiza la fecha a hoy.
Si es igual a hoy, simplemente verifica si el contador llegó a 5, 10 o 15 antes de permitir la acción de creacion.

Ahora bien:
- EL servicio de creación de solicitudes esta disponible para DEMO.
- El servicio de creación de cotizaciones esta disponible para DEMO, pero solo para las solicitudes creadas por el usuario DEMO. Antes de crear la cotización, el servicio hace una consulta para verificar que la solicitud a la que se le va a crear la cotización fue creada por el usuario DEMO. Si el usuario DEMO intenta crear una cotización para una solicitud que no fue creada por él, el servicio devuelve un error indicando que no tiene permiso para realizar esa acción.
- El servicio de creación de boletos esta disponible para DEMO, pero solo para las cotizaciones creadas por el usuario DEMO. Antes de crear el boleto, el servicio hace una consulta para verificar que la cotización a la que se le va a crear el boleto fue creada por el usuario DEMO. Si el usuario DEMO intenta crear un boleto para una cotización que no fue creada por él, el servicio devuelve un error indicando que no tiene permiso para realizar esa acción.
- otros servicios de modificación (ej: rechazar cotización, generar novedad, revisar etc) están disponibles para DEMO siempre y cuando la entidad (solicitud, cotización o boleto) haya sido creada por el usuario DEMO. Antes de realizar la acción, el servicio hace una consulta para verificar que la entidad a la que se le va a aplicar la acción fue creada por el usuario DEMO. Si el usuario DEMO intenta modificar una entidad que no fue creada por él, el servicio devuelve un error indicando que no tiene permiso para realizar esa acción.
- Los servicios de creación de solicitudes, cotizaciones y boletos deben actualizar estos contadores en la tabla 'estadísticas_de_uso_demo' cada vez que un usuario con rol DEMO realice una acción de creación exitosa. 
- Los servicios de eliminación de solicitudes, cotizaciones y boletos deben permitir la eliminación sin restricciones para el rol DEMO siempre que la entidad haya sido creada por el usuario DEMO, y al eliminar una entidad creada por el usuario DEMO, se debe decrementar el contador correspondiente en la tabla 'estadísticas_de_uso_demo'.
- Los servicios de consulta (GET) para el rol DEMO deben permitir ver todas las solicitudes, cotizaciones y boletos para las entidades creadas o no creadas por el usuario DEMO.

- ADMIN: Puede crear, revisar, cotizar y ver todas las solicitudes, cotizaciones y boletos; siempre que tenga los permisos correspondientes.

- SUPERADMIN: Tiene todos los permisos de ADMIN y además puede gestionar usuarios y roles.

...................
| Endpoint                   | ADMIN | SOLICITANTE |
| -------------------------- | ----- | ----------- |
| POST /auth/login           | ✔     | ✔           |
| GET /auth/me               | ✔     | ✔           |
| POST /usuarios             | ✔     | ❌           |
| GET /usuarios              | ✔     | ❌           |
| GET /usuarios/:id          | ✔     | propio      |
| PATCH /usuarios/:id/rol    | ✔     | ❌           |
| PATCH /usuarios/:id/estado | ✔     | ❌           |
| POST /solicitud            | ✔     | ✔           |
| GET /solicitud             | ✔     | propio      |




---
# 🧩 3. Flujo estructurado con JSON

## 🟣 0. Login

Acceso: 🔓 Público | Rol permitido: N/A (registro abierto)

Permite a los usuarios autenticarse y obtener un token JWT para acceder a las rutas protegidas.

Especificaciones técnicas:
URL: /auth/login
Método: POST
Header: Authorization: Bearer <token>

* JSON de solicitud (request)
POST /api/v1/auth/login
```json
{
  "username": "usuario_demo",
  "password": "usuario_demo"
}
```
* JSON de respuesta (response)
```json
{
    "success": true,
    "message": "Login exitoso",
    "data": {
        "token": "eyJhbGciOiJIU6IkpXVCJ9.eyJzdWIiOjxJQ0lUQU5URSIsImlhdCI6MTc3NTQ4OTYyNCwiZXhwIjoxNzc1NDkzMjI0fQ.f4D75dd547vF4E5w6",
        "user": {
            "id": 4,
            "username": "usuario_demo",
            "role": "DEMO"
        }
    }
}
```


## 🟢 1. Solicitud creada.

Acceso: 🔒 Protegido | Rol permitido: SOLICITANTE, DEMO, ADMIN, SUPERADMIN

Estado inicial: `PENDIENTE`

Especificaciones técnicas:
URL: /api/v1/solicitud
Método: POST
Header: Authorization: Bearer <token>

* JSON de solicitud (request)
URL: /api/v1/solicitud (POST)

```json
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
```
Nota:
El usuario_id no debe venir del frontend.
Se obtiene del usuario autenticado (token JWT o sesión).
// const usuarioId = req.user.id;


* JSON de respuesta (response)
```json
{
    "success": true,
    "message": "Solicitud creada correctamente",
    "data": {
        "solicitud": {
            "id": 7,
            "radicado": "EMP000-7",
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
            "created_at": "2026-04-06T16:03:19.000Z"
        }
    },
    "event": {
        "type": "SOLICITUD_CREADA"
    }
}
```

## 🟡 2. Admin abre solicitud.

Acceso: 🔒 Protegido | Rol permitido: DEMO, ADMIN, SUPERADMIN

Si estaba en `PENDIENTE` → cambia a `EN_REVISION`

Especificaciones técnicas:
URL: /api/v1/solicitud/:solicitudId/iniciar-revision
Método: POST
Header: Authorization: Bearer <token>

* JSON de solicitud (request)
URL:  POST /api/v1/solicitud/7/iniciar-revision (Accion explicita - cuerpo vacio)

nota: Un GET no debería modificar estado (principio REST).
evitar la forma GET /solicitud/25 para cambiar un estado
✔ GET solo consulta
✔ POST ejecuta acción

El backend detecta:
Si está en PENDIENTE la solicitud
Y el usuario es Admin
→ Entonces cambia a EN_REVISION cuando Admin inicie la revision

* JSON de solicitud (request)
URL:  POST /solicitud/6/iniciar-revision (Accion explicita - cuerpo opcional)
```json
 {
  "observacion": "Revisión iniciada por el admin _S05"
 }
```
```json
 {}
```
* JSON de respuesta (response)
```json
{
    "success": true,
    "message": "Solicitud en revisión",
    "data": {
        "solicitud_id": 7,
        "estado": "EN REVISION",
        "msn_sistema": "Revisión iniciada por SR USUARIO (EMP000)"
    },
    "event": {
        "type": "SOLICITUD_EN_REVISION"
    }
}
```

## 🔴 3. Admin rechaza solicitud

Acceso: 🔒 Protegido | Rol permitido: DEMO, ADMIN, SUPERADMIN

Verifica que solicitud esté en EN_REVISION
Cambia solicitud → `RECHAZADA`
Registra historial
Devuelve respuesta

Estos ocurre cuando el admin revisa la solicitud y decide que no se puede cotizar (ej: falta información crítica, fechas no válidas, duplicados, etc).
Eventualmente la solicitud rechazada pasara a un estado "CERRADA".

Especificaciones técnicas:
URL: /api/v1/solicitud/:solicitudId/rechazar
Método: POST
Header: Authorization: Bearer <token>

* JSON de solicitud (request)
URL:  POST /api/v1/solicitud/7/rechazar (Accion explicita - cuerpo vacio)
```json
  {
    "comentario": "Solicitud no cumple con los requisitos mínimos para ser procesada. Por favor revise la información y genera una nueva solicitud." 
  }
```

* JSON de respuesta (response)
```json
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
```

## 🟡 3. Admin revisa una cotizacion rechazada

Acceso: 🔒 Protegido | Rol permitido: DEMO, ADMIN, SUPERADMIN

Es posible segun sea el caso, volver a abrir una solicitud rechazada (mas no asi una cerrada).

En este caso el Admin revisa una solicitud que estaba en `COTIZACION_RECHAZADA` y decide que se puede revisar de nuevo, entonces la solicitud vuelve a `EN_REVISION` para que el admin pueda cargar una nueva cotización o conservar la existente.
Si estaba en `COTIZACION_RECHAZADA` → cambia a `EN_REVISION`

Especificaciones técnicas:
URL: /api/v1/solicitud/:solicitudId/iniciar-revision
Método: POST
Header: Authorization: Bearer <token>


* JSON de solicitud (request)
URL:  POST /api/v1/solicitud/7/iniciar-revision (Accion explicita - cuerpo vacio)
```json
 {
  "observacion": "Revisión iniciada nuevamente por el admin _E000"
 }
 ```
 * JSON de respuesta (response)
```json
{
    "success": true,
    "message": "Solicitud en revisión",
    "data": {
        "solicitud_id": 7,
        "estado": "EN REVISION",
        "msn_sistema": "Revisión iniciada por SR USUARIO (EMP000)"
    },
    "event": {
        "type": "SOLICITUD_EN_REVISION"
    }
}
```

## 🟣 5. Obtener todas las solicitudes por parte del solicitante.

Acceso: 🔒 Protegido | Rol permitido: SOLICITANTE, DEMO, ADMIN, SUPERADMIN

Este endpoint permite a un usuario autenticado obtener solo sus propias solicitudes.
El controlador extrae el ID del usuario del token (req.user.id) y luego llama al método para obtener solicitudes
Ademas soporta mismos query params de paginación y filtrado por estado.

Especificaciones técnicas:
URL: /api/v1/solicitud/mis-solicitudes
Método: GET
Header: Authorization: Bearer <token>


* JSON de solicitud (request)
URL:  GET /api/v1/solicitud/mis-solicitudes
PARAMETROS OPCIONALES: ?estado=en_revision&page=1&limit=5
(Accion explicita - cuerpo vacio)
```json
 {}
 ```
 * JSON de respuesta (response)
```json
{
    "success": true,
    "message": "Solicitudes obtenidas correctamente",
    "data": {
        "solicitudes": [
            {
                "id": 7,
                "radicado": "EMP000-7",
                "usuario_id": 4,
                "estado_actual_id": 2,
                "tipo_de_vuelo": "IDA_Y_VUELTA",
                "created_at": "2026-04-06T16:03:19.000Z",
                "updated_at": "2026-04-06T16:43:24.000Z",
                "closed_at": null,
                "usuario": {
                    "id": 4,
                    "nombre": "Sr Usuario",
                    "username": "usuario_demo"
                },
                "estado_solicitud": {
                    "id": 2,
                    "estado": "EN REVISION",
                    "slug": "en_revision",
                    "editable": true,
                    "created_at": "2026-04-06T10:57:32.000Z"
                },
                "ruta": {
                    "origen": "Bogotá",
                    "destino": "Medellín",
                    "preferencia_aerolinea": "LATAM"
                },
                "fechas": {
                    "ida": "2026-03-10",
                    "vuelta": "2026-03-20"
                },
                "cotizacion": []
            }
        ],
        "paginacion": {
            "total": 1,
            "totalPaginas": 1,
            "paginaActual": 1,
            "limit": 5,
            "orden": "desc",
            "filtros": {
                "estado": "en_revision",
                "usuario_id": 4
            }
        }
    }
}
```

## 🟣 5. Obtener todas las solicitudes por parte del administrador.

Acceso: 🔒 Protegido | Rol permitido: DEMO, ADMIN, SUPERADMIN

Este endpoint es el más flexible para consultar solicitudes, pero solo esta disponible para administradores, el mismo soporta múltiples query params para filtrar, paginar y ordenar los resultados.
El controlador primero verifica si se recibió un query param 'id' (para una solicitud en particular), en cuyo caso llama al servicio para buscar esa solicitud específica por ID (ignorando cualquier otro filtro o paginación).
Si no se recibió un 'id', entonces procesa los demás query params ('page','limit','orden') para obtener una lista de todas solicitudes que cumplan con los criterios especificados.


Especificaciones técnicas:
URL: /api/v1/solicitud
Método: GET
Header: Authorization: Bearer <token>

Soporta query params opcionales, ejemplo:
?id=5           → busca una solicitud específica por ID
?page=2         → página 2 (default: 1)
?limit=5        → 5 resultados por página (default: 10)
?orden=asc      → más antiguas primero (default: 'desc' = más recientes primero)

* JSON de solicitud (request)
URL:  GET /api/v1/solicitud
PARAMETROS OPCIONALES: ?usuario_id=1?page=1&limit=2&orden=asc
(Accion explicita - cuerpo vacio)

```json
 {}
 ```
 * JSON de respuesta (response)
```json
{
    "success": true,
    "message": "Solicitudes obtenidas correctamente",
    "data": {
        "solicitudes": [
            {
                "id": 5,
                "radicado": "RAD-2026-033",
                "usuario_id": 1,
                "estado_actual_id": 3,
                "tipo_de_vuelo": "IDA_Y_VUELTA",
                "created_at": "2026-04-06T10:59:07.000Z",
                "updated_at": null,
                "closed_at": null,
                "usuario": {
                    "id": 1,
                    "nombre": "Carlos",
                    "username": "carlos"
                },
                "estado_solicitud": {
                    "id": 3,
                    "estado": "COTIZACION CARGADA",
                    "slug": "cotizacion_cargada",
                    "editable": true,
                    "created_at": "2026-04-06T10:57:32.000Z"
                },
                "ruta": {
                    "origen": "Bogotá",
                    "destino": "Cali",
                    "preferencia_aerolinea": "LATAM"
                },
                "fechas": {
                    "ida": "2026-05-05",
                    "vuelta": "2026-05-12"
                },
                "cotizacion": [
                    {
                        "id": 3,
                        "solicitud_id": 5,
                        "cotizacion_anterior_id": null,
                        "usuario_solicitante": {
                            "id": 1,
                            "nombre": "Carlos"
                        },
                        "usuario_emite_boleto": null,
                        "estado_actual_id": 1,
                        "cobertura": "IDA_Y_VUELTA",
                        "valor_total": "850",
                        "created_at": "2026-04-06T10:59:07.000Z",
                        "updated_at": null,
                        "closed_at": null,
                        "estado_cotizacion": {
                            "id": 1,
                            "estado": "COTIZACION NUEVA",
                            "slug": "cotizacion_nueva",
                            "editable": true,
                            "created_at": "2026-04-06T10:57:32.000Z"
                        },
                        "ruta": {
                            "origen": "Bogotá",
                            "destino": "Cali"
                        },
                        "detalle": {
                            "ida": {
                                "aerolinea": "LATAM",
                                "fecha": "2026-04-15",
                                "vuelo": "LA4321",
                                "clase_tarifaria": "Económica",
                                "politica_equipaje": "Solo equipaje de mano"
                            }
                        },
                        "boleto": []
                    }
                ]
            },
            {
                "id": 2,
                "radicado": "RAD-2026-020",
                "usuario_id": 1,
                "estado_actual_id": 2,
                "tipo_de_vuelo": "IDA_Y_VUELTA",
                "created_at": "2026-04-06T10:59:07.000Z",
                "updated_at": null,
                "closed_at": null,
                "usuario": {
                    "id": 1,
                    "nombre": "Carlos",
                    "username": "carlos"
                },
                "estado_solicitud": {
                    "id": 2,
                    "estado": "EN REVISION",
                    "slug": "en_revision",
                    "editable": true,
                    "created_at": "2026-04-06T10:57:32.000Z"
                },
                "ruta": {
                    "origen": "Bogota",
                    "destino": "Cartagena",
                    "preferencia_aerolinea": "Wingo"
                },
                "fechas": {
                    "ida": "2026-05-02",
                    "vuelta": "2026-05-15"
                },
                "cotizacion": []
            }
        ],
        "paginacion": {
            "total": 5,
            "totalPaginas": 3,
            "paginaActual": 1,
            "limit": 2,
            "orden": "asc",
            "filtros": {
                "estado": null,
                "usuario_id": 1
            }
        }
    }
}
```


## 🔴 3. Admin cierra solicitud

Acceso: 🔒 Protegido | Rol permitido: DEMO, ADMIN, SUPERADMIN

Este endpoint permite "cerrar" una solicitud sin eliminarla físicamente de la base de datos. Al cerrar una solicitud, se marca el campo closed_at con la fecha y hora actual, lo que indica que la solicitud ya no está activa ni visible en los listados normales.

Especificaciones técnicas:
URL: /api/v1/solicitud/:solicitudId/cerrar
Método: POST
Header: Authorization: Bearer <token>

* JSON de solicitud (request)
URL:  POST /api/v1/solicitud/5/cerrar
```json
  {
    "confirmacion": "CERRAR",
    "motivo": "El viaje se realizó con éxito y ya no se necesitan cambios en esta solicitud."
  }
```

* JSON de respuesta (response)
```json

?????????????????


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
```


## 🟣 6. Admin carga cotización

Acceso: 🔒 Protegido | Rol permitido: DEMO, ADMIN, SUPERADMIN

El Administrador carga una nueva cotización para una solicitud que está en revisión o ya con cotizacion cargada. Si se proporciona un cotizacion_anterior_id, la nueva cotización reemplaza a la anterior y esta última queda anulada. La solicitud pasa a estado "COTIZACION CARGADA" y queda pendiente de revisión por parte del empleado.

Verifica que solicitud esté en EN_REVISION
Crea cotización en `COTIZACION_NUEVA`
Cambia solicitud → `COTIZACION_CARGADA`
Registra historial
Devuelve respuesta

Especificaciones técnicas:
URL: /api/v1/solicitud/:solicitudId/cotizacion
Método: POST
Header: Authorization: Bearer <token>

* JSON de solicitud (request)
URL:  POST /api/v1/solicitud/2/cotizacion
nota: Si el admin carga una cotización, hay una acción humana → debe existir endpoint.
```json
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
```
nota: el admin podria cotizar solo IDA primero
→ entonces se necesita 'cobertura' en cotización

* JSON de respuesta (response)
```json
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
            "created_at": "2026-04-06T18:19:25.000Z"
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
```

## 🟠 9. Generar Novedad en cotizacion (requiere comentario obligatorio)

Acceso: 🔒 Protegido | Rol permitido: SOLICITANTE, DEMO, ADMIN, SUPERADMIN

 Empleado (o administrador) genera una novedad en la cotización específica, proporcionando un comentario obligatorio. La cotización pasa a estado "COTIZACION RECHAZADA" y la solicitud vuelve a estado "EN REVISION" para que el admin pueda corregir o cargar una nueva cotización.

Especificaciones técnicas:
URL: /api/v1/cotizacion/:cotizacionId/novedad
Método: POST
Header: Authorization: Bearer <token>
Se genera una `NOVEDAD` tanto en cotizacion como en solicitud

* JSON de solicitud (request)
URL: POST /api/v1/cotizacion/5/novedad
```json
  {
    "comentario": "El vuelo no podra ser ese dia, ubicar el vuelo mas proximo porfavor" 
  }
```
nota:
Por seguridad el 'usuario_id' no debe venir en body
El request lleva un token (ej: JWT):
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
luego:
const usuarioId = req.user.id;
const rol = req.user.rol;


* JSON de respuesta (response)
```json
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
```


## 🔴 8. COTIZACION reemplaza otra (sea por un rechazo o novedad)

Acceso: 🔒 Protegido | Rol permitido: DEMO, ADMIN, SUPERADMIN

Admin reemplaza una cotización existente para una solicitud que ya tiene cotización cargada. 
Para el remplazo el id de la cotización a reemplazar se pasa como parámetro en la URL (:cotizacionId) y los nuevos datos de la cotización se envían en el cuerpo de la solicitud. (ya no se recomienda enviarla en el body la referencia del id de la cotizacion a remplazar). La cotización anterior queda anulada y la nueva cotización toma su lugar. La solicitud permanece en estado "COTIZACION CARGADA" y queda pendiente de revisión por parte del empleado.

Reglas:
Cotizacion anterior → `COTIZACION_ANULADA`
Cotización nueva en: `COTIZACION_NUEVA`
la cotizacion nueva debe referenciar la cotizacion reemplazada
Pero además, la solicitud cambia a: `COTIZACION_CARGADA`

Especificaciones técnicas:
URL: /api/v1/solicitud/:solicitudId/cotizacion/:cotizacionId/reemplazar
Método: POST
Header: Authorization: Bearer <token>

* JSON de solicitud (request)
URL: POST /api/v1/solicitud/2/cotizacion/5/reemplazar

```json
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
```

```json
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
            "created_at": "2026-04-06T18:51:51.000Z"
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
```

## 🔴 7. Solicitante rechaza cotización (requiere comentario obligatorio)

Acceso: 🔒 Protegido | Rol permitido: SOLICITANTE, DEMO, ADMIN, SUPERADMIN

Se verifica que la cotización esté en estado válido (ej: COTIZACION_NUEVA)
Cambia cotización → COTIZACION_RECHAZADA
Cambia solicitud → EN_REVISION
Registra comentario
Devuelve respuesta

Especificaciones técnicas:
URL: /api/v1/cotizacion/:cotizacionId/rechazar
Método: POST
Header: Authorization: Bearer <token>

* JSON de solicitud (request)
URL:  /api/v1/cotizacion/7/rechazar
```json
  {
    "comentario": "El vuelo de regreso es muy tarde, necesito una opción con vuelo de vuelta más temprano." 
  }
```
* JSON de respuesta (response)
```json
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
```

## 🔴 10. COTIZACION fue revizada y se conserva  (((((POR IMPLMETAR)))))

Acceso: 🔒 Protegido | Rol permitido: DEMO, ADMIN, SUPERADMIN

En caso de que el administrador revise la cotización rechazada y decida que no es necesario crear una nueva cotización (por ejemplo, porque el comentario del empleado no requiere corrección o porque la situación reportada ya no es relevante), puede optar por conservar la cotización actual.

El admin revisa, decide NO crear una nueva cotización.
La misma cotización vuelve a estar activa.
Cotización → vuelve a `COTIZACION_NUEVA`
Solicitud → `COTIZACION_CARGADA`
Registra historial
Devuelve respuesta

Especificaciones técnicas:
URL: api/v1/cotizacion/:cotizacionId/conservar
Método: POST
Header: Authorization: Bearer <token>

* JSON de solicitud (request)
URL:  POST api/v1/cotizacion/7/conservar
Nota: No es PATCH, No es PUT, Es acción de negocio.
```json
    {
      "comentario": "No hay vuelos mas tempranos por mal clima, se mantiene vigente el vuelo actual o seleccionar la otra cotización cargada."
    }
```

* JSON de respuesta (response)
```json
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
```



## 🔴 11. Usuario selecciona Cotización (Primaria y opcional Secundaria)

Acceso: 🔒 Protegido | Rol permitido: SOLICITANTE, DEMO, ADMIN, SUPERADMIN

El empleado selecciona en una sola acción la cotización primaria y opcionalmente una secundaria para una solicitud.
Las cotizaciones elegidas cambian a "OPCION PRIMARIA" y "OPCION SECUNDARIA", cualquier otra cotización de esa misma solicitud pasa a "COTIZACION DESCARTADA" y la solicitud vuelve a "EN REVISION".

No son estados “bloqueantes”, solo indican preferencia del usuario.

El usuario debe:
- Seleccionar exactamente **1 OPCION_PRIMARIA**
- Opcionalmente seleccionar **1 OPCION_SECUNDARIA**
- Enviar la selección en una sola acción
- Esto es una sola acción de negocio

Reglas:
- Verificar que ambas cotizaciones pertenezcan a la misma solicitud
- Solo puede existir **una** `OPCION_PRIMARIA`
- Puede existir **cero o una** `OPCION_SECUNDARIA`
- La secundaria no puede ser la misma que la primaria
- Anular cualquier otra que esté en `OPCION_PRIMARIA`
- Anular cualquier otra que esté en `OPCION_SECUNDARIA`
- Las demás quedan en `COTIZACION_DESCARTADA`
- Solicitud pasa a: `EN_REVISION`
- Registrar historial

Especificaciones técnicas:
URL: /api/v1/solicitud/:solicitudId/seleccionar-cotizacion
Método: POST
Header: Authorization: Bearer <token>

* JSON de solicitud (request)

URL:
POST /api/v1/solicitud/2/seleccionar-cotizacion

```json
  {
    "cotizacion_primaria_id": 7,
    "cotizacion_secundaria_id": 6,
    "comentario": "Selecciono esta opción principal y dejo otra como respaldo."
  }
```
* JSON de respuesta (response)
```json
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
```


## 🟣 5. Obtener todas las cotizaciones de una solicitud por parte del administrador.

Acceso: 🔒 Protegido | Rol permitido: DEMO, ADMIN, SUPERADMIN

Listar todas las cotizaciones asociadas a una solicitud específica, incluyendo su estado actual y un resumen de su historial de estados (sin detalles de cada cambio de estado).

Especificaciones técnicas:
URL: /api/v1/solicitud/:solicitudId/cotizacion
Método: GET
Header: Authorization: Bearer <token>

* JSON de solicitud (request)
URL:  GET /api/v1/solicitud/2/cotizacion
(Accion explicita - cuerpo vacio)

```json
 {}
 ```
 * JSON de respuesta (response)
```json
{
    "success": true,
    "message": "Cotizaciones obtenidas correctamente",
    "data": {
        "cotizaciones": [
            {
                "id": 7,
                "solicitud_id": 2,
                "cargada_usuario_id": 4,
                "cotizacion_anterior_id": 5,
                "estado_actual_id": 3,
                "cobertura": "IDA_Y_VUELTA",
                "valor_total": "860000",
                "created_at": "2026-04-06T18:51:51.000Z",
                "updated_at": "2026-04-06T19:03:41.000Z",
                "closed_at": null,
                "estado_cotizacion": {
                    "id": 3,
                    "estado": "OPCION PRIMARIA",
                    "slug": "opcion_primaria",
                    "editable": true,
                    "created_at": "2026-04-06T10:57:32.000Z"
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
                "historial_estado_cotizacion": [
                    {
                        "id": 8,
                        "cotizacion_id": 7,
                        "estado_id": 3,
                        "usuario_id": 4,
                        "observacion": "Seleccionada como OPCION_PRIMARIA por el solicitante. Selecciono esta opción principal y dejo otra como respaldo.",
                        "created_at": "2026-04-06T19:03:41.000Z",
                        "estado_cotizacion": {
                            "id": 3,
                            "estado": "OPCION PRIMARIA",
                            "slug": "opcion_primaria",
                            "editable": true,
                            "created_at": "2026-04-06T10:57:32.000Z"
                        },
                        "usuario": {
                            "id": 4,
                            "nombre": "Sr Usuario",
                            "username": "usuario_demo"
                        }
                    },
                    {/*...*/},
                    {/*...*/},
                    {/*...*/}
                ]
            },
            {
                "id": 6,
                "solicitud_id": 2,
                "cargada_usuario_id": 4,
                "cotizacion_anterior_id": null,
                "estado_actual_id": 4,
                "cobertura": "IDA_Y_VUELTA",
                "valor_total": "850000",
                "created_at": "2026-04-06T18:24:00.000Z",
                "updated_at": "2026-04-06T19:03:41.000Z",
                "closed_at": null,
                "estado_cotizacion": {
                    "id": 4,
                    "estado": "OPCION SECUNDARIA",
                    "slug": "opcion_secundaria",
                    "editable": true,
                    "created_at": "2026-04-06T10:57:32.000Z"
                },
                "historial_estado_cotizacion": [
                    {/*...*/},
                    {/*...*/}
                ],
                "ruta": {
                    "origen": "Bogota",
                    "destino": "Cartagena"
                },
                "detalle": {/*...*/}
            },
            {
                "id": 5,
                "solicitud_id": 2,
                "cargada_usuario_id": 4,
                "cotizacion_anterior_id": null,
                "estado_actual_id": 8,
                "cobertura": "IDA_Y_VUELTA",
                "valor_total": "850000",
                "created_at": "2026-04-06T18:19:25.000Z",
                "updated_at": "2026-04-06T18:51:50.000Z",
                "closed_at": null,
                "estado_cotizacion": {
                    "id": 8,
                    "estado": "COTIZACION ANULADA",
                    "slug": "cotizacion_anulada",
                    "editable": false,
                    "created_at": "2026-04-06T10:57:32.000Z"
                },
                "historial_estado_cotizacion": [/*...*/],
                "ruta": {
                    "origen": "Bogota",
                    "destino": "Cartagena"
                },
                "detalle": {/*...*/}
            }
        ],
        "total": 3
    }
}
```


## 🟣 5. Obtener una cotización en particular por parte del administrador.

Acceso: 🔒 Protegido | Rol permitido: DEMO, ADMIN, SUPERADMIN

Obtener los detalles completos de una cotización específica por su ID, incluyendo información de la ruta, detalle del vuelo, estado actual y cualquier boleto emitido asociado a esa cotización. Esta información permite al empleado revisar a fondo las características de la cotización.
No se incluyen detalles de historial de estados en esta respuesta para no sobrecargar la información.

Especificaciones técnicas:
URL: /api/v1/cotizacion/:cotizaciondId
Método: GET
Header: Authorization: Bearer <token>

* JSON de solicitud (request)
URL:  GET /api/v1/cotizacion/4
(Accion explicita - cuerpo vacio)

```json
 {}
 ```
 * JSON de respuesta (response)
```json
{
    "success": true,
    "message": "Cotización obtenida correctamente",
    "data": {
        "cotizacion": {
            "id": 4,
            "solicitud_id": 6,
            "cotizacion_anterior_id": null,
            "usuario_solicitante": {
                "id": 2,
                "nombre": "Alvaro"
            },
            "usuario_emite_boleto": {
                "id": 3,
                "nombre": "ar"
            },
            "estado_actual_id": 7,
            "cobertura": "IDA_Y_VUELTA",
            "valor_total": "1500.5",
            "created_at": "2026-04-06T10:59:08.000Z",
            "updated_at": null,
            "closed_at": null,
            "estado_cotizacion": {
                "id": 7,
                "estado": "COTIZACION SELECCIONADA",
                "slug": "cotizacion_seleccionada",
                "editable": false,
                "created_at": "2026-04-06T10:57:32.000Z"
            },
            "ruta": {
                "origen": "Bogotá",
                "destino": "Medellín"
            },
            "detalle": {
                "ida": {
                    "aerolinea": "Avianca",
                    "fecha": "2026-03-10",
                    "vuelo": "AV9450",
                    "clase_tarifaria": "Económica",
                    "politica_equipaje": "1 maleta 23kg"
                },
                "vuelta": {
                    "aerolinea": "Avianca",
                    "fecha": "2026-03-20",
                    "vuelo": "AV9451",
                    "clase_tarifaria": "Económica",
                    "politica_equipaje": "1 maleta 23kg"
                }
            },
            "boleto": [
                {
                    "id": 1,
                    "cotizacion_id": 4,
                    "solicitud_id": 6,
                    "reemplaza_boleto_id": null,
                    "usuario_solicitante": {
                        "id": 2,
                        "nombre": "Alvaro"
                    },
                    "usuario_generador_boleto": {
                        "id": 3,
                        "nombre": "ar"
                    },
                    "estado_boleto": {
                        "id": 1,
                        "estado": "BOLETO EMITIDO",
                        "slug": "boleto_emitido",
                        "editable": true,
                        "created_at": "2026-04-06T10:57:32.000Z"
                    },
                    "cobertura": "IDA_Y_VUELTA",
                    "valor_final": "1500.5",
                    "created_at": "2026-04-06T10:59:08.000Z",
                    "ruta": {
                        "origen": "Bogotá",
                        "destino": "Medellín"
                    },
                    "segmentos": [
                        {
                            "tipo_segmento": "IDA",
                            "aerolinea": "Avianca",
                            "codigo_reserva": "ABC123XYZ",
                            "numero_tiquete": "005-123456789",
                            "numero_vuelo": "AV9450",
                            "fecha_vuelo": "2026-03-10",
                            "fecha_compra": null,
                            "clase_tarifaria": "Económica",
                            "politica_equipaje": "1 maleta 23kg",
                            "url_archivo_adjunto": null,
                            "estado": "CONFIRMADO"
                        },
                        {
                            "tipo_segmento": "VUELTA",
                            "aerolinea": "Avianca",
                            "codigo_reserva": "ABC123XYZ",
                            "numero_tiquete": "005-123456789",
                            "numero_vuelo": "AV9451",
                            "fecha_vuelo": "2026-03-20",
                            "fecha_compra": null,
                            "clase_tarifaria": "Económica",
                            "politica_equipaje": "1 maleta 23kg",
                            "url_archivo_adjunto": null,
                            "estado": "CONFIRMADO"
                        }
                    ]
                }
            ]
        }
    }
}

```

## 🟣 6. Obtener el historial de estados de una cotización específica.

Acceso: 🔒 Protegido | Rol permitido: DEMO, ADMIN, SUPERADMIN

Obtener el historial completo de estados por los que ha pasado una cotización específica, incluyendo fechas y comentarios asociados a cada cambio de estado. Esto permite tener un seguimiento detallado de la evolución de la cotización a lo largo del tiempo.

Especificaciones técnicas:
URL: /api/v1/cotizacion/:cotizacionId/historial-estado
Método: GET
Header
Authorization: Bearer <token>

* JSON de solicitud (request)
URL:  GET /api/v1/cotizacion/7/historial-estado
(Accion explicita - cuerpo vacio)

* JSON de respuesta (response)
```json
{
    "success": true,
    "message": "Historial de cotización obtenido correctamente",
    "data": {
        "cotizacion_id": 7,
        "historial_estado_cotizacion": [
            {
                "id": 8,
                "cotizacion_id": 7,
                "estado_id": 3,
                "usuario_id": 4,
                "observacion": "Seleccionada como OPCION_PRIMARIA por el solicitante. Selecciono esta opción principal y dejo otra como respaldo.",
                "created_at": "2026-04-06T19:03:41.000Z",
                "estado_cotizacion": {
                    "id": 3,
                    "estado": "OPCION PRIMARIA",
                    "slug": "opcion_primaria"
                },
                "usuario": {
                    "id": 4,
                    "nombre": "Sr Usuario",
                    "username": "usuario_demo"
                }
            },
            {
                "id": 7,
                "cotizacion_id": 7,
                "estado_id": 1,
                "usuario_id": 4,
                "observacion": "No hay vuelos mas tempranos por mal clima, se mantiene vigente el vuelo actual o seleccionar la otra cotización cargada.",
                "created_at": "2026-04-06T19:00:57.000Z",
                "estado_cotizacion": {
                    "id": 1,
                    "estado": "COTIZACION NUEVA",
                    "slug": "cotizacion_nueva"
                },
                "usuario": {
                    "id": 4,
                    "nombre": "Sr Usuario",
                    "username": "usuario_demo"
                }
            },
            {
                "id": 6,
                "cotizacion_id": 7,
                "estado_id": 2,
                "usuario_id": 4,
                "observacion": "RECHAZADA: El vuelo de regreso es muy tarde, necesito una opción con vuelo de vuelta más temprano.",
                "created_at": "2026-04-06T18:54:55.000Z",
                "estado_cotizacion": {
                    "id": 2,
                    "estado": "COTIZACION RECHAZADA",
                    "slug": "cotizacion_rechazada"
                },
                "usuario": {
                    "id": 4,
                    "nombre": "Sr Usuario",
                    "username": "usuario_demo"
                }
            },
            {
                "id": 5,
                "cotizacion_id": 7,
                "estado_id": 1,
                "usuario_id": 4,
                "observacion": "Cotización cargada - LATAM - IDA_Y_VUELTA - $860000 COP",
                "created_at": "2026-04-06T18:51:51.000Z",
                "estado_cotizacion": {
                    "id": 1,
                    "estado": "COTIZACION NUEVA",
                    "slug": "cotizacion_nueva"
                },
                "usuario": {
                    "id": 4,
                    "nombre": "Sr Usuario",
                    "username": "usuario_demo"
                }
            }
        ],
        "total": 4
    }
}
```

## 🟢 12. Se genera el boleto

Acceso: 🔒 Protegido | Rol permitido: DEMO, ADMIN, SUPERADMIN

Administrador emite un boleto a partir de una cotización aprobada. El boleto queda en estado "EMITIDO".

Reglas:
* Cotización elegida → `SELECCIONADA`
* Cotizaciones no elegidas → `COTIZACION_ANULADA`
* Solicitud → `BOLETO_CARGADO`
* Boleto →  `BOLETO_EMITIDO`
* Registra historial

Especificaciones técnicas:
URL: /api/v1/cotizacion/:cotizacionId/boleto
Método: POST
Header: Authorization: Bearer <token>

* JSON de solicitud (request)
URL:  POST /api/v1/cotizacion/7/boleto
```json
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
```

* JSON de respuesta (response)
```json
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
            "created_at": "2026-04-06T19:59:26.000Z",
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
```
## 🟠 14. Generar Novedad en Boleto (requiere comentario obligatorio)

Acceso: 🔒 Protegido | Rol permitido: SOLICITANTE, DEMO, ADMIN, SUPERADMIN

Se genera una `NOVEDAD` tanto en el boleto como en la solicitud.

### Reglas:
- Verificar que el boleto pertenezca a una solicitud válida
- Boleto pasa a estado: `NOVEDAD`
- Solicitud pasa a estado: `NOVEDAD`
- Se debe registrar comentario obligatorio
- Registrar historial
- No se crea un nuevo boleto en este punto

Especificaciones técnicas:
URL: /api/v1/boleto/:boletoId/novedad
Método: POST
Header: Authorization: Bearer <token>

* JSON de solicitud (request)
URL:
POST /api/v1/boleto/2/novedad
Nota:
El usuario_id que genero la novedad no debe venir del frontend.
Se obtiene del usuario autenticado (token JWT o sesión).


```json
  {
    "tipo_novedad": "CAMBIO DE VUELO",
    "comentario": "El vuelo de regreso ha sido cancelado por la aerolínea y se ha reprogramado para el día siguiente."
  }
```
* JSON de respuesta (response)
```json
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
```



## 🔁 13. Boleto reemplaza otro  (po ejemplo por novedad)

Acceso: 🔒 Protegido | Rol permitido: DEMO, ADMIN, SUPERADMIN

 **Reglas de reemplazo de boletos:**
1. **Reemplazo total**: Admin genera nuevo boleto → anterior se anula. Solicitud asociada mantiene estado "BOLETO EMITIDO".
2. **Condiciones para reemplazar**:
   - Misma cobertura, origen y destino
   - Puede cambiar: valor final, y deatlles como: horarios, aerolíneas, etc.
   - La entidad Boleto en caso de correcciones (parcial o total) generara un nuevo boleto con referencia al boleto que reemplaza y el boleto que se reemplaza quedará anulado.
3. **Casos que NO son reemplazo** (nuevo viaje):
   - Cambia origen o destino de algún segmento
   - El segmento se marca como "CANCELADO" o "NO PRESENTADO"
   - Se genera nuevo boleto no posee referencia al anterior

flujo:
Boleto anterior → `BOLETO_ANULADO`
Boleto nuevo → `BOLETO_EMITIDO`
El boleto nuevo debe referenciar al boleto reemplazado
Solicitud → `BOLETO_CARGADO`
nota: estidad genera creación de recurso con referencia opcional, pero si es un remplazo es obligatorio.

Especificaciones técnicas:
URL: /api/v1/cotizacion/:cotizacionId/boleto
Método: POST
Header: Authorization: Bearer <token>

* JSON de solicitud (request)
URL:  POST /api/v1/boleto/2/reemplazar 
```json
{
  "boleto": {
    "reemplaza_boleto_id": 900,
    "cotizacion_id": 75,
    "estado_actual_id": 1,
    "cobertura": "IDA_Y_VUELTA",
    "valor_final": 840000.00,
    "segmentos": [
      {
        "tipo_segmento": "IDA",
        "estado": "EMITIDO",
        "aerolinea": "Avianca",
        "codigo_reserva": "HJKK12",
        "numero_tiquete": "123456789",
        "numero_vuelo": "AV124",
        "fecha_vuelo": "2026-03-10 09:00:00",
        "fecha_compra": "2026-02-26",
        "clase_tarifaria": "Económica",
        "politica_equipaje": "1 maleta 26kg",
        "url_archivo_adjunto": "https://dominio.com/boleto/4265.pdf"
      },
      {
        "tipo_segmento": "VUELTA",
        "estado": "EMITIDO",
        "aerolinea": "Avianca",
        "codigo_reserva": "HJKK12",
        "numero_tiquete": "123456789",
        "numero_vuelo": "AV457",
        "fecha_vuelo": "2026-03-15 18:00:00",
        "fecha_compra": "2026-02-26",
        "clase_tarifaria": "Económica",
        "politica_equipaje": "1 maleta 26kg",
        "url_archivo_adjunto": "https://dominio.com/boleto/4265.pdf"
      }
    ]
  }
}
```
El Boleto requiere de la data nuevamente porque es documento legal emitido contractual y por tanto no editable. 

* JSON de respuesta (response)
```json
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
```

## 🔁 15. Boleto revisado y se conserva

Acceso: 🔒 Protegido | Rol permitido: DEMO, ADMIN, SUPERADMIN

El Administrador puede conservar un boleto que se encuentra en estado "NOVEDAD" cuando la novedad no afecta la validez del boleto y no requiere emitir un nuevo boleto. El boleto conserva su estado "EMITIDO" y la solicitud asociada permanece en estado "BOLETO EMITIDO".

El boleto sale del estado `NOVEDAD` y vuelve a `BOLETO_EMITIDO`.

Reglas:
- Verificar que el boleto esté en estado `NOVEDAD`
- Boleto pasa a: `BOLETO_EMITIDO`
- Solicitud pasa a: `BOLETO_CARGADO`
- Registrar historial
- No se crea un nuevo boleto
- No se modifica la cotización
- Guardar historial

Especificaciones técnicas:
URL: /api/v1/boleto/:boletoId/conservar
Método: POST
Header: Authorization: Bearer <token>

* JSON de solicitud (request)
URL:
POST /api/v1/boleto/1/conservar
Opcional (comentario del admin):

```json
  {
  "comentario": "La novedad reportada no afecta la validez del boleto, se conserva el boleto emitido."
  }
```
* JSON de respuesta (response)
```json
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
                "id": 6,
                "new_state": "BOLETO CARGADO"
            }
        ]
    }
}
```

## ✅ 16. Solicitante conforme

Acceso: 🔒 Protegido | Rol permitido: SOLICITANTE, DEMO, SUPERADMIN

El solicitante confirma finalmente estar conforme con  el boleto emitido o con la solución propuesta ante una novedad. El boleto pasa a estado "CONFORME POR EL EMPLEADO" y la solicitud asociada a la cotización del boleto pasa a estado "VIAJE PROGRAMADO".

La confirmación es una acción exclusiva del solicitante, ya que representa su aceptación y conformidad final con el boleto emitido o con la solución propuesta ante una novedad. El administrador no puede confirmar un boleto.

### Reglas:

- El boleto debe estar en estado `BOLETO_EMITIDO`
- Boleto pasa a: `CONFORME`
- Solicitud pasa a: `CERRADA`
- Registrar historial
- No se permiten más modificaciones posteriores
- No se pueden generar nuevas novedades
- No se pueden emitir nuevos boletos

Especificaciones técnicas:
URL: /api/v1/boleto/:boletoId/confirmar
Método: POST
Header: Authorization: Bearer <token>

* JSON de solicitud (request)
URL:
POST /api/v1/boleto/3/confirmar
Opcional (comentario del solicitante):
```json
  {
     "comentario": "Confirmo que el boleto es correcto y estoy conforme con la solución propuesta."
  }
```

* JSON de respuesta (response)
```json
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

```


## 🟣 5. Obtener informacion de un boleto en particular por parte del administrador.

Acceso: 🔒 Protegido | Rol permitido: DEMO, ADMIN, SUPERADMIN

Peromite al Administrador obtener los detalles completos de un boleto específica por su ID, incluyendo información de la ruta, detalle del vuelo, estado actual. Esta información permite al empleado revisar a fondo las características de un boleto.
No se incluyen detalles de historial de estados en esta respuesta para no sobrecargar la información.

Especificaciones técnicas:
URL: /api/v1/boleto/:boletoId
Método: GET
Header: Authorization: Bearer <token>

* JSON de solicitud (request)
URL:  GET /api/v1/boleto/3
(Accion explicita - cuerpo vacio)

```json
 {}
```
* JSON de respuesta (response)
```json
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
                "id": 4,
                "nombre": "Sr Usuario"
            },
            "estado_boleto": {
                "id": 2,
                "estado": "CONFORME POR EL EMPLEADO",
                "slug": "conforme_empleado",
                "editable": false,
                "created_at": "2026-04-06T10:57:32.000Z"
            },
            "cobertura": "IDA_Y_VUELTA",
            "valor_final": "840000",
            "created_at": "2026-04-06T20:28:58.000Z",
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
 ```

## 🟣 6. Obtener el historial de estados de un boleto específica.

Acceso: 🔒 Protegido | Rol permitido: DEMO, ADMIN, SUPERADMIN

Obtener el historial completo de estados por los que ha pasado un boleto específica, incluyendo fechas y comentarios asociados a cada cambio de estado. Esto permite tener un seguimiento detallado de la evolución de un boleto a lo largo del tiempo.

Especificaciones técnicas:
URL: /api/v1/boleto/:boletoId/historial-estado
Método: GET
Header
Authorization: Bearer <token>

* JSON de solicitud (request)
URL:  GET api/v1/boleto/3/historial-estado
(Accion explicita - cuerpo vacio)

* JSON de respuesta (response)
```json
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
                "usuario_id": 4,
                "observacion": "Confirmo que el boleto es correcto y estoy conforme con la solución propuesta.",
                "created_at": "2026-04-06T21:00:43.000Z",
                "estado_boleto": {
                    "id": 2,
                    "estado": "CONFORME POR EL EMPLEADO",
                    "slug": "conforme_empleado"
                },
                "usuario": {
                    "id": 4,
                    "nombre": "Sr Usuario",
                    "username": "usuario_demo"
                }
            },
            {
                "id": 4,
                "boleto_id": 3,
                "estado_id": 1,
                "usuario_id": 4,
                "observacion": "Boleto reemplazado",
                "created_at": "2026-04-06T20:28:58.000Z",
                "estado_boleto": {
                    "id": 1,
                    "estado": "BOLETO EMITIDO",
                    "slug": "boleto_emitido"
                },
                "usuario": {
                    "id": 4,
                    "nombre": "Sr Usuario",
                    "username": "usuario_demo"
                }
            }
        ],
        "total": 2
    }
}
```














































