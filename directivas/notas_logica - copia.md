📌 Backend
NestJS + PostgreSQL + Prisma
→ Desplegado en Azure App Service

📌 Frontend
Astro + Tailwind CSS (opcional)
→ Desplegado en Azure Static Web Apps

Caracteristicas:
✔ Arquitectura modular
✔ Servicio de historial centralizado
✔ Estados en tablas separadas

//////////////////////////////////////////

FLUJO:
1️. Solicitud creada **Responsable:** Solicitante (Empleado)
2️. Revisión administrativa **Responsable:** Administrador
3️. Cotización registrada **Responsable:** Administrador
4. Aprobación de cotización **Responsable:** Solicitante (Empleado)
5. Emisión del boleto **Responsable:** Administrador
6. Revisión del boleto **Responsable:** Solicitante (Empleado)
7. Cierre del proceso

>>>> PENDIENTE DIAGRAMA DEL FLUJO <<<<<
>>>> PENDIENTE DIAGRAMA DE CLASES <<<<<
>>>> PENDIENTE DIAGRAMA DE ESTADOS <<<<<


Backend       → NestJS     -> Azure App Service
Base de datos → PostgreSQL -> Azure Database for PostgreSQL
ORM           → Prisma o TypeORM
Frontend      → React (Vite) -> Azure Static Web Apps || Azure App Service

STACK
NestJS
PostgreSQL
Prisma ORM
Azure App Service
Azure Database
Arquitectura REST
Modelado de estados
Deploy cloud


Fase 1 – Local
Crear proyecto NestJS
Integrar Prisma
Conectar PostgreSQL local
Implementar entidades
Probar endpoints

Fase 2 – Cloud
Crear PostgreSQL en Azure
Crear App Service
Configurar variables de entorno
Deploy desde GitHub

Fase 3 – Frontend
React (Vite)
Consumo de API
Deploy en Azure Static Web Apps


///////////////////////////////////////////////////////////////////////


# 🔄 Flujo del Proceso

## 1. Modulo Núcleo del negocio

### 1️ Solicitud creada
**Responsable:** Solicitante (Empleado)
El empleado registra la solicitud indicando:
* Ruta del viaje
* Fechas
* Tipo de trayecto
**Estado inicial:** PENDIENTE (una vez se confirme su creacion)  ok

---
### 2️ Revisión administrativa --Solicitud--
**Responsable:** Administrador
**2.1 Validación**
Se verifica que la información ingresada sea correcta y completa.
**2.2 Gestión de cotizaciones**
El administrador busca opciones de vuelo y carga las cotizaciones en el sistema.
**Estado inicial:** Pendiente
**Estado una vez abierta a solicitud:** EN REVISION  ok
**Estado una vez cotizada:** COTIZACION CARGADA  ok
**Estado una vez genera boleto:** BOLETO CARGADO  ok
**Estado si hay novedades:** NOVEDAD  00   ok01  02
**Estado si se rechaza:** RECHAZADA
**Estado una vez cerrado:** CERRADA

---

### 3️ Cotización registrada

**Responsable:** Administrador
* Se cargan una o varias cotizaciones.
* El administrador puede registrar:
  * ⚠️ Novedades
  * ❌ Rechazo (si no es viable continuar)

**Estado una vez cotizada:** COTIZACION NUEVA (La solicitud pasa al estado 'Cotizacion cargada' y se notifica al solicitante que debe revisar las opciones)    ok

---

### 4 Aprobación de cotización
**Responsable:** Solicitante (Empleado)
El solicitante revisa las opciones disponibles y **selecciona/aprueba** la cotización deseada.
**Estado si EMPLEADO no aprueba:** COTIZACION RECHAZADA (La solicitud pasa al estado'En revisión')          ok
**Estado si EMPLEADO aprueba:** 'OPCION PRIMARIA' o 'OPCION SECUNDARIA' (según la elección del solicitante)  (La solicitud pasa al estado 'Pendiente' y se genera un tag-sufijo "Pendiente" en los estados de las cotizaciones, se bloquea la sección de cotizaciones para el solicitante y se notifica al administrador que debe proceder con la emisión del boleto)											ok					
**Estado si hay novedades:** NOVEDAD (se obliga a dejar un comentario con referencia a la cotización) (la solicitud vuelve a estado 'Novedad')          ok
**Estado cuando se genera el Boleto** COTIZACION SELECCIONADA (la solicitud pasa al estado 'Se Boleto cargado') (las demas cotizaciones quedan con estado 'Cotizacion anulada')   ok
**Estado el Administrador carga otra cotizacion y el anterios queda:** COTIZACION ANULADA (la solicitud vuelve a estado 'Cotizacion cargada')      ok


---
### 5 Emisión del boleto
**Responsable:** Administrador
* Se realiza la compra del tiquete.
* Se relaciona el boleto con la cotización aprobada. (las otras cotizaciones quedan con estado 'Rechazada')
* Se registra el boleto final en el sistema. (NO IMPLEMENTADO AÚN)
> 🔎 **(mejora futura):** desglosar información detallada del boleto y vuelos.

**Estado cuando es cargado el boleto:** BOLETO EMITIDO (pendiente de revisión por el empleado) (La solicitud pasa al estado 'Boleto cargado', se notifica al solicitante)

---
### 6 Revisión del boleto
El empleado revisa el boleto emitido y confirma que la información es correcta.

**Estado si EMPLEADO no aprueba:** NOVEDAD (se obliga a dejar un comentario con referencia al boleto) (la solicitud vuelve a estado 'Novedad')
**Estado si EMPLEADO aprueba:** CONFORME POR EL EMPLEADO (Se cierra la solicitud, estado 'Cerrada') (la seccion de BOLETA queda con color)
**Estado cuando se esta en revisión:** EN REVISION POR ADMIN (cuando el Administrador abre la novedad, la solicitud vuelve a estado 'En revisión')
**Estado el Administrador carga otro boleto y el anterios queda:** BOLETO ANULADO (la solicitud vuelve a estado 'Se cargo boleto')

---
### 7 Cierre del proceso
El proceso se finaliza una vez emitido el boleto y empleado esta conforme.
**Estado final:** Cerrada

📌 Estados de la Solicitud
Estos estados reflejan el progreso global del proceso.
Estados principales: Pendiente,En revisión,Cotizado,Novedad,Rechazada,Cerrada.

Pendiente: la solicitud fue creada y está en espera de revisión administrativa.
En revisión; el administrador valida la información o gestiona novedades.
Cotizado: se han cargado cotizaciones y el solicitante debe revisarlas.
Novedad: Existe información adicional requerida o un ajuste pendiente.
(Puede originarse por el administrador o el solicitante.)
Rechazada: la solicitud no continuará (datos inválidos, viaje cancelado, etc.) abrir otra solicitud. (obliga a dejar un comentario FINAL con referencia a la cotización o boleto)
Emitido boleto: El boleto fue generado y está pendiente de validación por el solicitante.
Cerrada: El proceso finalizó satisfactoriamente.


📌 Estados de la Cotización
Representan el ciclo de vida de cada opción de vuelo.
Estados operativos: Cargada, Pendiente, Opción primaria, Opción secundaria, Novedad, Seleccionada, emitio, Rechazada.

Cargada: Cotización registrada por el administrador.
Pendiente (complementario): en espera de revisión por el solicitante.
Opción primaria: Seleccionado como opción principal por el solicitante.
Opción secundaria: Seleccionado como alternativa.
Novedad: Requiere ajuste, aclaración o cambio. 
Seleccionada: La cotización que se convirtió en boleto (estado final para la cotización aprobada).
emitio: 
Rechazada: No seleccionada o descartada (estado final para las cotizaciones no aprobadas).


📌 Estados del Boleto
Emitido: El boleto fue generado y está pendiente de validación por el solicitante.
Novedad: Requiere ajuste, aclaración o cambio.
En revisión por el Administrador: El boleto está siendo revisado por el administrador.
Anulado: Invalidado por actualización o reemplazo.
Conforme por el empleado: Confirmado por el solicitante, proceso cerrado.


**Notas funcionales:**
* Se pueden agregar observaciones o novedades.
* Debe ser posible comentar o referenciar una cotización específica.
* Cada conversación debe permitir respuestas (tipo hilo).
* Puede utilizarse un **flag “Pendiente”** mientras el solicitante revisa opciones.
* Cada entidad (Solicitud, Cotizacion, Boleto) tiene su propio ciclo de vida independiente.
* El estado solo cambia como consecuencia de una acción válida (sistema orientado a eventos y acciones; no se requiere una tabla de transiciones validas).
* El usuario NO debería elegir directamente el estado destino.
* No tener un endpoint genérico de estado(arquitectura débil)es un edpoints por acción.

///////////////////////////////////////////////////
json de la solicitud
	- Solicitante genera la solicitud, su estado por defecto es PENDIENTE
json de respuesta
	- cuando la entidad esta en PENDIENTE y el Admin abre solicitud:
	- el sistema en la entidad solicitud indica EN REVISION
json de la cotizacion
	- cada cotizacion indica estado COTIZACION NUEVA
	- la solicitud escucha el estado y cambia estado a COTIZACION CARGADA
json de respuesta
	- Solicitante puede generar el COTIZACION RECHAZADA
json de respuesta
	- Admin puede generar el COTIZACION ANULADA
json de respuesta
	- Solicitante puede escoger OPCION PRIMARIA
json de respuesta
	- Solicitante puede escoger OPCION SECUNDARIA
json de novedad
	- Solicitante puede generar una NOVEDAD en la cootizacion
	- Solicitante debe justificar la novedad por comentario
	- El sistema en la entidad solicitud indicara NOVEDAD
	- Admin puede generar una NOVEDAD en la cootizacion
	- Admin debe justificar la novedad por comentario
	- El sistema en la entidad solicitud indicara NOVEDAD
json de respuesta
	- Cuando se genera boleto, la entidad cotizacion (no elegida) recibe el estado COTIZACION RECHAZADA
	- Cuando se genera boleto, la entidad cotizacion (elegida) recibe el estado SELECCIONADA
json de respuesta
///////
json del boleto
	- el Boleto indica estado EMITIDO
	- la solicitud escucha el estado y cambia estado a BOLETO CARGADO
	- si Boleto remplaza un boleto anterior este ultimo queda BOLETO ANULADO
	- si Boleto remplaza un boleto anterior la solicitud cambia estado a BOLETO CARGADO
json de respuesta
	- Solicitante puede generar una NOVEDAD
	- Solicitante debe justificar la novedad por comentario
	- la solicitud escucha el estado y cambia estado a NOVEDAD
json de respuesta
	- cuando la entidad esta en NOVEDAD y el Admin abre solicitud:
	- el sistema en la entidad solicitud indica EN REVISION
json de respuesta
	- Solicitante puede estar CONFORME
	- la solicitud escucha el estado y cambia a CERRADA (la solicitud se completo)



## ✈️ Estados del Vuelo / Boleto
*(No implementado aún - Se requiere que el Administrador transcriba el BOLETO o una IA lo haga)*

BASE DE DATOS: sgs_db_gestor_viajes

ENTIDADES:::


 USUARIO
_________

- id
- numero_documento
- cod_empleado
- nombre
- user
- contraseña
- rol (Solicitante / Administrador)


 Solicitud
_________

- id
- estado_actual_id (FK → estado_solicitud)
- radicado (cod_empleado+id)
- usuario_id (FK → Usuario)
- tipo_de_vuelo
(ida, ida y vuelta, múltiples)
- created_at
- delete_at
- update_at


historial_estado_solicitud (auditoría de estado)
_________

- id
- solicitud_id
- estado_id
- usuario_id
- observación
- created_at


estado_solicitud (catálogo interno)
_________

- id
- estado
(
PENDIENTE,
EN REVISION,
COTIZACION CARGADA,
BOLETO CARGADO,
NOVEDAD,
RECHAZADA,
CERRADA
)
- slug
- color_hexa_main
- color_hexa_sec
- editable


Cotizacion
_________

- id
- solicitud_id (FK)
- cotizacion_anterior_id (puede ser null)
- estado_actual_id (FK → estado_cotizacion)
- cobertura  (Ida, Vuelta o Completa)
- valor_total
- aerolinea
- created_at


Historial_estado_cotizacion (auditoría de estado)
_________

- id
- solicitud_id
- estado_id
- usuario_id
- observación
- created_at



estado_cotizacion (catálogo interno)
_________

- id
- estado (
COTIZACION NUEVA,
COTIZACION RECHAZADA,
OPCION PRIMARIA,
OPCION SECUNDARIA,
PENDIENTE,
NOVEDAD,
COTIZACION SELECCIONADA,
COTIZACION ANULADA
)
- slug
- editable


Boleto
_________

- id
- cotizacion_id (FK)
- reemplaza_boleto_id (nullable FK → boleto.id)
- boleto_anterior_id (puede ser null)
- aerolinea(ej. Avianca, Latam)
- codigo_reserva (El famoso PNR de 6 letras/números)
- numero_tiquete
- url_archivo_adjunto (Para el PDF del pasabordo)
- valor_final
- fecha_compra
- created_at


historial_estado_boleto (auditoría de estado)
_________

- id
- boleto_id
- estado_id
- usuario_id
- observación
- created_at



estado_boleto (catálogo interno)
_________

- id
- estado (
BOLETO EMITIDO,
CONFORME POR EL EMPLEADO,
EN REVISION POR ADMIN
BOLETO ANULADO
)
- slug
- editable




## 2. Modulo de Comunicación
El Módulo de Comunicación permite gestionar comentarios, observaciones, novedades y rechazos asociados a cualquier entidad del sistema (Solicitud, Cotización o Boleto).

Se trata de un sistema de conversación contextual, donde:
* Todos los mensajes se visualizan en una única sección tipo **timeline/chat**.
* Cada comentario está vinculado a una entidad y estado específico.
* Es posible responder a un comentario puntual (estilo *WhatsApp reply*).
* Algunos comentarios pueden marcarse como Novedad o Rechazo, afectando el flujo 

Este módulo es transversal al negocio y se mantiene desacoplado del sistema de estados.

## 🗄 Estructura de la Tabla: `comentarios`
- id
- entidad_tipo      (solicitud | cotizacion | boleto)
- entidad_id
- estado_id
- usuario_id
- comentario
- comentario_padre_id (nullable)
- created_at

---
##  Descripción de Campos
🔹 entidad_tipo + entidad_id
Permiten asociar el comentario a cualquier entidad del sistema.
Ejemplo:

```text
entidad_tipo = 'cotizacion'
entidad_id = 15
```
Esto indica que el comentario pertenece a la **Cotización #15**.
Este enfoque permite reutilizar la misma tabla para múltiples entidades sin duplicar estructuras.

🔹 comentario_padre_id
Permite implementar respuestas encadenadas, simulando el comportamiento de respuesta contextual (tipo WhatsApp).
* Si `comentario_padre_id` es `NULL` → Es un comentario principal.
* Si tiene valor → Es una respuesta a otro comentario.
Ejemplo:
```text
Comentario 10:
"El vuelo tiene cambio de horario"
Comentario 11:
comentario_padre_id = 10
"¿Cuál es el nuevo horario?"
```
En la interfaz, el comentario 11 mostrará un fragmento del comentario 10 en formato resaltado o translúcido.

## 💬 Visualización en UI

Los comentarios se muestran en una sección única tipo:
* Línea de tiempo
* Conversación estilo chat
Cada mensaje puede indicar:
* Usuario que lo genera
* Fecha y hora
* Entidad relacionada
* Indicador visual del estado
* Respuesta contextual si aplica





//////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
// Front - 	Ver diagrama de la base da datos y respuestas json.

VISTAS  +crear #ver %editar

>> vista usuario
	(+)Nueva Solicitud #
		- muestras los datos suministrados
			-- cada trayecto posee su estado `puede cambiar el estado - modal`
		(+) puede ver o adjutar 1 cotizacion  (url, captura aerolinea, valor) `puede #ver adjuntar`
			- cada cotizacion muestra su valor, radicado, estado 
			-- los estados se listan horizontalmente en cronologia
			-- cada estado puede indicar una observacion (por defaul se muestra el ultimo estado)
			-- sera posible ver la lista de:  estadoS-usuario-observacion
			`puede cambiar el estado (aprobado-rechazado) - modal `
			(==) puede ver los datos del Boleto  
				- todos los datos del vuelo y descarga 

>> vista admin
	(FILTRO1 todos-(Cargada, Pendiente*, Novedad*, Rechazado, Aprobado) ///   cc usuario /// BUSCAR) 
	[Indicar una breve descripcion del estado]
	----
	(#) Puede ver la solicitud #
		- Usuario de la solicitus
		- muestra los datos suministrado
			-- cada trayecto posee su estado `puede cambiar el estado - modal`
		(+) puede ver, cambiar estados o adjuntar cotizaciones (url, captura aerolinea, valor)
			- cada cotizacion muestra su valor, radicado, estado 
			- nota: es posible 2 cotizaciones (ida y vuelta) con dos aerolineas dif (y 2 boletos)
			-- cada estado puede indiar una observacion
			(== %) Boleto
				- Si es aprobado Admin debe: trascribir datos y subir adjunto
				- todos los datos del vuelo y descarga 
	---
	MODAL DE APROBACION (supongo de darme los datos para la tabla boleto o vuelo)


>> vista Dios
	Puede revertir estado, borrar estados