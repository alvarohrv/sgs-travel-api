import { Inject, Injectable } from '@nestjs/common' // Decoradores de NestJS para inyección de dependencias.
import type { ConfigType, /*ConfigService*/ } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import jwtConfig from '../config/jwt.config'

// Defirencia entre @Inject y @Injectable, ambos son decoradores de NestJS relacionados con la inyección de dependencias, pero tienen propósitos diferentes:
// @Injectable: Se utiliza para marcar una clase como un proveedor que puede ser inyectado en otros lugares. Es decir, le dice a NestJS que esta clase es un servicio o componente que puede ser utilizado por otros servicios o controladores a través de la inyección de dependencias.
// @Inject: se usa cuando NestJS NO puede resolver la dependencia automáticamente (no es una clase, es un string, token, configM)odule, etc.) y necesitas indicarle explícitamente qué inyectar. En este caso, se usa para inyectar la configuración JWT que se registró con registerAs('jwt', ...)


// Inject permitirá que NestJS inyecte la configuración JWT tipada en el constructor de esta estrategia, lo que mejora la mantenibilidad y seguridad del código al evitar el uso directo de process.env dentro de la estrategia. Además, al usar ConfigType<typeof jwtConfig>, obtenemos un tipo seguro para la configuración JWT, lo que ayuda a prevenir errores relacionados con propiedades mal escritas o no definidas en tiempo de desarrollo.

// @Inject
// Es un decorador de NestJS para inyectar dependencias personalizadas cuando no puedes usar la inyección automática por tipo.
// Como cuando Inyectas por string en lugar de por tipo (como las provenientes de las variables de entorno - centralizadas con @nestjs/config).

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

    // constructor() {  /// ANTES ////
    // const jwtSecret = process.env.JWT_SECRET
    // if (!jwtSecret) {
    //   throw new Error('JWT_SECRET no esta definida en variables de entorno')
    // }
    
  constructor(
    //private config: ConfigService, // (NO RECOMENDADO)
    @Inject(jwtConfig.KEY)
    private readonly config: ConfigType<typeof jwtConfig>, // ← tipo seguro lo que nos da autocompletado y validación de tipos para config.secret y config.expiresIn.
    // nota: en @Inject NestJS NO puede resolver la dependencia automáticamente ❌ Esto falla; Porque: ConfigType no existe en runtime (solo TS) y jwtConfig.KEY es un string, no una clase. Por eso se necesita indicar a NestJS qué inyectar, como lo hacemos acá!.
  ) {
    // Patrón académico: estrategia desacoplada de process.env
    // y alimentada por configuración inyectada/tipada.
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // secretOrKey: jwtSecret, // venia de process.env // (NO RECOMENDADO)
      // secretOrKey: this.configService.get('JWT_SECRET') // (NO RECOMENDADO)
      // secretOrKey: this.config.secret, ERROR estoy dentro de SUPER ^^
      secretOrKey: config.secret,
    })
  }

  // Lo que retornamos aqui queda disponible como req.user en rutas protegidas.
  async validate(payload: { sub: number; role: string }) {
    return {
      id: payload.sub,
      role: payload.role,
    }
  }
}


     