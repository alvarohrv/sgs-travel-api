import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

// Wrapper para no repetir AuthGuard('local') en todos los controladores.
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}

// AuthGuard('local') es un middleware de Passport que buscará la estrategia local
// Las estratedias es Passport se definen en clases que extienden de PassportStrategy y por tatnto espera encontrarlas en un registro interno.

/**
 Qué hace AuthGuard('local')?
Recibe la petición HTTP
Busca una estrategia llamada 'local' (registrada por LocalStrategy)
Ejecuta el método validate de esa estrategia
Si retorna usuario → permite acceso; si no → error 401
 */