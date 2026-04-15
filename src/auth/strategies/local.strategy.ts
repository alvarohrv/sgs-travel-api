import { Injectable } from '@nestjs/common' // El decorador @Injectable() marca esta clase como un proveedor (provider) que puede ser inyectado en otras partes de la aplicación, como en la propiedad providers de @Module para que este disponible para la inyección de dependencias, en por ejemplo LocalAuthGuard (en el AuthGuard() )
import { PassportStrategy } from '@nestjs/passport'
import { Strategy as IUseLocalStrategyYeaa } from 'passport-local' // alias local

import { AuthService } from '../auth.service'

@Injectable()
export class LocalStrategy extends PassportStrategy(IUseLocalStrategyYeaa) {
  //// PassportStrategy toma el nombre de la estrategia base (Strategy as IUseLocalStrategyYeaa) que viene de 'passport-local' y por tanto se registrará automáticamente con el nombre 'local' (ver src/auth/guards/local-auth.guard.ts).

  constructor(private readonly authService: AuthService) {
    // readonly: Solo lectura, se asigna una vez; indica que la propiedad solo se asigna una vez (al inicio) y no puede modificarse después (sin posibilidad de setter  php<3))
    // Por defecto passport-local toma username y password del body.
    super()
  //super({
  //  usernameField: 'email',    / ← "usa el campo 'email' como username"
  //  passwordField: 'pass', // ← "usa el campo 'pass' como password"
  //  property: 'usuario',       // ← y acá, cambia req.user a req.usuario
  //});
  }

  async validate(username: string, password: string) { //nombre esperado por Passport en el contrato,es parte de su API.
    return this.authService.validateUser(username, password) //retorna para password { id, username, rol } o ERROR
  }
  // nota: es async porque AuthService.validateUser es async, aunque esta ultima sí devuelve un objeto o lanza una excepción, no devuelve una promesa. 
  
  //ESTANDAR: Si la validación es exitosa, Passport inyectará el resultado (el usuario o en este caso el objeto completo) en req.user. Si la validación falla (lanza una excepción), Passport responderá con un error 401 Unauthorized. 


  // Por defecto, Passport Local espera que el body tenga:
  //   json
  //   {
  //     "username": "algo",
  //     "password": "algo"
  //   }

}

/*
passport-local	'local'
passport-jwt	'jwt'
passport-google-oauth20	'google'
*/