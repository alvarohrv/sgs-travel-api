import { Inject, Injectable } from '@nestjs/common'
import type { ConfigType } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import jwtConfig from '../config/jwt.config'

// Inject permitirá que NestJS inyecte la configuración JWT tipada en el constructor de esta estrategia, lo que mejora la mantenibilidad y seguridad del código al evitar el uso directo de process.env dentro de la estrategia. Además, al usar ConfigType<typeof jwtConfig>, obtenemos un tipo seguro para la configuración JWT, lo que ayuda a prevenir errores relacionados con propiedades mal escritas o no definidas en tiempo de desarrollo.

// @Inject
// Es un decorador de NestJS para inyectar dependencias personalizadas cuando no puedes usar la inyección automática por tipo.
// Como cuando Inyectas por string en lugar de por tipo (como las provenientes de las variables de entorno - centralizadas con @nestjs/config).

// @nestjs/config es una librería instalada para manejar la configuración de la aplicación, especialmente para leer variables de entorno de manera centralizada y tipada. y sin exponerlos directamente en el código fuente, y para facilitar la configuración en diferentes entornos (desarrollo, producción, etc.) sin cambiar el código.

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

    // constructor() {  /// ANTES ////
    // const jwtSecret = process.env.JWT_SECRET
    // if (!jwtSecret) {
    //   throw new Error('JWT_SECRET no esta definida en variables de entorno')
    // }


  constructor(
    @Inject(jwtConfig.KEY) // ← NestJS inyecta la configuración JWT tipada desde el módulo de configuración.
    private readonly config: ConfigType<typeof jwtConfig>, // ← tipo seguro lo que nos da autocompletado y validación de tipos para config.secret y config.expiresIn.
  ) {
    // Patrón académico: estrategia desacoplada de process.env
    // y alimentada por configuración inyectada/tipada.
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // secretOrKey: jwtSecret,
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
