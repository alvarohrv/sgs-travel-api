# ✈️ Solicitudes de Vuelo - Backend AP
API REST para la gestión de solicitudes de vuelos corporativos, incluyendo autenticación JWT con refresh token rotación, autorización por roles (ADMIN, REVISOR, SOLICITANTE), y operaciones CRUD sobre solicitudes, cotizaciones y boletos. Construida con **NestJS**, **TypeScript**, **Prisma** y **MySQL**.

---

## 📌 Propósito del Proyecto

Ofrecer una API robusta que permita:

- A empleados → crear solicitudes de vuelo, validar contizaciones y estar conforme con las cotizaciones y boletos.  
- A administradores → cotizar y aprobar solicitudes, generar cotizaciones, emitir boletos y manejar novedades.  
- A superAdmin →  gestionar usuarios y todo lo anterior.

La API implementa seguridad en capas (JWT, refresh tokens, guards, hashing de contraseñas) y sigue principios REST.

Su documentación interactiva (Swagger) facilita la integración con frontend o clientes externos.
Ver: [Documentación Swagger](http://localhost:3000/docs)

## 🛠️ Stack Tecnológico

<p style="margin-left: 120px;" >
  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>


| Categoría            | Tecnologías                                                                 |
| -------------------- | --------------------------------------------------------------------------- |
| **Lenguaje**         | TypeScript                                                                  |
| **Framework**        | NestJS                                                                      |
| **Base de datos**    | MySQL + Prisma ORM                                                          |
| **Autenticación**    | Passport (JWT, Local), bcrypt, @nestjs/jwt                                  |
| **Validación**       | class-validator, class-transformer                                          |
| **Documentación**    | Swagger (OpenAPI)                                                           |
| **Rate Limiting**    | @nestjs/throttler                                                           |
| **Herramientas**     | Git, ApiDog                                                                 |


---

## Arquitectura

La aplicación sigue una **arquitectura modular** típica de NestJS:

- **Módulos**: `Auth`, `Usuario`, `Solicitud`, `Cotizacion`, `Boleto`, `Historial`.
- **Controladores**: Manejan las peticiones HTTP, validan DTOs y llaman a servicios.
- **Servicios**: Contienen la lógica de negocio, interactúan con Prisma y otros servicios.
- **Guards**: Protegen rutas mediante autenticación (`JwtAuthGuard`) y autorización (`RolesGuard`).
- **Estrategias Passport**: `LocalStrategy` (login) y `JwtStrategy` (verificación de token).
- **DTOs**: Definen la forma de los datos de entrada/salida y usan `class-validator`.
- **Configuración tipada**: Uso de `@nestjs/config` con `registerAs` y `ConfigType` para variables de entorno.


## 💭 Reflexiones sobre la arquitectura

- La **modularización** facilita mantener y escalar el proyecto: cada módulo es autocontenido y puede reutilizarse.
- El uso de **configuración tipada** (`jwtConfig`, `databaseConfig`) evita errores en tiempo de ejecución y centraliza las variables de entorno.
- La **inyección de dependencias circulares** se evitó diseñando módulos que exportan solo lo necesario.
- El **refresh token persistente** (hash en BD) y su rotación automática añaden una capa extra de seguridad, permitiendo revocar tokens en caso de robo.
- La combinación de **guards globales** (`ThrottlerGuard`, `JwtAuthGuard`) y **locales** (`RolesGuard`) permite un control fino sobre la seguridad y el rendimiento.

---

## 🔄 Flujo de Datos (Workflow)

1. **Usuario** envía credenciales a `POST /auth/login` → `LocalStrategy` valida → se generan `access_token` y `refresh_token` (éste se almacena hasheado en BD).
2. Para rutas protegidas, el cliente envía `access_token` en cabecera `Authorization: Bearer <token>`.
3. `JwtAuthGuard` verifica el token; si es válido, inyecta el payload en `req.user`.
4. **Autorización**: `RolesGuard` lee los roles requeridos (decorador `@Roles()`) y compara con `req.user.rol`.
5. Las solicitudes se procesan en los controladores → servicios → Prisma → MySQL.
6. Si el `access_token` expira, el cliente usa `POST /auth/refresh` para obtener uno nuevo (el `refresh_token` se envía en cookie HttpOnly).
7. **Rate limiting** limita peticiones repetitivas.
8. Toda la API está documentada en `/docs` (Swagger UI).

---

## 📦 Estructura del Proyecto

```
├── prisma/                   # Esquema, migraciones y seed
├──src/
│  ├── auth/                     # Autenticación (JWT, refresh token, guards)
│  │   ├── config/               # jwt.config.ts (registerAs)
│  │   ├── strategies/           # local.strategy.ts, jwt.strategy.ts
│  │   ├── guards/               # local-auth.guard.ts, jwt-auth.guard.ts, roles.guard.ts
│  │   ├── auth.module.ts
│  │   ├── auth.service.ts
│  │   └── auth.controller.ts
│  ├── modules/                  # Módulos de negocio
│  │   ├── usuario/              # CRUD usuarios, comparar contraseñas
│  │   ├── solicitud/            # Solicitudes de vuelo
│  │   ├── cotizacion/           # Cotizaciones asociadas
│  │   ├── boleto/               # Emisión de boletos
│  │   └── historial/            # Auditoría de cambios
│  ├── config/    
│  ├── app.controller.ts              # // Endpoint: GET /health
│  ├── app.module.ts                 # Importa módulos, configura guards globales, estrategias de throttling, etc.
│  └── main.ts                   # Punto de entrada, configuración global
...
```
---

## 🚀 Estrategia de Despliegue

### Local

**1. Clonar el repositorio**
```bash
git clone git@github.com:alvarohrv/sgs-travel-api.git
cd sgs-travel-api
```

**2. Instalar dependencias**
```bash
npm install
```

**3. Configurar variables de entorno**
```bash
cp .env.example .env
```
Edita el archivo `.env` con dus valores
(especialmente `DATABASE_URL`).
Ver un modelo ejemplo en .env.example

**4. Generar el cliente de Prisma**
```bash
npx prisma generate
```
> **Nota**: `node_modules/@prisma/client/` y `prisma/client/` no están en el repositorio; se generan automáticamente con este comando.

**5. Ejecutar migraciones donde se crea la DB y las tablas**
```bash
npx prisma migrate dev --name init
```
> Si ya tienes migraciones previas, usa `npx prisma migrate dev` para aplicarlas.

**6. (Opcional en desarrollo) Cargar datos de prueba**
```bash
npx prisma db seed
```

**7. Iniciar la aplicación**
```bash
npm run start:dev
```

La API estará disponible en `http://localhost:3000` y la documentación Swagger en `http://localhost:3000/docs`.

---

### Railway

Railway permite desplegar tanto la base de datos MySQL como la aplicación NestJS.

**Paso a paso:**

1. **Crear proyecto en Railway** → "Deploy from GitHub repo".
2. **Añadir base de datos MySQL** → Railway aprovisiona esta base de datos y asigna la variable de entorno `MYSQL_URL`.
3. **Configurar las variables de entorno** en el panel de Railway:
   - `DATABASE_URL` con el valor de `MYSQL_URL` dado por Railway: ${{MySQL.MYSQL_URL}}.
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN`
   - `REFRESH_TOKEN_EXPIRES_IN`
4. **Migraciones en producción**: Railway no ejecuta migraciones automáticamente. Debes ejecutarlas manualmente una vez:
  1. Abre la pestaña "Settings"
  2. Baja hasta "Deploy"
  3. Busca "Pre-deploy Command"
  4. Escribe en el campo de texto el comando para ejecutar las migraciones:
     ```bash
    npx prisma migrate deploy
    ```
  - Presiona Enter o guarda
  Ahora cada vez que hagas deploy, Railway ejecutará ese comando antes de iniciar tu aplicación.
5. Railway leerá el comando de inicio definido en `package.json` y ejecutará automáticamente la instalación.

> **Nota importante**: Asegúrate de que todas las migraciones de Prisma estén actualizadas y versionadas en Git antes de desplegar en producción.

---

## 📚 Documentación de la API (Local)

Una vez la aplicación esté corriendo localmente, puedes acceder a la documentación interactiva (Swagger) en:

```
http://localhost:3000/docs
```

**La documentación incluye:**
- Todos los endpoints y esquemas de datos.
- La posibilidad de probar peticiones autenticadas (botón "Authorize").
- **Credenciales de un usuario DEMO** para probar la API sin necesidad de crear usuarios manualmente.

---

### ⚙️ Configuración de Entornos y Variables de Entorno

**NODE_ENV**
- **Local**: Define `NODE_ENV=development` en el archivo `.env`.
- **Producción**: Define `NODE_ENV=production` en el panel de control del hosting (por ejemplo, Railway). Esto sobrescribirá cualquier valor en el archivo `.env`.
nota: Si `NODE_ENV` no está definido correctamente, la aplicación podría comportarse de manera inesperada.

Configuración de la Base de Datos
- **Local**: La aplicación usará la variable `DATABASE_URL` definida en el archivo `.env`.
  ```env
  DATABASE_URL="mysql://root:root@localhost:3306/my_local_db"
  ```
- **Producción**: La aplicación usará la variable que provea el hosting o vpn, por ejemplo Railway es `MYSQL_URL`, y que debe configurarse en el panel de control del hosting (Railway, AWS, etc.).
  ```env
  MYSQL_URL="mysql://user:password@mysql.railway.internal:3306/production_db"
  ```

---

## 📄 Licencia

📄 Licencia
Este proyecto se comparte bajo licencia Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0).
- Reconocimiento de autoría – Debes dar crédito adecuado, proporcionar un enlace a la licencia e indicar si se realizaron cambios.
- No comercial – No puedes usar este material con fines comerciales (ventas, publicidad pagada, etc.) a menos que se solicite permiso por separado.
- Uso libre – Puedes copiar, distribuir y modificar el código para fines personales, educativos o de investigación.
Puedes leer el texto completo de la licencia en:
https://creativecommons.org/licenses/by-nc/4.0/

---

## ✍️ Autor

[Alvaro Ruiz Vivas - GitHub](https://github.com/alvarohrv)

---




