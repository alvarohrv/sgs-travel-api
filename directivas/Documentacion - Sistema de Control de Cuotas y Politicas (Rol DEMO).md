
# Documentación: Sistema de Control de Cuotas y Políticas (Rol DEMO)

Esta implementación establece un **Patrón de Seguridad Híbrido** en NestJS. Mientras que los usuarios `ADMIN` y `SOLICITANTE` operan bajo reglas estándar de RBAC (Control de Acceso Basado en Roles), el usuario `DEMO` está sujeto a una capa adicional de **Políticas de Negocio** que controlan su consumo de recursos y sus permisos.

- Se creó una capa específica para políticas del rol DEMO.
- Se aplicó control de cuotas en creación y control de ownership en acciones de negocio.

## 1. Arquitectura de Archivos y Funcionalidades

### Capa de Decoradores y Guards - Decorador @DemoPolicy Guard 'DemoPolicyGuard'

* **`demo-policy.decorator.ts`**: Define el decorador `@DemoPolicy(recurso, accion)`. Permite marcar endpoints específicos para que el sistema sepa qué tipo de cuota debe validar (ej. 'solicitud', 'create').
- Se usa para marcar rutas con metadata de recurso y acción.
- Ejemplo conceptual: recurso solicitud, acción create.
- Sirve para que el guard sepa qué validar.

* **`demo-policy.guard.ts`**: Es el "guard" especializado (Implementa el DemoPolicyGuard). Solo se activa si el usuario tiene el rol `DEMO`. Intercepta la petición, lee la metadata del decorador y consulta al servicio de políticas (DemoPolicyService), si el usuario aún tiene cupo disponible. Por diseño, su lógica de control de cuotas se aplica únicamente a los endpoints de creación de los recursos definidos en el mismo 'guard'.
- Se ejecuta en rutas que tienen esa metadata.
- Solo valida cuota de creación cuando la acción es create.
- Usa DemoPolicyService para consultar contador diario del DEMO.

Su función es interceptar la petición, extraer la metadata del decorador y consultar al fffff si el usuario cuenta con cupo disponible. .

* **`DemoPolicyService`** servicio de políticas:
- Aplica las reglas DEMO reales:
- Cuotas por recurso: solicitudes 5, cotizaciones 10, boletos 15.
- Reset diario por fecha usando ultima_actualizacion.
- Incremento de contadores tras creación exitosa.
- Decremento implementado para solicitud eliminada.
- Ownership checks para impedir que DEMO modifique entidades de otros.


### Capa de Lógica de Negocio  - Como SERVICIO - DemoPolicyService

* **`demo-policy.service.ts`**: Contiene la lógica para:

    - **Validación de Cuotas**: Verifica los límites (5 solicitudes, 10 cotizaciones, 15 boletos).
    - **Reset Diario**: Compara la fecha de `ultima_actualizacion`. Si es un día nuevo, reinicia los contadores a cero automáticamente.
    - **Gestión de Contadores**: Métodos para incrementar y decrementar los valores en la tabla `estadísticas_de_uso_demo`.
    - **Ownership Check**: Valida que un `DEMO` solo pueda modificar o eliminar registros cuyo `usuario_id` coincida con el suyo.

### Capa de Persistencia (Base de Datos)
* **`schema.prisma`**: Define la tabla `estadisticas_de_uso_demo` vinculada 1:1 con el usuario. Es el almacenamiento físico de los contadores y la fecha de control.

---

## 2. Flujo de Control en un Endpoint

Cuando se realiza una petición (ej. `POST /solicitudes`), el flujo sigue este orden jerárquico:

1.  **Autenticación (`JwtAuthGuard`)**: Identifica al usuario mediante el token. (coloca user en req.user.)
2.  **Autorización de Rol (`RolesGuard`)**: Verifica si el rol (`ADMIN`, `DEMO`, etc.) tiene permiso general para el endpoint.
3.  Si la ruta tiene `DemoPolicy` y acción create, DemoPolicyGuard valida cuota DEMO.
4.  **Política de Cuota (`DemoPolicyGuard`)**: Si el usuario es `DEMO`, este guardia verifica en la DB si tiene cupo. Si llegó al límite (ej. 5 solicitudes), bloquea la petición con un error `403 Forbidden`.
5. En el controlador se pasa req.user.id y req.user.role al servicio.
6.  **Lógica del Servicio**: Si el guardia permite el paso, el servicio correspondiente realiza la acción y llama al `DemoPolicyService` para incrementar el contador.
En el servicio DemoPolicyService:
- si es DEMO, valida ownership para operaciones de modificación.
- si es create, valida/incrementa cuota.
- si cambia de día, resetea contadores antes de validar.


---

## 3. Matriz de Permisos para el Rol DEMO

| Acción | Recurso | Regla Aplicada |
| :--- | :--- | :--- |
| **Lectura (GET)** | Todos | Acceso total para facilitar la demostración del portafolio. |
| **Creación (POST)** | Solicitudes | Límite de **5** unidades por día. |
| **Creación (POST)** | Cotizaciones | Límite de **10** unidades por día (solo sobre sus solicitudes). |
| **Creación (POST)** | Boletos | Límite de **15** unidades por día (solo sobre sus cotizaciones). |
| **Acciones (PUT/PATCH)** | Negocio | Solo permitido si el usuario es el dueño original del registro. |
| **Eliminación (DELETE)** | Todos | Permitido solo sobre recursos propios; **libera cupo** al eliminar. |

---


## 5. Pendientes y Recomendaciones
* **Sincronización de Eliminación**: Asegurarse de que cada vez que un `DEMO` elimine una solicitud, se llame al método `decrement` para que el usuario pueda seguir probando la herramienta sin quedar bloqueado por el límite diario.
* **Validación de Tipos**: Se recomienda correr `npx tsc --noEmit` para confirmar que los cambios en las firmas de los métodos de los controladores (que ahora reciben el objeto `user`) no afecten otras partes del sistema.

---
~~~bash
modified:   directivas/json_app - copia.md
        modified:   prisma.config.ts
        modified:   prisma/schema.prisma
        modified:   prisma/seed/seed-users.ts
        modified:   src/app.controller.ts
        modified:   src/app.module.ts
        modified:   src/auth/auth.module.ts
        modified:   src/modules/boleto/boleto.controller.ts
        modified:   src/modules/boleto/boleto.module.ts
        modified:   src/modules/boleto/boleto.service.ts
        modified:   src/modules/cotizacion/cotizacion.controller.ts
        modified:   src/modules/cotizacion/cotizacion.module.ts
        modified:   src/modules/cotizacion/cotizacion.service.ts
        modified:   src/modules/solicitud/solicitud.controller.ts
        modified:   src/modules/solicitud/solicitud.module.ts
        modified:   src/modules/solicitud/solicitud.service.ts

Untracked files:
  ( use "git add <file>..." to include in what will be committed)
        prisma/migrations/20260317185112_init/
        src/auth/decorators/demo-policy.decorator.ts
        src/auth/demo-policy.service.ts
        src/auth/guards/demo-policy.guard.ts
        src/modules/solicitud/dto/cerrar-solicitud.dto.ts
        src/modules/solicitud/dto/eliminar-solicitudes-usuario.dto.ts
~~~


