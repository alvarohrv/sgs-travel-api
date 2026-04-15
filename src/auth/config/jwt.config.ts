import { registerAs } from '@nestjs/config'
import type { StringValue } from 'ms'

// @nestjs/config es una librería instalada para manejar la configuración de la aplicación, especialmente para leer variables de entorno de manera centralizada y tipada. y sin exponerlos directamente en el código fuente, y para facilitar la configuración en diferentes entornos (desarrollo, producción, etc.) sin cambiar el código.

/*
Cada módulo maneja su propia configuración (o almenos, es lo recomendado)
No mezclar configuraciones diferentes en un solo archivo
src/
├── auth/
│   ├── config/
│   │   └── jwt.config.ts        ← configuración JWT
│   ├── strategies/
│   └── auth.module.ts
├── database/
│   ├── config/
│   │   └── database.config.ts   ← configuración BD
│   └── database.module.ts
└── app.module.ts
*/

export default registerAs(  //usamos un export 'default', podamos darle el nombre que queramos lo recomendado sera jwtConfig.
  'jwt',
  (): {
    secret: string
    expiresIn: StringValue | number
    refreshExpiresIn: StringValue | number // Para el refresh token, se busca usar el formato de tiempo como '7d' o '30m', pero es posible usar un número en segundos
  } => {
    // es importante definir los tipos de retorno para que ConfigType<typeof jwtConfig> funcione correctamente en la inyección de dependencias.
    // jwtConfig será la variable que almacena la configuración registrada con la clave 'jwt' cuando se importe.
    // Luego se puede inyectar usando @Inject('jwt') o @Inject(jwtConfig.KEY).
    // .KEY es una propiedad especial que tiene el objeto retornado por registerAs, que contiene la clave con la que se registró la configuración ('jwt' en este caso). Esto es útil para evitar errores de tipeo al inyectar la configuración.
    // Esta configuración se usa en: JwtModule.registerAsync() y en JwtStrategy: aunque se podria usar en los servicios directamente (no es los recomendado).
    // nota: StringValue no es un string cualquiera, es un tipo específico que acepta formatos de tiempo como '1h', '30m', '7d', etc., lo que es común para la configuración de expiración de tokens JWT.

    // Patrón recomendado: centralizar lectura de variables de entorno.
    // Así evitamos usar process.env directamente en módulos/estrategias.

    /* ALGUNA LOGICA: */ 
    const secret = process.env.JWT_SECRET
    if (!secret) {
      throw new Error('JWT_SECRET no esta definida en variables de entorno')
    }

    return {
      secret,
      // expiresIn puede ser:
      // - Un StringValue (formato ms como '1h', '30m', '7d') ✓ Tipo seguro
      // - Un número en segundos (ej: 3600 para 1 hora) ✓ Tipo seguro
      // Aquí asignamos un default '15m' que es compatible con ambos tipos.
      expiresIn: (process.env.JWT_EXPIRES_IN ?? '5m') as StringValue,
      refreshExpiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as StringValue,
    }
  },
)
// Tipado seguro (TypeScript): Al usar ConfigType<typeof jwtConfig>, obtenemos un tipo seguro para la configuración JWT. Esto significa que si intentamos acceder a una propiedad que no existe, si hay un error tipográfico o no se define el .env, TypeScript nos alertará durante el desarrollo, lo que reduce la posibilidad de errores en tiempo de ejecución.

// Cuando usas registerAs('jwt', ...):
// NestJS registra esta configuración con la clave 'jwt'
// El objeto jwtConfig tiene una propiedad especial: jwtConfig.KEY que vale 'jwt'
// @Inject(jwtConfig.KEY)  Es equivalente a @Inject('jwt')

