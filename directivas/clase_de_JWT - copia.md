Guard
# Flujo:
-Registro: El usuario envía pass, backend hace el hash y guardas en la DB.
-Login: El usuario envía user y pass. Passport-Local lo busca, Bcrypt lo compara. (servidor verifica en la Base de Datos si el password es correcto)
-Generación de Token (Aquí entra JWT con la libreria: jsonwebtoken ): Si el login es exitoso, el servidor crea el token (JWT) con la informacion y rol del usuario y le añade una firma digital secreta; por tanto el AuthService crea un string cifrado (JWT) que dice: "Este es Alvaro y es Administrador".
-Uso de la API: El servidor le entrega ese token al cliente, el usuario guarda ese token (generalmente en una cookie o almacenamiento local). Ahora, cuando quiera "Crear Cotizacion", ya no envía su contraseña, envía el Token.
A partir de aquí, el servidor deja de consultar la BD. Cada petición nueva llega con el JWT, el servidor valida ( mediante el uso de Passport-jwt ) la firma y dice: "Como yo mismo firmé esto, le creo a este token".
nota: aunque el servidor no necesite consultar la BD para saber quién es el usuario, muchos sistemas aplican validaciones híbridas (consultar brevemente la BD o una caché como Redis para verificar que el usuario no haya sido bloqueado recientemente).


# Instalación de Dependencias

1. El núcleo de Passport y JWT
npm install @nestjs/passport passport passport-local passport-jwt jsonwebtoken

2. Seguridad de contraseñas
npm install bcrypt

3. Tipos de TypeScript (Dependencias de desarrollo)
npm install --save-dev @types/passport-local @types/passport-jwt @types/bcrypt

Cifrado: bcrypt para el manejo de hashes de contraseñas.
Estrategias: passport-local (identidad) y passport-jwt (acceso persistente).
Tokens: jsonwebtoken para la creación y firma de los tiquetes digitales.


@nestjs/jwt ?? ?? ?? ?? 

--- 

# Autenticacion (credenciales, llaves, roles)
es el proceso que determina si una combinación de credenciales (usuario y contraseña) es válida. Responde a la pregunta: *¿quién eres?*
Generalmente se verifica mediante:
* usuario + contraseña
* API keys
* tokens
* certificados

**Herramientas comunes en Node.js**
bcrypt
* Se usa para hashear contraseñas.
* Permite almacenar contraseñas de forma segura en la base de datos.

Passport.js
Librería de autenticación para Node.
Estrategias comunes:
* passport-local
  Autenticación usando usuario y contraseña; usado para el login inicial;
* passport-jwt
  Autenticación usando JWT tokens; usado para proteger rutas después del login.

## Token (JWT)

Libreria: jsonwebtoken

Después de autenticar al usuario, el servidor genera un JSON Web Token (JWT).
Este token contiene información como:
* id del usuario (sub)
* rol
* tiempo de expiración
El cliente debe enviar este token en cada petición protegida.
la informacion en el payload del JWT no debe contener datos sensibles, solo lo necesario para identificar al usuario y sus permisos.

### Uso de la cabecera Authorization
En el Login, el servidor responde con el token en el Body (porque es un dato nuevo que están proporcionado). Pero en todas las demás peticiones, el cliente lo envía en la Cabecera (Header).
Es un estándar HTTP: El protocolo HTTP ya define que las credenciales de acceso deben viajar en el campo Authorization.

Nota: el token normalmente se envía en la cabecera HTTP:
```
Authorization: Bearer <token>
```

En NestJS no sueles usar @Headers('authorization') manualmente dentro de tus controladores de negocio. En su lugar, usas un Guard que lo hace de forma invisible:

Ejemplo en frameworks como NestJS:

```ts
//  leer el token directamente en un controlador: (No recomendado)
@Headers('authorization') token: string 

// Lo mas comun es a través de un Guard o Middleware que se encarga de validar el token antes de llegar al controlador.
// En la práctica, lo más común es que el token se procese antes de llegar al controlador, y el controlador simplemente acceda a la información del usuario a través de req.user o algo similar

@UseGuards(JwtAuthGuard)
```

No se suele enviar el token en el body (JSON) porque:
* la cabecera está diseñada para credenciales
* mantiene la API más limpia
* facilita el uso de middlewares o guards

# 3. Autorización la gestion de permisos de roles

La autorización ocurre después de la autenticación.
El servidor ya sabe quién eres, ahora debe decidir:
¿Qué tienes permitido hacer?
Ejemplos:
|  Usuario   | Permiso                 |
|  --------  | -----------------       |
| Admin      | Responder solicitudes   |
| Empleado   | crear solicitudes       |
| Invitado   | limitadas interacciones |
| SuperAdmin | total acceso            |

Esto suele implementarse mediante:
* roles (Como en la API de Travel)
* permisos
* políticas de acceso


/////////////////////
## Separación de responsabilidades: Users vs Auth

En una API moderna se suele separar la lógica en dos módulos principales:

* Users (Usuarios) → gestiona los datos del usuario en la base de datos.
* Auth (Autenticación) → gestiona la identidad y el acceso al sistema.

Esto evita mezclar responsabilidades y facilita el mantenimiento del sistema.

Módulo Users (Gestión de usuarios)
El módulo Users se encarga del CRUD de la entidad usuario.
Es decir, gestiona los registros del usuario en la base de datos.
Operaciones típicas:
POST   /users
GET    /users
GET    /users/:id
PATCH  /users/:id
PATCH /users/:id/rol
DELETE /users/:id
protegido por:
JWT válido
rol: Admin
nota: Cuando se crea un usuario se debe hashear la contraseña antes de guardarla.
Nota:  Nunca enviar la contraseña (hash) en la respuesta de la API. La contraseña debe excluirse siempre de la respuesta.

Módulo Auth (Autenticación)
El módulo Auth se encarga de verificar la identidad del usuario.
Una vez autenticado, le entrega una llave de acceso (JWT) para la gestion de Autorizaciones.

Operaciones típicas:
POST /auth/login
- Passport se usa normalmente dentro del módulo Auth.


/////////////////////

Estructura típica en Express
Usa:
middleware
utils
passport config
routes

~~~
src/
 ├── middleware/    //Funciones que interceptan requests
 │    └── auth.handler.js  //function authHandler(req,res,next){}

utils/
 └── auth/
      ├── index.js          //configuración de Passport //registro de estrategias
      └── strategies/
           └── local.strategy.js
           └── jwt.strategy.js

-----------------

Route
 ↓
Middleware
 ↓
Passport strategy
 ↓
Controller
~~~

NestJS no usa "middleware sueltos"
usa:
modules
controllers
services
guards  -- lo que antes era: middleware auth
strategies  -- lo que antes passport strategies
~~~
src
 ├── auth   // LOGIN - JWT //
 │    ├── auth.module.ts
 │    ├── auth.controller.ts
 │    ├── auth.service.ts
 │    ├── strategies
 │    │     ├── local.strategy.ts
 │    │     └── jwt.strategy.ts
 │    ├── guards
 │    │     └── jwt-auth.guard.ts
 │
 ├── usuario
 │    ├── usuario.module.ts
 │    ├── usuario.controller.ts
 │    ├── usuario.service.ts
 │
 ├── app.module.ts


-------------------------------------
| concepto   | para qué sirve       |
| ---------- | -------------------- |
| Module     | agrupa funcionalidad |
| Controller | maneja rutas         |
| Service    | lógica de negocio    |
| Strategy   | autenticación        |
| Guard      | protege rutas        |
-------------------------------------


Login request
 ↓
LocalStrategy
 ↓
AuthService genera JWT
 ↓
Cliente guarda token
 ↓
Cliente hace request
 ↓
JwtAuthGuard
 ↓
JwtStrategy
 ↓
Controller
~~~


/////////////////////
## Middleware de Seguridad y Control de Acceso en APIs

Antes de usar librerías como Passport, muchas aplicaciones implementaban seguridad mediante middlewares personalizados.

Los middlewares son funciones que se ejecutan entre la petición del cliente y el controlador final, permitiendo validar, modificar o bloquear la solicitud.
Se usan frecuentemente para:
- validar autenticación
- verificar permisos
- validar headers
- controlar acceso a endpoints

* Middleware de verificación con API Key
Una forma simple (y bastante rústica) de seguridad consiste en exigir que el cliente envíe una clave en el encabezado de la petición.
Esto evita que cualquiera pueda consumir la API.
~~~js
const boom = require('@hapi/boom');

function middCheckApiKey(req, res, next) {
  const apiKey = req.headers['api'];

  if (apiKey === '123') {
    next();
  } else {
    next(boom.unauthorized());
  }
}

module.exports = { middCheckApiKey }
~~~
NOTA: las API Keys no suelen usarse para identificar personas, sino sistemas.
Se usan principalmente en:
integraciones servidor a servidor (Server-to-Server)


En arquitecturas modernas el flujo suele ser:
~~~
Usuario se autentica (login)
        ↓
Servidor genera JWT
        ↓
El cliente envía el token en cada request
        ↓
Middleware valida el JWT
        ↓
Middleware verifica permisos (roles)
        ↓
Se permite o no el acceso al endpoint
~~~


Pero sí, son utiles para validar; para el caso de seguridad, si un usuario tiene permisos una ves esta autenticado y jwt lo autoriza puede accedes a ciertos endpoinst.

ej: function middCheckAdminRole(req, res, next){} el cual es su 'req' ya debe venir el payload dentro del espacio del objeto del user.y solo se genera el next() si es === 'Admin'

o mas flexible, con closures:
~~~ts
function middCheckAdminRole(req, res, next) {
  const user = req.user;

  if (user.role === 'Admin') {
    next();
  } else {
    next(boom.unauthorized());
  }
}
~~~
Una versión más flexible permite definir qué roles pueden acceder.
~~~ts
function middCheckRoles(...roles) {
  return function(req, res, next) {
    const user = req.user;

    if (roles.includes(user.role)) {
      next();
    } else {
      next(boom.unauthorized());
    }
  }
}
~~~
Uso del middleware:
~~~ts
router.get(
  '/users',
  middCheckRoles('Admin', 'Manager'),
  controller.getUsers
);
~~~
Tipos comunes:
- API Key Middleware
valida una clave en headers
útil para integraciones entre sistemas
- Auth Middleware
valida el token JWT
identifica al usuario
- Role Middleware
verifica permisos del usuario
controla acceso a endpoints

Relación con Passport
Librerías como Passport automatizan muchas de estas tareas:
- autenticación con usuario y contraseña
- validación de JWT
- estrategias de autenticación
Internamente, Passport también utiliza middlewares, pero ya preparados para manejar:
-sesiones
-tokens
-estrategias de autenticación



/////////////////////

## libreria: bcrypt

bcrypt es una librería usada para hashear contraseñas de forma segura antes de guardarlas en la base de datos.

- Regla fundamental:
Nunca, bajo ninguna circunstancia, se debe guardar una contraseña en texto plano en la base de datos. Por eso se utiliza hashing de contraseñas.

bcrypt no es parte de JWT, pero se usan juntos normalmente en el flujo de autenticación.

` "123456" → bcrypt.hash() → "$2b$10$X7kL8..." `


bcrypt.compare()
Como el hash no puede revertirse, no se puede obtener la contraseña original, esta función toma la clave que escribe el usuario en el login y la compara matemáticamente con el hash de la base de datos para ver si coinciden.

` bcrypt.compare(password_ingresada, hash_guardado) ` 

pass-hash.js  //archivo para una funcion
Archivo que contiene una función exportable asincrónica para generar hashes.

~~~ts
import bcrypt from "bcrypt";

export async function hashPassword(pass){
  const saltRounds = 4;
  return await bcrypt.hash(pass, saltRounds);
}
// se 4 es el número de salt rounds, que define el costo computacional.
~~~

pass-verify.js
Archivo que contiene una función exportable asincrónica para validar una contraseña comparándola con el hash almacenado.
~~~ts
import bcrypt from "bcrypt";

export async function verifyPassword(pass, hash){
  return await bcrypt.compare(pass, hash);
}
~~~

el flujo de autenticación moderno:
` bcrypt + JWT + Passport ` 
/////////////////////

libreria: passport

Passport es un middleware que maneja la lógica de "verificar credenciales".
Passport es un middleware de autenticación para Node.js.

Passport no implementa la autenticación por sí mismo, sino que utiliza estrategias (strategies) para definir cómo se valida al usuario.

Estrategia: Local Strategy:
La Local Strategy significa que la autenticación se realiza contra tu propia base de datos.
Lo que hace: Recibe el username y password, busca al usuario en Prisma, usa Bcrypt para comparar, y si todo está bien, le da el "paso" a la petición.

¿Va con JWT? Sí. En una aplicación profesional, Passport-Local se usa solo en el login, y una vez que se ingresa, el servidor te entrega el JWT y el cliente usa el token en cada request, esto evita que el usuario tenga que loguearse en cada petición.

Passport funciona como middleware dentro de las rutas.
- no requiere implementar un servicio (passport ya lo hace)
- solo el auth.controller con la estrategia:
Ejemplo en un controlador de autenticación:
~~~js
passport.authenticate('local', { session: false })
// session: false : la aplicación no utiliza sesiones, sino JWT (stateless authentication).
~~~
Ejemplo de request de login
El cliente envía las credenciales en formato JSON:
~~~json
//request
{
  "username": "",
  "password": ""
}
~~~

Ademas en el Login el front puede validar el ROL para mostrar cierta interface
Cuando haces el login, tu API te devuelve un JWT (que contiene el rol del usuario) junto con la información del perfil.
El proceso funciona así:
-Login: El servidor te entrega el token.
-Almacenamiento: Guardas ese token (en una cookie o localStorage).
-Interfaz: Como el JWT contiene el rol, tu frontend lo lee para decidir qué botones o menús mostrar (esto es solo para mejorar la experiencia del usuario).
-Seguridad: Para cada acción real, envías el token en los headers de tus peticiones. El backend siempre verifica ese token para confirmar que el usuario realmente tiene permiso.
NOTA: Aunque el frontend oculte botones según el rol, la seguridad siempre debe validarse en el backend: Cada petición debe enviar el token

// utils/auth/
// // index.js
passport.use(LocalStrategy)
el cual se usa en la raiz del proyecto

utils/auth/strategies/local.strategy.js
Aquí se define la lógica de verificación de credenciales.
Passport utiliza la librería: passport-local
para exportar una instancia llamada LocalStrategy
~~~js
new Strategy(
  {
    usernameField: 'username'
  },
  async (username, password, done) => {

    // buscar usuario en base de datos

    // comparar password
    const isMatch = await bcrypt.compare(password, hash);

    if (!isMatch) {
      return done(null, false);
    }

    return done(null, user);
  }
);
// Opciones
//usernameField: 'username'
//Permite cambiar el nombre del campo enviado desde el frontend.
////
//La función done() indica el resultado de la autenticación.
done(error)
done(null, false)
done(null, user)
~~~

nota: recordar indicar nota, passport.use(LocalStrategy)
nota: recordar implementar como: passport.authenticate('local',{session:false}) //middleware
https://platzi.com/cursos/passport/implemetando-login-con-passportjs/

/////////////////////
/////////////////////






## JSON Web Token (JWT)

Un JSON Web Token (JWT) es un token firmado digitalmente que permite que un cliente demuestre su identidad ante un servidor sin que este tenga que guardar una sesión.

Se puede entender como:
`Una llave digital portátil que el usuario lleva consigo.`
El servidor no necesita recordar quién es el usuario (aunque si le reconoce); solo necesita verificar que la llave sea válida.

JWT es un estándar para enviar información segura entre un cliente y un servidor en formato JSON. Se confía en él porque está firmado digitalmente (con una clave secreta o pública/privada). Por tanto busca garantiza que la información no fue manipulada en el camino.

Sirve para transmitir información segura entre cliente y servidor en formato JSON.
La seguridad se basa en que el token está firmado criptográficamente.

Un JWT tiene tres partes:
` header.payload.signature `

Header
Describe el algoritmo de firma.
~~~json
{
 "alg": "HS256",
 "typ": "JWT"
}
~~~
Payload
Contiene la información (claims).
~~~json
{
 "sub": "user_id",
 "role": "admin",
 "iat": 1710000000
}

sub	- id del usuario
iat	- fecha de emisión
exp	- fecha de expiración
role - rol del usuario
⚠️ El payload no debe contener información sensible.
~~~
Signature
Es la firma digital creada usando:
` secret + header + payload `
Esto garantiza que nadie pueda modificar el token sin conocer la clave secreta.

* Formas como se puede implementar:
- Utilidades manuales de JWT (sign y verify) - Por ejemplo Node o en express.js
- Estrategia JWT de Passport 
- Parte de un Frameworks (Express vs NestJS) 


Autorización
JWT aparece después del login, donde el usuario usa el token para acceder a recursos.
~~~
GET /tickets
Authorization: Bearer <JWT>
~~~
Autorización es el uso principal: Una vez que el usuario hace login, recibe un token. En cada petición posterior, envía ese token para demostrar quién es y a qué tiene permiso.
nota: La autenticación (el momento de verificar quién eres) ocurre solo una vez: cuando el usuario envía sus credenciales (usuario y contraseña) en el POST /auth/login.

```
Login
   ↓
Autenticación (usuario + contraseña)
   ↓
Servidor genera JWT
   ↓
Cliente envía JWT en Authorization header
   ↓
Servidor verifica JWT
   ↓
Autorización según rol o permisos
```
¿Cuándo deberíamos utilizar JSON Web Tokens?
Autorización: este es el escenario más común para usar JWT. Una vez que el usuario haya iniciado sesión, cada solicitud posterior incluirá el JWT, lo que le permitirá acceder a rutas, servicios y recursos que están autorizados con ese token. 
Las ventajas de JWT es que permite soportar diferentes clientes, que sea stateless y poder hacer un sistema distribuido.

*Sin uso de sesiones*
En autenticación con JWT (stateless)
El servidor no guarda ninguna sesión.
La autenticación se realiza mediante tokens (JWT) que el cliente envía en cada petición en la cabecera Authorization.


JWT vs. Cookies/Sesiones Tradicionales

Antes (Sesiones): El servidor guardaba la sesión en su memoria o base de datos. Si tenías varios servidores, la sesión se perdía si el usuario saltaba de uno a otro (problemas de escalabilidad).

Ahora (JWT): El servidor no guarda nada. El token es autónomo: lleva toda la información necesaria dentro de sí mismo. Esto permite que cualquier servidor en cualquier parte del mundo pueda validar al usuario sin consultar una base de datos central de sesiones.

~~~
WT tiene dos operaciones principales:
SIGN  → crear token (login)
VERIFY → validar token (cada request)
~~~

JWT Strategy: Así como hay una "Local Strategy" para el login, hay una "JWT Strategy" para proteger tus rutas de boletos.

Guards (En NestJS): Es un archivo que pones encima de tus rutas:
@UseGuards(JwtAuthGuard).
Si el token es inválido, NestJS ni siquiera deja que la petición llegue al controlador.


# Guards &&  Decoradores personalizados como @Roles()   #TEMA_DE_GUARDS

Un Guard decide si una petición puede continuar o no hacia el controller.
Por tanto, si el token es inválido NestJS ni siquiera deja llegar al controlado.
nota: en NestJS un Guard es una clase que implementa la interfaz: CanActivate

@UseGuards() es un decorador.
Su función es decirle a NestJS qué Guards deben ejecutarse antes de un endpoint
` @UseGuards(JwtAuthGuard, RolesGuard)`
1. Ejecuta JwtAuthGuard
2. Ejecuta RolesGuard

RolesGuard no es un decorador personalizado.
Es una clase que implementa un Guard.
En NestJS un Guard es una clase que implementa la interfaz CanActivate.
RolesGuard normalmente lo escribe el desarrollador siguiendo la documentación.
Hace uso de :
CanActivate
Reflector
metadata definida con SetMetadata

~~~ ts
//  Ejemplo conceptual:

@Injectable()
export class RolesGuard implements CanActivate {

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // lógica de autorización
    const roles = this.reflector.get('roles', context.getHandler()); //lee metadata
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return roles.includes(user.role); // validacion
  }
}
//Los Guards contienen lógica que decide si una petición puede continuar.
~~~

Implementacion:
~~~ts
// En NestJS el orden de esos decoradores no afecta la ejecución de los Guards en este caso.
// PERO SE RECOMIENDA:::

@Roles('ADMIN')
@UseGuards(JwtAuthGuard, RolesGuard) // @UseGuards(JwtAuthGuard)
@Get('users')
findAll() {}

/*
Request
↓
JwtAuthGuard
↓
valida JWT
↓
req.user = payload
↓
RolesGuard
↓
lee metadata de @Roles
↓
compara roles
↓
controller
*/
~~~

NOTA: un decorador es una función que añade metadata o comportamiento a una clase o método.

@Roles() es un decorador personalizado, define qué roles son permitidos.
Su función es definir metadata (información adicional) sobre la ruta.
No valida nada. Solo guarda información.
Sirve para decirle al Guard qué roles son permitidos.
RolesGuard usa esa metadata
~~~ts
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) =>
  SetMetadata('roles', roles); // la metadata se llama 'roles'

// Guardar en esta ruta:
// roles = ['ADMIN']
~~~

Implementacion
~~~ts

@Roles('ADMIN')
@UseGuards(JwtAuthGuard, RolesGuard)  //valida token &&  valida roles
@Get('users')
findAll() {}
~~~

~~~
Decoradores comunes de NestJS
@Controller define controller
@Get  endpoint GET
@Post endpoint POST
@UseGuards  aplicar guards
@Roles  definir roles (personalizado)
@Body obtener body
@Param  obtener params
~~~



Refres token (cada 12 horas para un demo)


/////////////////
se usara:
Libreria 'jsonwebtoken'
Libreria: 'passport-jwt'


* Ejemplo de implementacion mas MANUAL: 

~~~ js
// Ejemplo conceptual: jsonwebtoken
// token-sign-user.js
// generacion mediante: jsonwebtoken.sign(payload, secret)

const jwt = require('jsonwebtoken');
function signToken(user) {
  const payload = {
    sub: user.id,
    role: user.role
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET); //jwt.sign(payload, secret)
  return {
    user,
    token
  };
}
module.exports = { signToken };
//Este token se envía al cliente después del login
~~~
Verificación del token
En Express se puede verificar con:
~~~js
// token-verify.js
// validacion mediante: jsonwebtoken.verify(token, secret)
const jwt = require('jsonwebtoken');
function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET); //jwt.verify(token, secret) 
}
module.exports = { verifyToken };
//Esto devuelve el payload si el token es válido.
~~~
Y esto se usa normalmente en un middleware:
~~~js
const payload = verifyToken(token);
req.user = payload;
~~~

* JWT Strategy con Passport
Ahora bien, Passport automatiza ese proceso:

Así como existe Local Strategy para login, también existe una estrategia para tokens.
Se implementa con: passport-jwt

La estrategia de Passport:
- obtiene el token del header
- valida la firma
- devuelve el payload
- si es correcto, permite acceder al recurso.

IMPORTANTE: Passport internamente ya hace esto:
~~~js
jwt.verify(token, secret)
~~~

~~~js
// jwt.strategy.js
// - Ese archivo le dice a Passport:
// 1. de dónde sacar el token
// 2. qué clave usar (JWT_SECRET)
// 3. qué hacer con el payload
//Nota: Passport hace internamente: jwt.verify()
new JwtStrategy(
 {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
 },
 async (payload, done) => {
   return done(null, payload);
 }
);
// Aquí no se usa jwt.verify() manualmente, porque Passport lo hace internamente.
/*
Flujo::::::::::::: 
Request
 ↓
Passport middleware
 ↓
Extrae token del header
 ↓
jwt.verify(token, secret)
 ↓
obtiene payload
 ↓
req.user = payload
*/
~~~

En Express se protege una ruta con middleware.
// Ejemplo:
` passport.authenticate('jwt', { session: false }) `

/////////// /////////// /////////// /////////// 

## Uso en NestJS

NestJS abstrae todo lo anterior.
NestJS usa Guards para proteger rutas.   #VER EL '#TEMA_DE_GUARDS'

~~~ 
NestJS usa:
@nestjs/jwt
@nestjs/passport
~~~ 

~~~ 
En lugar de escribir:
jwt.sign()
usas:
this.jwtService.sign(payload)
~~~ 

~~~ ts
// AuthService
const payload = {
  sub: user.id,
  role: user.role
};
return {
  access_token: this.jwtService.sign(payload)
};
~~~

~~~ ts
// JWT Strategy en NestJS:
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET
    });
  }

  async validate(payload) {
    return payload;
  }
}
~~~

Cómo se usa después
Con un Guard:
~~~ts
//@UseGuards(JwtAuthGuard) // se puede validar adicionalmente con RolesGuard para validar roles de la forma:
@Roles('Admin')
@UseGuards(JwtAuthGuard, RolesGuard) // primero valida el token, luego valida los roles
@Get('protected')


//@UseGuards(AuthGuard('jwt')) es una forma más directa de usar la estrategia JWT sin crear un guard personalizado, pero se recomienda crear un guard específico (JwtAuthGuard) para tener mayor control y flexibilidad.
~~~
El guard:
~~~js
//Guard intercepta la petición
//valida el JWT (JWT Strategy)
//permite o bloquea la ejecución del controller
/////////////////
Request
 ↓
Guard
 ↓
JWT Strategy
 ↓
payload → req.user
 ↓
Controller
~~~

Dónde se guarda el token en el cliente
Opciones comunes:
lugar	uso
localStorage	aplicaciones SPA
cookie httpOnly	mayor seguridad

Refresh Tokens
Los tokens suelen tener expiración.
` JWT expira en 1 hora `
Para evitar relogin constante se usan refresh tokens.


~~~js
Login
   ↓
Auth Controller
   ↓
Passport-local valida credenciales
   ↓
Auth Service genera JWT
   ↓
cliente recibe token

// Luego cada request:

cliente envía JWT
   ↓
middleware verifica token
   ↓
middleware verifica roles
   ↓
controller ejecuta acción
~~~


////////////////


Cliente:::
En ApiDog, esto se hace configurando la pestaña Auth (o Header):
Pestaña Auth: Selecciona el tipo Bearer Token.
Campo Token: Pegas la cadena larga que recibiste en el Login.
¿Qué hace ApiDog por detrás?: ApiDog insertará automáticamente una cabecera llamada Authorization que se ve así:
**Authorization: Bearer <TU_TOKEN_AQUI>**
(tambien es posible mas directo desde la pestala Auth y no desde HEader)

ApiDog tiene una función llamada Environment Variables (Variables de entorno):
Crea una variable llamada token.
Usa un Post-processor (Script) en tu petición de login para que, al recibir la respuesta, guarde automáticamente el valor del token en esa variable.
En tus otros endpoints, en lugar de pegar el token a mano, pones {{token}}.


2.1 La alternativa "amigable": Cookies (HTTP-Only)
Si quieres que el navegador maneje la sesión automáticamente sin que tú tengas que copiar y pegar tokens, las Cookies son la respuesta clásica.
-Cómo funciona: Cuando el usuario hace login, tu API envía una cabecera llamada Set-Cookie con el JWT adentro.
-La ventaja: El navegador guarda esa cookie y la envía automáticamente en cada petición que hagas a tu API, sin que tengas que configurar nada en el navegador.
-La seguridad: Si usas la bandera HttpOnly, el código JavaScript de la página no puede leer la cookie, lo cual protege al usuario contra ataques de robo de datos.

2.2 La alternativa "amigable":  LocalStorage 
(no es la mejor practica)


3. Si eres principiante y quieres facilidad, instala el módulo de Swagger en NestJS (@nestjs/swagger).
Te ahorra copiar y pegar tokens.
Documenta automáticamente qué recibe y qué devuelve tu API.
Te permite probar todo desde una web sencilla y segura.


4. El concepto de "Intersector"
Tanto en Angular (con su clase HttpInterceptor) como en React (usando una librería llamada Axios), existe una función llamada Intersector.
Imagina que el Intersector es un peaje o una aduana por la que tienen que pasar todas las maletas (peticiones HTTP) antes de salir del navegador hacia internet.
Tu componente de React dice: axios.get('/vuelos').
Antes de que la petición salga al wifi, el Intersector la detiene.
El Intersector busca el token (que suele estar guardado en la memoria de la aplicación o en el localStorage).
El Intersector modifica la petición y le pega la cabecera: Authorization: Bearer <token>.
La petición sale "enriquecida" hacia tu API.
nota: igual el cliente SÍ necesita guardar el token en algún lugar persistente. Si no usa Cookies, usa obligatoriamente el localStorage o el sessionStorage.
¿Por qué usar interseptores y no cookies automáticas?
Multi-plataforma: El mismo código de intersector que usas en React te sirve casi igual para una App móvil en React Native (donde no existen las cookies de navegador).
Evitan el CSRF: Un tipo de ataque que afecta específicamente a las cookies automáticas.

////////////////

uso del payload del objeto usuario que se recibe del token para validar por tanto que usuario genera la peticion, sin enviar info del usuario por el body de la peticion.
