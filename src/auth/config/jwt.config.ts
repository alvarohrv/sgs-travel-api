import { registerAs } from '@nestjs/config'
import type { StringValue } from 'ms'

export default registerAs(
  'jwt',
  (): { secret: string; expiresIn: StringValue | number } => {
    // es importante definir los tipos de retorno para que ConfigType<typeof jwtConfig> funcione correctamente en la inyección de dependencias.
    // StringValue no es un string cualquiera, es un tipo específico que acepta formatos de tiempo como '1h', '30m', '7d', etc., lo que es común para la configuración de expiración de tokens JWT.

    // Patrón recomendado: centralizar lectura de variables de entorno.
    // Así evitamos usar process.env directamente en módulos/estrategias.

    const secret = process.env.JWT_SECRET

    if (!secret) {
      throw new Error('JWT_SECRET no esta definida en variables de entorno')
    }

    return {
      secret,
      // expiresIn puede ser:
      // - Un StringValue (formato ms como '1h', '30m', '7d') ✓ Tipo seguro
      // - Un número en segundos (ej: 3600 para 1 hora) ✓ Tipo seguro
      // Aquí asignamos un default '1h' que es compatible con ambos tipos.
      expiresIn: (process.env.JWT_EXPIRES_IN ?? '1h') as StringValue,
    }
  },
)
// Tipado seguro (TypeScript): Al usar ConfigType<typeof jwtConfig>, obtenemos un tipo seguro para la configuración JWT. Esto significa que si intentamos acceder a una propiedad que no existe, si hay un error tipográfico o no se define el .env, TypeScript nos alertará durante el desarrollo, lo que reduce la posibilidad de errores en tiempo de ejecución.

// Cuando usas registerAs('jwt', ...):
// NestJS registra esta configuración con la clave 'jwt'
// El objeto jwtConfig tiene una propiedad especial: jwtConfig.KEY que vale 'jwt'
// @Inject(jwtConfig.KEY)  Es equivalente a @Inject('jwt')