contratos JSON entre módulos y eventos encadenados, en un sistema orientado a eventos.
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

---
# 🧩 3. Flujo estructurado con JSON

## 🟡 0. Login

Acceso: 🔓 Público | Rol permitido: N/A (registro abierto)

Permite a los usuarios autenticarse y obtener un token JWT para acceder a las rutas protegidas.

Especificaciones técnicas:
URL: /auth/login
Método: POST
Header: Authorization: Bearer <token>

* JSON de solicitud (request)
POST /auth/login
```json
{
  "username": "usuario1",
  "password": "contraseña123"
}
```
* JSON de respuesta (response)
```json
{
  "success": true,
  "message": "Autenticación exitosa",
  "data ?????????????????????????????????????????????????
}
```


## 🟢 1. Solicitud creada

Acceso: 🔒 Protegido | Rol permitido: SOLICITANTE, DEMO, ADMIN, SUPERADMIN

Estado inicial: `PENDIENTE`

Especificaciones técnicas:
URL: /solicitud
Método: POST
Header: Authorization: Bearer <token>

* JSON de solicitud (request)
URL: /solicitud (POST)

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
```

## 🟡 2. Admin abre solicitud

Acceso: 🔒 Protegido | Rol permitido: DEMO, ADMIN, SUPERADMIN

Si estaba en `PENDIENTE` → cambia a `EN_REVISION`

Especificaciones técnicas:
URL: /solicitud/:solicitudId/iniciar-revision
Método: POST
Header: Authorization: Bearer <token>

* JSON de solicitud (request)
URL:  POST /solicitud/25/iniciar-revision (Accion explicita - cuerpo vacio)

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

* JSON de respuesta (response)
```json
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
```
## 🟡 3. Admin revisa una cotizacion rechazada

Acceso: 🔒 Protegido | Rol permitido: DEMO, ADMIN, SUPERADMIN

El Admin revisa una solicitud que estaba en `COTIZACION_RECHAZADA` y decide que se puede revisar de nuevo, entonces la solicitud vuelve a `EN_REVISION` para que el admin pueda cargar una nueva cotización o conservar la existente.
Si estaba en `COTIZACION_RECHAZADA` → cambia a `EN_REVISION`

Especificaciones técnicas:
URL: /solicitud/:solicitudId/iniciar-revision
Método: POST
Header: Authorization: Bearer <token>


* JSON de solicitud (request)
URL:  POST /solicitud/55/iniciar-revision (Accion explicita - cuerpo vacio)
```json
 {
  "observacion": "Revisión iniciada nuevamente por el admin _S05"
 }
 * JSON de respuesta (response)
```json
{
    "success": true,
    "message": "Solicitud en revisión",
    "data": {
        "solicitud_id": 55,
        "estado": "EN REVISION"
    },
    "event": {
        "type": "SOLICITUD_EN_REVISION"
    }
}
```
## 🟣 4. Admin rechaza solicitud

Acceso: 🔒 Protegido | Rol permitido: DEMO, ADMIN, SUPERADMIN

Verifica que solicitud esté en EN_REVISION
Cambia solicitud → `RECHAZADA`
Registra historial
Devuelve respuesta

Estos ocurre cuando el admin revisa la solicitud y decide que no se puede cotizar (ej: falta información crítica, fechas no válidas, duplicados, etc).
Eventualmente la solicitud rechazada pasara a un estado "CERRADA".

Especificaciones técnicas:
URL: /solicitud/:solicitudId/rechazar
Método: POST
Header: Authorization: Bearer <token>

* JSON de solicitud (request)
URL:  POST /solicitud/44/rechazar (Accion explicita - cuerpo vacio)
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

## 🟣 5. Obtener todas las solicitudes

???????????
FALTA IMPLEMETAR QUERY PARAMS PARA FILTRAR POR ESTADO, POR ESTADO Y USUARIOm POR USUARIO (ej: solo admin ve todas, solicitante ve solo las suyas)
Acceso: 🔒 Protegido | Rol permitido: SOLICITANTE, DEMO, ADMIN, SUPERADMIN ??? 
     ## 🟣 6. ??????????????
???????????

Acceso: 🔒 Protegido | Rol permitido: DEMO, ADMIN, SUPERADMIN

No modifica estado, solo devuelve información. Es un GET tradicional.
El endpoint es GET /solicitud retorna una lista de solicitudes
El endpoint soporta query params para filtrar, paginar y ordenar los resultados.

Especificaciones técnicas:
URL: /solicitud
Método: GET
Header: Authorization: Bearer <token>

* JSON de solicitud (request)
URL: GET /solicitud
Soporta query params opcionales:
?id=5           → busca una solicitud específica por ID
?page=2         → página 2 (default: 1)
?limit=5        → 5 resultados por página (default: 10)
?orden=asc      → más antiguas primero (default: 'desc' = más recientes primero)
// Ejemplos:
//   GET /solicitud                      → por defauld, página 1, 10 por página, más recientes primero
//   GET /solicitud?page=2&limit=5       → página 2, 5 por página
//   GET /solicitud?page=1&limit=3&orden=asc → 3 por página, más antiguas primero

nota: también se puede tener un endpoint específico para obtener todas las solicitudes sin filtros, por ejemplo GET /solicitud/todas, que internamente llamaría al mismo método del servicio pero sin pasarle parámetros, lo que haría que use los valores por defecto.
// Ejemplo:
GET /solicitud/todas → devuelve todas las solicitudes sin paginar ni filtrar


## 🟣 6. Admin carga cotización

Acceso: 🔒 Protegido | Rol permitido: DEMO, ADMIN, SUPERADMIN

Verifica que solicitud esté en EN_REVISION
Crea cotización en `COTIZACION_NUEVA`
Cambia solicitud → `COTIZACION_CARGADA`
Registra historial
Devuelve respuesta

Especificaciones técnicas:
URL: /solicitud/:solicitudId/cotizacion
Método: POST
Header: Authorization: Bearer <token>

* JSON de solicitud (request)
URL:  POST /solicitud/25/cotizacion
nota: Si el admin carga una cotización, hay una acción humana → debe existir endpoint.
```json
  {
    "cotizacion_anterior_id": null,
    "valor_total": 850000,
    "moneda": "COP",
    "cobertura": "IDA_Y_VUELTA",
    "detalle": {
      "ida": {
        "aerolinea": "Wingo",
        "fecha": "2026-05-02",
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
            "id": 4,
            "solicitud_id": 2,
            "cotizacion_anterior_id": null,
            "estado": "COTIZACION NUEVA",
            "valor_total": "850000",
            "moneda": "COP",
            "cobertura": "IDA_Y_VUELTA",
            "detalle": {
                "ida": {
                    "aerolinea": "Wingo",
                    "fecha": "2026-05-02",
                    "vuelo": "WA123",
                    "clase_tarifaria": "ECONOMICA"
                },
                "vuelta": {
                    "aerolinea": "Wingo",
                    "fecha": "2026-03-15",
                    "vuelo": "WA456"
                }
            },
            "created_at": "2026-03-11T04:04:51.000Z"
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
-> 
nota:
La solicitud “escuchó” el evento.
En realidad no escucha sola.
El backend lo hace en la misma transacción.

## 🔴 7. Solicitante rechaza cotización (requiere comentario obligatorio)

Acceso: 🔒 Protegido | Rol permitido: SOLICITANTE, DEMO, ADMIN, SUPERADMIN

Se verifica que la cotización esté en estado válido (ej: COTIZACION_NUEVA)
Cambia cotización → COTIZACION_RECHAZADA
Cambia solicitud → EN_REVISION
Registra comentario
Devuelve respuesta

Especificaciones técnicas:
URL: /cotizacion/:cotizacionId/rechazar
Método: POST
Header: Authorization: Bearer <token>

* JSON de solicitud (request)
URL:  POST /cotizacion/26/rechazar
```json
{
  "comentario": "La tarifa está muy alta, por favor revisar otra opción."
}
```
* JSON de respuesta (response)
```json
{
  "success": true,
  "message": "Cotización rechazada correctamente",
  "data": {
    "cotizacion": {
      "id": 80,
      "estado": "COTIZACION RECHAZADA"
    },
    "comentario": {
      "id": 310,
      "entidad_tipo": "cotizacion",
      "entidad_id": 26,
      "contenido": "La tarifa está muy alta, por favor revisar otra opción."
    }
  },
  "event": {
    "type": "COTIZACION_RECHAZADA",
    "affected_entities": [
      {
        "entity": "solicitud",
        "id": 25,
        "new_state": "EN REVISION"
      }
    ]
  }
}
```

## 🔴 8. COTIZACION reemplaza otra (sea por un rechazo o novedad)

Acceso: 🔒 Protegido | Rol permitido: DEMO, ADMIN, SUPERADMIN

Reglas:
Cotizacion anterior → `COTIZACION_ANULADA`
Cotización nueva en: `COTIZACION_NUEVA`
la cotizacion nueva debe referenciar la cotizacion reemplazada
Pero además, la solicitud cambia a: `COTIZACION_CARGADA`

Especificaciones técnicas:
URL: /solicitud/:solicitudId/cotizacion/:cotizacionId/reemplazar
Método: POST
Header: Authorization: Bearer <token>

* JSON de solicitud (request)
URL: POST /solicitud/:solicitudId/cotizacion/:cotizacionId/reemplazar

```json
  {
    "valor_total": 840000,
    "moneda": "COP",
    "cobertura": "IDA_Y_VUELTA",
    "detalle": {
      "ida": {
        "aerolinea": "Wingo",
        "fecha": "2026-05-02",
        "vuelo": "WA123",
        "clase_tarifaria": "ECONOMICA"
      },
      "vuelta": {
        "aerolinea": "Wingo",
        "fecha": "2026-03-20",
        "vuelo": "WA788",
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
              "id": 5,
              "solicitud_id": 2,
              "cotizacion_anterior_id": 4,
              "estado": "COTIZACION NUEVA",
              "valor_total": "840000",
              "moneda": "COP",
              "cobertura": "IDA_Y_VUELTA",
              "detalle": {
                  "ida": {
                      "aerolinea": "Wingo",
                      "fecha": "2026-05-02",
                      "vuelo": "WA123",
                      "clase_tarifaria": "ECONOMICA"
                  },
                  "vuelta": {
                      "aerolinea": "Wingo",
                      "fecha": "2026-03-20",
                      "vuelo": "WA788",
                      "clase_tarifaria": "ECONOMICA"
                  }
              },
              "created_at": "2026-03-11T04:32:47.000Z"
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
```

/////////// Nota otra forma (no recomendada)

Es posible usar el endpoint de creacion enviando el atributo:
"cotizacion_anterior_id"
nota: donde, si es un remplazo la referencia ya no es opcional

* JSON de solicitud (request)
URL:  POST /solicitud/25/cotizacion  (La diferencia esta en el BODY)
```json
{
  "cotizacion_anterior_id": 80,
  "valor_total": 790000,
  "moneda": "COP",
  "cobertura": "IDA_Y_VUELTA",
  "detalle": {
    "ida": {
      "aerolinea": "LATAM",
      "fecha": "2026-03-10",
      "vuelo": "LA123"
    },
    "vuelta": {
      "aerolinea": "LATAM",
      "fecha": "2026-03-15",
      "vuelo": "LA456"
    }
  }
}
```
si cotizacion_anterior_id ≠ null:
Verifica que la cotización anterior pertenezca a la misma solicitud
Cambia anterior → COTIZACION_ANULADA
Crea nueva → COTIZACION_NUEVA
Guarda referencia
Cambia solicitud → COTIZACION_CARGADA
Registra historial

## 🟠 9. Generar Novedad en cotizacion (requiere comentario obligatorio)

Acceso: 🔒 Protegido | Rol permitido: SOLICITANTE, DEMO, ADMIN, SUPERADMIN

Se genera una `NOVEDAD` tanto en cotizacion como en solicitud

Especificaciones técnicas:
URL: /cotizacion/:cotizacionId/novedad
Método: POST
Header: Authorization: Bearer <token>

* JSON de solicitud (request)
URL: POST /cotizacion/95/novedad
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
              "id": 3,
              "estado": "NOVEDAD"
          },
          "comentario": "El vuelo no podra ser ese dia, ubicar el vuelo mas proximo porfavor"
      },
      "event": {
          "type": "COTIZACION_NOVEDAD",
          "affected_entities": [
              {
                  "entity": "solicitud",
                  "id": 5,
                  "new_state": "NOVEDAD"
              }
          ]
      }
  }

  ////// LLEVAR A ALGO SIMILAR A ESTO::::  CUANDO SE LLEGE A LA PARTE DE COMENTARIOS : 
{
  "success": true,
  "message": "Novedad registrada correctamente",
  "data": {
    "cotizacion": {
      "id": 95,
      "estado": "NOVEDAD"
    },
    "comentario": {
      "id": 300,
      "usuario": {
        "id": 12,
        "nombre": "Carlos Pérez",
        "rol": "SOLICITANTE"
      },
      "entidad_tipo": "cotizacion",
      "entidad_id": 95,
      "contenido": "La tarifa cambió, necesito ajuste.",
      "created_at": "2026-02-26T17:10:00Z"
    }
  },
  "event": {
    "type": "NOVEDAD_GENERADA",
    "affected_entities": [
      {
        "entity": "solicitud",
        "id": 25,
        "new_state": "NOVEDAD"
      }
    ]
  }
}

```


## 🔴 10. COTIZACION fue revizada y se conserva  (((((POR IMPLMETAR)))))

Acceso: 🔒 Protegido | Rol permitido: DEMO, ADMIN, SUPERADMIN

El admin revisa, decide NO crear una nueva cotización.
La misma cotización vuelve a estar activa.
Cotización → vuelve a `COTIZACION_NUEVA`
Solicitud → `COTIZACION_CARGADA`
Registra historial
Devuelve respuesta

Especificaciones técnicas:
URL: /cotizacion/:cotizacionId/conservar
Método: POST
Header: Authorization: Bearer <token>

* JSON de solicitud (request)
URL:  POST /cotizacion/26/conservar
Nota: No es PATCH, No es PUT, Es acción de negocio.
```json
  {
    "comentario": "No hay vuelos proximos por mal clima, se mantiene vigente el vuelo actual."
  }
```

* JSON de respuesta (response)
```json
  {
      "success": true,
      "message": "Cotización conservada correctamente",
      "data": {
          "cotizacion": {
              "id": 3,
              "estado": "COTIZACION NUEVA"
          },
          "comentario": "No hay vuelos proximos por mal clima, se mantiene vigente el vuelo actual."
      },
      "event": {
          "type": "COTIZACION_CONSERVADA",
          "affected_entities": [
              {
                  "entity": "solicitud",
                  "id": 5,
                  "new_state": "COTIZACION CARGADA"
              }
          ]
      }
  }
```
nota: por tanto, no hay cotizacion_anterior_id.


## 🔴 11. Usuario selecciona Cotización (Primaria y opcional Secundaria)

Acceso: 🔒 Protegido | Rol permitido: SOLICITANTE, DEMO, ADMIN, SUPERADMIN

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
URL: /solicitud/:solicitudId/seleccionar-cotizacion
Método: POST
Header: Authorization: Bearer <token>

* JSON de solicitud (request)

URL:
POST /solicitud/25/seleccionar-cotizacion

```json
  {
    "cotizacion_primaria_id": 5,
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
    "cotizacion":{
      "seleccion": {
        "primaria": {
          "id": 95,
          "estado": "OPCION PRIMARIA",
          "sub_estado": "PENDIENTE"
        },
        "secundaria": {
          "id": 75,
          "estado": "OPCION SECUNDARIA",
          "sub_estado": "PENDIENTE"
        }
      }
    }
  },
  "event": {
    "type": "COTIZACIONES_SELECCIONADAS",
    "affected_entities": [
    {
      "entity": "solicitud",
      "id": 25,
      "new_state": "EN REVISION"
    },
    {
      "entity": "cotizacion",
      "id": 65,
      "new_state": "COTIZACION DESCARTADA"
    }

    ]
  }
}
```

## 🟢 12. Se genera el boleto

Acceso: 🔒 Protegido | Rol permitido: DEMO, ADMIN, SUPERADMIN

Reglas:
* Cotización elegida → `SELECCIONADA`
* Cotizaciones no elegidas → `COTIZACION_ANULADA`
* Solicitud → `BOLETO_CARGADO`
* Boleto →  `BOLETO_EMITIDO`
* Registra historial

Especificaciones técnicas:
URL: /cotizacion/:cotizacionId/boleto
Método: POST
Header: Authorization: Bearer <token>

* JSON de solicitud (request)
URL:  POST /cotizacion/75/boleto
```json
{
  "boleto": {
    "reemplaza_boleto_id": null,
    "cotizacion_id": 75,
    "estado_actual_id": 1,
    "cobertura": "IDA_Y_VUELTA",
    "valor_final": 850000.00,
    "segmentos": [
      {
        "tipo_segmento": "IDA",
        "estado": "EMITIDO",
        "aerolinea": "Latam",
        "codigo_reserva": "ZXCV12",
        "numero_tiquete": "987654321",
        "numero_vuelo": "LA123",
        "fecha_vuelo": "2026-03-10 08:00:00",
        "fecha_compra": "2026-02-26",
        "clase_tarifaria": "Económica",
        "politica_equipaje": "1 maleta 23kg",
        "url_archivo_adjunto": "https://dominio.com/boleto/900.pdf"
      },
      {
        "tipo_segmento": "VUELTA",
        "estado": "EMITIDO",
        "aerolinea": "Latam",
        "codigo_reserva": "ZXCV12",
        "numero_tiquete": "987654321",
        "numero_vuelo": "LA456",
        "fecha_vuelo": "2026-03-15 18:00:00",
        "fecha_compra": "2026-02-26",
        "clase_tarifaria": "Económica",
        "politica_equipaje": "1 maleta 23kg",
        "url_archivo_adjunto": "https://dominio.com/boleto/900.pdf"
      }
    ]
  }
}
```

* JSON de respuesta (response)
```json
 {
  "success": true,
  "message": "Boleto emitido correctamente",
  "data": {
    "boleto": {
      "id": 900,
      "cotizacion_id": 75,    
      "estado": "BOLETO EMITIDO",
      "reemplaza_boleto_id": null,
      "cobertura": "IDA_Y_VUELTA",
      "valor_final": 850000,
      "created_at": "2026-02-26T18:00:00Z",
      "segmentos": [
        {
          "id": 1001,
          "tipo_segmento": "IDA",
          "estado": "EMITIDO",
          "aerolinea": "Latam",
          "codigo_reserva": "ZXCV12",
          "numero_tiquete": "987654321",
          "numero_vuelo": "LA123",
          "fecha_vuelo": "2026-03-10T08:00:00Z",
          "fecha_compra": "2026-02-26",
          "clase_tarifaria": "Económica",
          "politica_equipaje": "1 maleta 23kg",
          "url_archivo_adjunto": "https://dominio.com/boleto/900.pdf"
        },
        {
          "id": 1002,
          "tipo_segmento": "VUELTA",
          "estado": "EMITIDO",
          "aerolinea": "Latam",
          "codigo_reserva": "ZXCV12",
          "numero_tiquete": "987654321",
          "numero_vuelo": "LA456",
          "fecha_vuelo": "2026-03-15T18:00:00Z",
          "fecha_compra": "2026-02-26",
          "clase_tarifaria": "Económica",
          "politica_equipaje": "1 maleta 23kg",
          "url_archivo_adjunto": "https://dominio.com/boleto/900.pdf"
        }
      ]
    }
  },
  "event": {
    "type": "BOLETO_EMITIDO",
    "affected_entities": [
      {
        "entity": "cotizacion",
        "id": 75,
        "new_state": "COTIZACION SELECCIONADA"
      },
      {
        "entity": "solicitud",
        "id": 25,
        "new_state": "BOLETO CARGADO"
      },
      {
        "entity": "cotizacion",
        "id": 95,
        "new_state": "COTIZACION ANULADA"
      },
      {
        "entity": "cotizacion",
        "id": 63,
        "new_state": "COTIZACION ANULADA"
      },
    ]
  }
}
```


## 🔁 13. Boleto reemplaza otro  (po ejemplo por novedad)

Acceso: 🔒 Protegido | Rol permitido: DEMO, ADMIN, SUPERADMIN

Reglas:
Esto ocurre si la NOVEDAD afecta el valor de la entidad 'boleto'
Boleto anterior → `BOLETO_ANULADO`
Boleto nuevo → `BOLETO_EMITIDO`
El boleto nuevo debe referenciar al boleto reemplazado
Solicitud → `BOLETO_CARGADO`
nota: estidad genera creación de recurso con referencia opcional (pero si es un remplazo es obligatorio).

Especificaciones técnicas:
URL: /cotizacion/:cotizacionId/boleto
Método: POST
Header: Authorization: Bearer <token>

* JSON de solicitud (request)
URL:  POST /cotizacion/75/boleto   (La diferencia esta en el BODY)
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
El Boleto requiere de la data nuevamente porque es documento legal emitido contractual y por tanto no editable. Aunque de momento permite solo adjuntar el PDF.

* JSON de respuesta (response)
```json
 {
  "success": true,
  "message": "Boleto remplazado correctamente",
  "data": {
    "boleto": {
      "id": 900,
      "cotizacion_id": 75,    
      "estado": "BOLETO EMITIDO",
      "reemplaza_boleto_id": null,
      "cobertura": "IDA_Y_VUELTA",
      "valor_final": 850000,
      "created_at": "2026-02-26T18:00:00Z",
      "segmentos": [
        {
          "id": 1001,
          "tipo_segmento": "IDA",
          "estado": "EMITIDO",
          "aerolinea": "Avianca",
          "codigo_reserva": "HJKK12",
          "numero_tiquete": "123456789",
          "numero_vuelo": "AV124",
          "fecha_vuelo": "2026-03-10T09:00:00Z",
          "fecha_compra": "2026-02-26",
          "clase_tarifaria": "Económica",
          "politica_equipaje": "1 maleta 26kg",
          "url_archivo_adjunto": "https://dominio.com/boleto/4265.pdf"
        },
        {
          "id": 1002,
          "tipo_segmento": "VUELTA",
          "estado": "EMITIDO",
          "aerolinea": "Avianca",
          "codigo_reserva": "HJKK12",
          "numero_tiquete": "123456789",
          "numero_vuelo": "AV457",
          "fecha_vuelo": "2026-03-15T18:00:00Z",
          "fecha_compra": "2026-02-26",
          "clase_tarifaria": "Económica",
          "politica_equipaje": "1 maleta 26kg",
          "url_archivo_adjunto": "https://dominio.com/boleto/4265.pdf"
        }
      ]
    }
  },
  "event": {
    "type": "BOLETO_REEMPLAZADO",
    "affected_entities": [
      {
        "entity": "solicitud",
        "id": 25,
        "new_state": "BOLETO CARGADO"
      },
      {
        "entity": "boleto",
        "id": 900,
        "new_state": "BOLETO_ANULADO"
      },
      {
        "entity": "boleto",
        "id": 950,
        "new_state": "BOLETO_EMITIDO"
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
URL: /boleto/:boletoId/novedad
Método: POST
Header: Authorization: Bearer <token>

* JSON de solicitud (request)
URL:
POST /boleto/950/novedad

Nota:
El usuario_id que genero la novedad no debe venir del frontend.
Se obtiene del usuario autenticado (token JWT o sesión).
// const usuarioId = req.user.id;

```json
{
  "comentario": "El pasajero solicita cambio de fecha."
}
```
* JSON de respuesta (response)
```json
{
  "success": true,
  "message": "Novedad registrada correctamente",
  "data": {
    "boleto": {
      "id": 950,
      "estado": "NOVEDAD"
    },
    "comentario": {
      "id": 400,
      "usuario": {
        "id": 12,
        "nombre": "Carlos Pérez",
        "rol": "SOLICITANTE"
      },
      "entidad_tipo": "boleto",
      "entidad_id": 950,
      "contenido": "El pasajero solicita cambio de fecha, es posible se modifique los costos.",
      "created_at": "2026-02-26T19:10:00Z"
    }
  },
  "event": {
    "type": "BOLETO_NOVEDAD_GENERADA",
    "affected_entities": [
      {
        "entity": "solicitud",
        "id": 25,
        "new_state": "NOVEDAD"
      }
    ]
  }
}
```

## 🔁 15. Boleto revisado y se conserva

Acceso: 🔒 Protegido | Rol permitido: DEMO, ADMIN, SUPERADMIN

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
URL: /boleto/:boletoId/conservar
Método: POST
Header: Authorization: Bearer <token>

* JSON de solicitud (request)
URL:
POST /boleto/950/conservar
Opcional (comentario del admin):

```json
{
  "comentario": "No requiere reemisión por ausencia de cargos adicionales. Novedad gestionada mediante actualización de itinerario."
}
```
* JSON de respuesta (response)
```json
{
  "success": true,
  "message": "Boleto revisado y conservado correctamente",
  "data": {
    "boleto": {
      "id": 950,
      "estado": "BOLETO EMITIDO"
    }
  },
  "event": {
    "type": "BOLETO_CONSERVADO",
    "affected_entities": [
      {
        "entity": "solicitud",
        "id": 25,
        "new_state": "BOLETO_CARGADO"
      }
    ]
  }
}
```

## 🔁 15. CAMBIO DE ESTADO DE DETALLES DEL VUELO

Acceso: 🔒 Protegido | Rol permitido: SOLICITANTE, DEMO, ADMIN, SUPERADMIN

Los estados de los segmentos del vuelo pueden cambiar (ej: por novedad, cambio de aerolínea, cambio de fecha, etc) sin que esto implique necesariamente un cambio de estado del boleto completo. Esto permite reflejar cambios específicos en los detalles del vuelo sin afectar el estado general del boleto.

Especificaciones técnicas:
URL: /boleto/segmento/:segmentoId/estado
Método: POST
Header: Authorization: Bearer <token>

* JSON de solicitud (request)
URL: PATCH /boleto/segmento/:segmentoId/estado
POST 
```json
 {
    "nuevo_estado": "REPROGRAMADO",
    "motivo": "informo cambio de fecha en el regreso por motivos de clima.",
    "usuario_id": 1
  }
```
* JSON de respuesta (response)
```json
{
    "success": true,
    "message": "Estado del segmento actualizado correctamente",
    "data": {
      "segmento_actualizado": {
        "id": 1002,
        "boleto_id": 900,
        "tipo_segmento": "VUELTA",
        "estado": "REPROGRAMADO",
        "aerolinea": "Avianca",
        "numero_vuelo": "AV457",
        "fecha_vuelo": "2026-03-16T18:00:00Z", 
        "descripcion": "informo cambio de fecha en el regreso por motivos de clima.",
        "actualizado_por": 1
      }
    },
    "event": {
      "type": "SEGMENTO_ESTADO_ACTUALIZADO",
      "affected_entities": [
        {
          "entity": "segmento_boleto",
          "id": 1002,
          "new_state": "REPROGRAMADO",
          "details": "Cambio operativo por condiciones climáticas"
        }
      ]
    }
  }
```

## ✅ 16. Solicitante conforme

Acceso: 🔒 Protegido | Rol permitido: SOLICITANTE, DEMO, SUPERADMIN

El solicitante confirma que el boleto emitido es correcto y el proceso finaliza.

### Reglas:

- El boleto debe estar en estado `BOLETO_EMITIDO`
- Boleto pasa a: `CONFORME`
- Solicitud pasa a: `CERRADA`
- Registrar historial
- No se permiten más modificaciones posteriores
- No se pueden generar nuevas novedades
- No se pueden emitir nuevos boletos

Especificaciones técnicas:
URL: /boleto/:boletoId/confirmar
Método: POST
Header: Authorization: Bearer <token>

* JSON de solicitud (request)
URL:
POST /boleto/75/confirmar
Opcional (comentario del solicitante):
```json
{
  "comentario": "Todo correcto, gracias."
}
```

* JSON de respuesta (response)
```json
{
  "success": true,
  "message": "Boleto confirmado correctamente",
  "data": {
    "boleto": {
      "id": 75,
      "estado": "CONFORME POR EL EMPLEADO"
    }
  },
  "event": {

    "type": "BOLETO_CONFIRMADO",
    "affected_entities": [
      {
        "entity": "solicitud",
        "id": 25,
        "new_state": "VIAJE PROGRAMADO"
      }
    ]
  }
}

```


## 🟡 ??. Creacion de Usuario

Acceso: 🔒 Protegido | Rol permitido: SUPERADMIN

El registro es un proceso administrativo que vive en el módulo de Usuarios, donde la contraseña se transforma en un hash antes de tocar la base de datos.

Recibir datos: Obtener el objeto con el username y el password.
Generar Salt y Hash: Usar bcrypt.hash(password, 5).
Guardar en Prisma: Crear el registro reemplazando el password original por el hash.
Limpiar respuesta: Retornar el usuario creado sin el campo password por seguridad.

Especificaciones técnicas:
URL: /usuario
Método: POST
Header: Authorization: Bearer <token>

URL:
POST /usuario
Opcional (comentario del solicitante):
* JSON de solicitud (request)
```json
{
  "numero_documento": "123456789",
  "cod_empleado": "AR-2026-0001",
  "nombre": "Alvarex",
  "correo": "alv-demo@gmail.com",
  "username": "ar",
  "password": "ar"
}

```
FLUJO:
Recibir datos
↓
bcrypt.hash
↓
Guardar en base de datos
↓
Responder sin password



* JSON de respuesta (response)
```json
{
  "success": true,
  "message": "Usuario registrado correctamente",
  "data": {
    "usuario": {
      "id": 1,
      "numero_documento": "123456789",
      "cod_empleado": "AR-2026-0001",
      "nombre": "Alvaro",
      "correo": "alv-demo@gmail.com",
      "username": "ar",
      "rol": "SOLICITANTE",
      "created_at": "2026-02-26T20:00:00Z"
    }
  }
}
```

---

Otras rutas relacionadas con usuarios (CRUD básico, sin olvidar la seguridad en la actualización de contraseñas):
GET    /users / con paginación y filtros igual que solicitud
GET    /users/:id

## 🟡 ??. Actualización de Usuario

Acceso: 🔒 Protegido | Rol permitido: SUPERADMIN

PATCH  /users/:id
Para actualizar datos del usuario, excepto contraseña y rol (que podrían tener endpoints específicos por seguridad)
* JSON de solicitud (request)
```json

{
  "nombre": "Alvaro Ruiz",
}
```
* JSON de respuesta (response)
```json

{
  "success": true,
  "message": "Usuario actualizado correctamente",
  "data": {
    "usuario": {
      "id": 1,
      "numero_documento": "123456789",
      "cod_empleado": "AR-2026-0001",
      "nombre": "Alvaro Ruiz",
      "correo": "alv-demo@gmail.com"
    }
  }
}
```

Es importante proteger esta ruta para que solo el propio usuario o un admin puedan actualizar los datos. Para esto se usara decoradores y guards en NestJS:
@Roles('ADMIN') // Decorador personalizado para definir el permiso 
@UseGuards(JwtAuthGuard, RolesGuard) // Protege la ruta
..

## 🟡 ??. Actualización de Rol de Usuario

Acceso: 🔒 Protegido | Rol permitido: SUPERADMIN

Para actualizar solo el rol del usuario

Especificaciones técnicas:
URL: /users/:id/rol
Método: PATCH
Header: Authorization: Bearer <token>


* JSON de solicitud (request)
PATCH /users/:id/rol 
```json

{
  "rol": "SOLICITANTE" 
}
```

nota: Solo un admin puede cambiar roles, y no puede cambiar su propio rol para evitar bloqueos accidentales.
* JSON de respuesta (response)
```json
{
  "success": true,
  "message": "Rol del usuario actualizado correctamente",
  "data": {
    "usuario": {
      "id": 1,
      "rol": "SOLICITANTE"
    }
  }
}
```

## 🟡 ??. Eliminación de Usuario

Acceso: 🔒 Protegido | Rol permitido: SUPERADMIN

Para eliminar un usuario, o mejor dicho, para desactivarlo sin borrar su registro como tal, se puede usar disabled_at

Especificaciones técnicas:
URL: /users/:id
Método: DELETE
Header: Authorization: Bearer <token>


* JSON de solicitud (request)
DELETE /users/:id

```json
{
  "reason": "El usuario ya no forma parte de la organización."
}
```
* JSON de respuesta (response)
```json
{
  "success": true,
  "message": "Usuario desactivado correctamente",
  "data": {
    "usuario": {
      "id": 1,
      "disabled_at": "2026-02-26T21:00:00Z"
    }
  }
}
```
## 🟡 ??. Actualización de Contraseña

Acceso: 🔒 Protegido | Rol permitido: SUPERADMIN

PATCH /usuario/:id/password
Para actualizar la contraseña, se requiere la contraseña actual para validar que el usuario es quien dice ser, y luego se aplica el mismo proceso de hash que en el registro.
Uso de bcrypt.hash para nueva contraseña.

* JSON de solicitud (request)
```json
{
  "oldPassword": "clave_actual_123",
  "newPassword": "nueva_clave_456",
  "confirmPassword": "nueva_clave_456"
}
```
* JSON de respuesta (response)
```json
{
  "success": true,
  "message": "Contraseña actualizada correctamente"
}
```
Un endpoint muy útil que no mencionó:

PATCH /usuarios/:id/password

para cambiar contraseña.

Request:

{
  "password_actual": "1234",
  "password_nueva": "abcd"

## 🟡 ??. Login


URL:
POST /auth/login

* JSON de solicitud (request)
```json
{
  "username": "ar",
  "password": "ar"
}
```

~~~
cliente envía username + password
↓
Passport Local Strategy valida credenciales
↓
AuthService genera JWT
↓
cliente recibe token para autenticación en futuras solicitudes
~~~

* JSON de respuesta (response)
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6.IkpXV...",
    "user": { "id": 5, "username": "alvaro", "role": "ADMIN" }
  }
}
```



## 🟡 ??. Refresco de Token
URL:
POST /auth/refresh-token


Otras rutas relacionadas con autenticación:
POST /auth/login
POST /auth/refresh-token
POST /auth/logout (opcional)



# 🧠 Lo importante arquitectónicamente

Las entidades no “escuchen”.
El flujo:
- Acción
→ Backend ejecuta lógica
→ Actualiza múltiples entidades
→ Devuelve evento estructurado

* Sistema orientado a acciones
* Eventos estructurados en JSON
* Backend actualiza entidades relacionadas
* Respuestas consistentes
* Todo dentro de una misma transacción. transaction()
---



# 🏗 Cómo se ve internamente en Node (IDEAS)

```javascript
await db.transaction(async (trx) => {

   await crearBoleto(trx);
   await actualizarCotizacion(trx);
   await actualizarSolicitud(trx);
   await registrarHistorial(trx);

});
```
```javascript
await db.transaction(async (trx) => {

   const boletoNuevo = await crearBoleto(trx);

   if (boletoReemplazadoId) {
      await anularBoletoAnterior(trx);
   }

   await actualizarSolicitud(trx, ESTADO_BOLETO_CARGADO);
   await registrarHistorial(...);

});
```
```javascript
await db.transaction(async (trx) => {

   await actualizarEstadoBoleto(950, ESTADO_CONFORME);

   await actualizarEstadoSolicitud(25, ESTADO_CERRADA);

   await registrarHistorialBoleto(...);
   await registrarHistorialSolicitud(...);

});
```
```javascript
app.post("/solicitud/:id/iniciar-revision", async (req, res) => {

   const solicitud = await obtenerSolicitud(req.params.id);

   if (solicitud.estado !== "PENDIENTE") {
      return res.status(400).json({ error: "No se puede iniciar revisión" });
   }

   await actualizarEstadoSolicitud(solicitud.id, "EN_REVISION");

   res.json({...});
});
```