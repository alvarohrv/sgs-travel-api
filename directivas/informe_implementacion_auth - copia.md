
Flujo de la autenticación con JWT en NestJS

El sistema ha sido actualizado para integrar un flujo de autenticación profesional basado en los estándares de la industria, utilizando **Passport.js** y **JSON Web Tokens (JWT)**. Este desarrollo permite gestionar la identidad de los usuarios de forma segura, eliminando la necesidad de manejar sesiones en el servidor (*stateless authentication*).

# Resumen

* **Estrategia de Acceso:** Se ha configurado `LocalStrategy` para interceptar las credenciales proporcionadas en la solicitud de inicio de sesión (`POST /auth/login`). Esta estrategia valida la identidad comparando el nombre de usuario y el hash de la contraseña almacenado en la base de datos mediante `bcrypt`.

* **Emisión de Credenciales:** Una vez validada la identidad, el `AuthService` genera un token JWT. Este token encapsula la información esencial del usuario (identificador único y rol) mediante un *payload* firmado digitalmente con una clave secreta (`JWT_SECRET`), garantizando su integridad y autenticidad.

* **Estructura de Seguridad:** La arquitectura se ha preparado para un escalamiento seguro mediante la implementación de un decorador `@Public()`. Esto permite designar explícitamente qué rutas son de libre acceso, mientras que el resto del sistema podrá ser protegido mediante *Guards* en fases posteriores de desarrollo.

* **Integración Modular:** Se ha configurado correctamente el `AuthModule` con los módulos necesarios de Passport y JWT, asegurando que las dependencias sean inyectadas correctamente a través de los proveedores de NestJS.

* **Validación:** Se ha habilitado la comunicación entre el servicio de usuarios y el servicio de autenticación para permitir la verificación de contraseñas mediante hashing, asegurando que ninguna contraseña sensible transite o se almacene en texto plano.

* **Estado del Proyecto:** La aplicación compila satisfactoriamente y el endpoint de autenticación se encuentra operativo. En un segundo paso se genera la implementación de *Guards* de autorización, los cuales validarán los permisos de los usuarios en cada petición basándose en el rol definido en el token.

* **Validación de Tokens mediante `JwtStrategy`:** Se ha integrado `passport-jwt` para automatizar la protección de rutas. Esta estrategia extrae el token del encabezado `Authorization: Bearer` en cada petición, valida su firma contra la clave secreta y verifica su vigencia. Si el token es legítimo, la estrategia inyecta la información del usuario (identificador y rol) en el objeto de la solicitud (`req.user`), permitiendo que el resto del sistema identifique al emisor sin consultar nuevamente la base de datos.

* **Control de Acceso mediante Roles (`RolesGuard`):** Se ha diseñado un mecanismo de control de acceso jerárquico. Mediante el decorador personalizado `@Roles()`, es posible restringir endpoints específicos a roles determinados (por ejemplo, `ADMIN`). El `RolesGuard` intercepta la petición, compara el rol contenido en el payload del JWT con los roles requeridos para la ruta y deniega automáticamente cualquier intento de acceso no autorizado, devolviendo un error de estado 403.

* **Integración con Servicios de Negocio:** Se ha eliminado la dependencia de identificadores de usuario estáticos (*hardcoded*). Actualmente, los controladores extraen el identificador único del usuario directamente desde el token validado (`req.user.id`). Esto garantiza que las operaciones de negocio, tales como la creación de solicitudes o gestión de cotizaciones, queden asociadas unívocamente a la identidad real del usuario autenticado.

* **Sobre el desacoplamiento:** La lógica de seguridad se mantiene aislada de la lógica de negocio. Los servicios ahora se concentran exclusivamente en procesar los datos, delegando la validación de identidad y permisos a los componentes de seguridad.

* **Sobre la Integridad de Datos:** Al utilizar la identidad extraída del token en lugar de parámetros de entrada controlables por el usuario, se incrementa significativamente la robustez del sistema frente a intentos de suplantación o manipulación de datos ajenos.

# 🧠 Autenticación con JWT en NestJS — Resumen de lo implementacion:

Se implementó autenticación en el backend usando **JWT (JSON Web Token)** con estrategias de **Passport** en NestJS.

El objetivo es permitir que un usuario:

```
envíe credenciales → sea validado → reciba un token → use ese token en futuras peticiones
```
## 1. Endpoint de login
Se creó el endpoint:
```text
POST /auth/login
```
Decorado como público:
```ts
@Public()
@Post('login')
```
Esto permite que el endpoint **no requiera autenticación previa**.

## 2. Flujo de autenticación

El flujo que ocurre internamente es:

```
Login request
 ↓
LocalAuthGuard
 ↓
LocalStrategy
 ↓
AuthService.validateUser()
 ↓
AuthService.login()
 ↓
JwtService.sign()
 ↓
Cliente recibe token
```
Cada componente tiene una función específica.

---

# 3. LocalStrategy (passport-local)
```
src/auth/strategies/local.strategy.ts
```
Esta estrategia usa **passport-local** para validar:
```
username
password
```
```ts
validate(username: string, password: string) {
  return this.authService.validateUser(username, password);
}
```
La estrategia **no genera el token**, solo valida credenciales.

---

## 4. AuthService

AuthService contiene la lógica de autenticación.
Dos funciones principales:

### 4.1 Validar usuario
```ts
validateUser(username, password)
```
```
buscar usuario en base de datos
↓
comparar contraseña con bcrypt.compare
↓
si coincide → retornar usuario
```

### 4.2 Generar JWT

Luego el método `login()` crea el token.

Ejemplo conceptual:

```ts
login(usuario) {
  const payload = {
    sub: usuario.id,
    role: usuario.rol
  };

  return {
    token: this.jwtService.sign(payload)
  };
}
```

## 5. Payload del JWT
El token contiene información mínima del usuario:
```js
payload = {
  sub: usuario.id,
  role: usuario.rol
}
```
Esto permite identificar al usuario **sin consultar la base de datos en cada request**.

## 6. Generación del token

Para firmar el token se usa:
```ts
this.jwtService.sign(payload)
```
Esto proviene del módulo: @nestjs/jwt

## 7. Configuración en AuthModule

En `auth.module.ts` se registran los módulos necesarios.
```ts
imports: [
  PassportModule,
  JwtModule.register({
    secret: process.env.JWT_SECRET,
    signOptions: { expiresIn: '1h' }
  })
]
```
Esto define:
```
secret → clave para firmar tokens
exp → tiempo de expiración
iat → fecha de emisión
```

## 8. Variable de entorno

La clave secreta se guarda en `.env`.
Ejemplo:
```
JWT_SECRET="Agua=)-Chiru<3-Santa*-Programacion//-Amor%-#4r84d2g11dr5g4dfx6b41hr498"
```
Esta clave se usa para:
```
firmar tokens
verificar tokens
```

## 9. Respuesta del endpoint
Cuando el login es exitoso, el servidor responde:
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 5,
      "username": "alvaro",
      "role": "ADMIN"
    }
  }
}
```
El cliente debe **guardar el token**.

---

## 10. Uso del token en peticiones
Las peticiones autenticadas deben enviar el token en el header:
```
Authorization: Bearer TOKEN
```
Ejemplo:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```
Esto permitirá que el servidor identifique al usuario.

---

## 11. Guardias de seguridad (aún no activos)

Después de que el login funcionara, se implementó el sistema de autorización basado en JWT y roles usando herramientas de NestJS.

Se implementaron las siguientes piezas:
JwtStrategy
JwtAuthGuard
Roles decorator
RolesGuard

### 11.1 JwtAuthGuard
Se usa para proteger endpoints.

` src/auth/strategies/jwt.strategy.ts `

Esta estrategia usa passport-jwt para:
- leer el token del header Authorization (JwtStrategy)
- validar el token con JWT_SECRET
- extraer el payload
- adjuntar el usuario al request (añade información a req.user)
Esto permite que los controladores conozcan quién es el usuario autenticado.
```
Request
↓
JwtAuthGuard valida token
↓
JwtStrategy llena req.user
↓
RolesGuard verifica rol
↓
endpoint ejecuta lógica
```

### 11.2 JwtAuthGuard
Es una clase que extiende el guard genérico de Passport.
De la forma:
`export class JwtAuthGuard extends AuthGuard('jwt') {} `

` src/auth/guards/jwt-auth.guard.ts `

```ts
//En lugar de escribir:::
@UseGuards(AuthGuard('jwt'))
//se usa:::
@UseGuards(JwtAuthGuard)
```

### 11.3 Roles Decorator
Permite declarar permisos.

` src/auth/decorators/roles.decorator.ts `

Este decorador permite declarar qué rol puede acceder a una ruta.

```ts
//Ejemplo:
@Roles('ADMIN')
```
Internamente el decorador solo guarda metadata en la ruta, de la forma:
```ts
SetMetadata('roles', roles) // setea los roles de interes que tendran acceso
// es una forma elegante de pasar una Lista ^^ 
```
Esto no valida nada por sí mismo.
La validación la hace el RolesGuard.
por tanto: el guard luego verifica si el usuario tiene ese rol.

### 11.4 RolesGuard

` src/auth/guards/roles.guard.ts `

Este guard se encarga de:
- leer el rol requerido de la metadata
- leer el rol del usuario desde req.user
- compararlos
- permitir o bloquear acceso (controla permisos por rol.)

Flujo conceptual:
```
endpoint tiene @Roles('ADMIN')
↓
RolesGuard lee metadata
↓
obtiene req.user.role
↓
compara roles
↓
si coincide → acceso permitido
si no → 403 Forbidden
```
El uso de `Guards` y decoradores permite que la protección de rutas sea uniforme y predecible en toda la API, facilitando el mantenimiento y la escalabilidad.

### 11.5 Decorador Public
Permite excluir endpoints de autenticación.
```ts
@Public()
@Post('login')
```
Esto evita que `JwtAuthGuard` bloquee la ruta.


### 11.6 Uso combinado en controladores

Ejemplo:
```ts
@UseGuards(JwtAuthGuard)
@Get('solicitud')
```
Recordar, internamente usa:
```
AuthGuard('jwt')
```

Ejemplo:
```ts
@Roles('ADMIN')
@UseGuards(JwtAuthGuard, RolesGuard)
@Get('usuarios')
```

12. Estado actual del sistema (después de la implementación)

El sistema ahora tiene:

Autenticación funcionando
✔ login con username y password
✔ validación con passport-local
✔ generación de JWT

Autorización funcionando
✔ JwtStrategy implementado
✔ JwtAuthGuard funcionando
✔ Roles decorator funcionando
✔ RolesGuard funcionando
✔ Integración con controladores
    Ej:
` createSolicitud(@Req() req) {
    const usuarioId = req.user.id;
  }
`
  



## 13. Flujo final esperado 

```
Usuario hace login // POST /auth/login
↓
LocalStrategy valida credenciales
↓
AuthService genera JWT
↓
Cliente recibe token // JWT
↓
--- Luego para acceder a recursos:
↓
envía token en cada request
// Authorization: Bearer TOKEN
↓
JwtAuthGuard intercepta - valida token
↓
JwtStrategy valida token
↓
req.user se llena con payload
↓
RolesGuard valida permisos
↓
endpoint ejecuta lógica
```
- autenticación stateless (JWT no crea sesiones.Cada request trae su identidad.)

- La autenticación ahora es stateless basada en token.
- El servidor no guarda sesión.
- Cada request trae su identidad:
token → identidad
payload → usuario
role → permisos








????????????????????????

...Si quieres, en el siguiente paso te agrego también el manejo de rutas públicas/protegidas global con APP_GUARD para que no tengas que poner UseGuards en cada endpoint.



