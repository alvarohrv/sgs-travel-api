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
Permite:
✔ Informar resultado
✔ Indicar qué cambió
✔ Indicar qué entidades fueron afectadas
✔ Consistente con arquitectura orientada a eventos
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
# 🧩 2️ Flujo estructurado con JSON

## 🟢 1. Solicitud creada
Estado inicial: `PENDIENTE`

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
Si estaba en `PENDIENTE` → cambia a `EN_REVISION`

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
El Admin revisa una solicitud que estaba en `COTIZACION_RECHAZADA` y decide que se puede revisar de nuevo, entonces la solicitud vuelve a `EN_REVISION` para que el admin pueda cargar una nueva cotización o conservar la existente.
Si estaba en `COTIZACION_RECHAZADA` → cambia a `EN_REVISION`

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
Verifica que solicitud esté en EN_REVISION
Cambia solicitud → `RECHAZADA`
Registra historial
Devuelve respuesta

Estos ocurre cuando el admin revisa la solicitud y decide que no se puede cotizar (ej: falta información crítica, fechas no válidas, duplicados, etc).
Eventualmente la solicitud rechazada pasara a un estado "CERRADA".

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
          "solicitud_id": 44,
          "estado": "RECHAZADA",
          "comentario": "El valor total no coincide con lo acordado, por favor corregir."
      },
      "event": {
          "type": "SOLICITUD_RECHAZADA"
      }
  }
```

## 🟣 5. Obtener todas las solicitudes
No modifica estado, solo devuelve información. Es un GET tradicional.
El endpoint es GET /solicitud retorna una lista de solicitudes
El endpoint soporta query params para filtrar, paginar y ordenar los resultados.


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
Verifica que solicitud esté en EN_REVISION
Crea cotización en `COTIZACION_NUEVA`
Cambia solicitud → `COTIZACION_CARGADA`
Registra historial
Devuelve respuesta

* JSON de solicitud (request)
URL:  POST /solicitud/25/cotizacion
nota: Si el admin carga una cotización, hay una acción humana → debe existir endpoint.
```json
{
  "cotizacion_anterior_id": null,
  "aerolinea": "LATAM",
  "valor_total": 850000,
  "moneda": "COP",
  "cobertura": "IDA_Y_VUELTA",
  "detalle": {
    "ida": {
      "fecha": "2026-03-10",
      "vuelo": "LA123"
    },
    "vuelta": {
      "fecha": "2026-03-15",
      "vuelo": "LA456"
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
      "id": 80,
      "solicitud_id": 25,
      "cotizacion_anterior_id": null,
      "estado": "COTIZACION NUEVA",
      "aerolinea": "LATAM",
      "valor_total": 850000,
      "moneda": "COP",
      "cobertura": "IDA_Y_VUELTA",
      "created_at": "2026-02-26T15:10:00Z"
    }
  },
  "event": {
    "type": "COTIZACION_CREADA",
    "affected_entities": [
      {
        "entity": "solicitud",
        "id": 25,
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
Se verifica que la cotización esté en estado válido (ej: COTIZACION_NUEVA)
Cambia cotización → COTIZACION_RECHAZADA
Cambia solicitud → EN_REVISION
Registra comentario
Devuelve respuesta

* JSON de solicitud (request)
URL:  POST /cotizacion/26/rechazar
{
  "comentario": "La tarifa está muy alta, por favor revisar otra opción."
}


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
Reglas:
Cotizacion anterior → `COTIZACION_ANULADA`
Cotización nueva en: `COTIZACION_NUEVA`
la cotizacion nueva debe referenciar la cotizacion reemplazada
Pero además, la solicitud cambia a: `COTIZACION_CARGADA`
nota: estidad genera creación de recurso con referencia opcional (pero si es un rempazo es obligatorio).

* JSON de solicitud (request)
URL:  POST /solicitud/25/cotizacion  (La diferencia esta en el BODY)
```json
{
  "cotizacion_anterior_id": 80,
  "aerolinea": "LATAM",
  "valor_total": 790000,
  "moneda": "COP",
  "cobertura": "IDA_Y_VUELTA",
  "detalle": {
    "ida": {
      "fecha": "2026-03-10",
      "vuelo": "LA123"
    },
    "vuelta": {
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

```json
{
  "success": true,
  "message": "Cotización reemplazada correctamente",
  "data": {
    "cotizacion": {
      "id": 95,
      "solicitud_id": 25,
      "estado": "COTIZACION NUEVA",
      "reemplaza_cotizacion_id": 80,
      "aerolinea": "LATAM",
      "valor_total": 790000,
      "moneda": "COP",
      "cobertura": "IDA_Y_VUELTA",
      "created_at": "2026-02-26T16:20:00Z"
    }
  },
  "event": {
    "type": "COTIZACION_REEMPLAZADA",
    "affected_entities": [
      {
        "entity": "cotizacion",
        "id": 80,
        "new_state": "COTIZACION ANULADA"
      },
      {
        "entity": "solicitud",
        "id": 25,
        "new_state": "COTIZACION CARGADA"
      }
    ]
  }
}
```

## 🔴 9. COTIZACION fue revizada y se conserva
El admin revisa, decide NO crear una nueva cotización.
La misma cotización vuelve a estar activa.
Cotización → vuelve a `COTIZACION_NUEVA`
Solicitud → `COTIZACION_CARGADA`
Registra historial
Devuelve respuesta

* JSON de solicitud (request)
URL:  POST /cotizacion/26/conservar
Nota: No es PATCH, No es PUT, Es acción de negocio.
```json
{
  "comentario": "Se revisó la tarifa, se mantiene vigente."
}
```

* JSON de respuesta (response)
```json
{
  "success": true,
  "message": "Cotización conservada correctamente",
  "data": {
    "cotizacion": {
      "id": 95,
      "estado": "COTIZACION NUEVA"
    }
  },
  "event": {
    "type": "COTIZACION_CONSERVADA",
    "affected_entities": [
      {
        "entity": "solicitud",
        "id": 25,
        "new_state": "COTIZACION CARGADA"
      }
    ]
  }
}
```
nota: por tanto, no hay cotizacion_anterior_id.

## 🟠 10. Generar Novedad en cotizacion (requiere comentario obligatorio)
Se genera una `NOVEDAD` tanto en cotizacion como en solicitud

* JSON de solicitud (request)
URL: POST /cotizacion/95/novedad
```json
{
  "comentario": "La tarifa cambió, necesito ajuste."
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

## 🔴 11. Usuario selecciona Cotización (Primaria y opcional Secundaria)
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

* JSON de solicitud (request)

URL:
POST /solicitud/25/seleccionar-cotizacion

```json
{
  "cotizacion_primaria_id": 95,
  "cotizacion_secundaria_id": 75,
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
Reglas:
* Cotización elegida → `SELECCIONADA`
* Cotizaciones no elegidas → `COTIZACION_ANULADA`
* Solicitud → `BOLETO_CARGADO`
* Boleto →  `BOLETO_EMITIDO`
* Registra historial

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
Reglas:
Esto ocurre si la NOVEDAD afecta el valor de la entidad 'boleto'
Boleto anterior → `BOLETO_ANULADO`
Boleto nuevo → `BOLETO_EMITIDO`
El boleto nuevo debe referenciar al boleto reemplazado
Solicitud → `BOLETO_CARGADO`
nota: estidad genera creación de recurso con referencia opcional (pero si es un remplazo es obligatorio).

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
Se genera una `NOVEDAD` tanto en el boleto como en la solicitud.

### Reglas:
- Verificar que el boleto pertenezca a una solicitud válida
- Boleto pasa a estado: `NOVEDAD`
- Solicitud pasa a estado: `NOVEDAD`
- Se debe registrar comentario obligatorio
- Registrar historial
- No se crea un nuevo boleto en este punto

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
El boleto sale del estado `NOVEDAD` y vuelve a `BOLETO_EMITIDO`.

Reglas:
- Verificar que el boleto esté en estado `NOVEDAD`
- Boleto pasa a: `BOLETO_EMITIDO`
- Solicitud pasa a: `BOLETO_CARGADO`
- Registrar historial
- No se crea un nuevo boleto
- No se modifica la cotización
- Guardar historial


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
Los estados de los segmentos del vuelo pueden cambiar (ej: por novedad, cambio de aerolínea, cambio de fecha, etc) sin que esto implique necesariamente un cambio de estado del boleto completo. Esto permite reflejar cambios específicos en los detalles del vuelo sin afectar el estado general del boleto.

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

El solicitante confirma que el boleto emitido es correcto y el proceso finaliza.

### Reglas:

- El boleto debe estar en estado `BOLETO_EMITIDO`
- Boleto pasa a: `CONFORME`
- Solicitud pasa a: `CERRADA`
- Registrar historial
- No se permiten más modificaciones posteriores
- No se pueden generar nuevas novedades
- No se pueden emitir nuevos boletos

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

---

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