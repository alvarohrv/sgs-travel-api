import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'  //<3
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt'
import { ConfigModule, ConfigType, /*ConfigService*/ } from '@nestjs/config'
// import { ConfigService } from '@nestjs/config' // Para inyectar ConfigService en JwtModule.registerAsync() (NO RECOMENDADO)

import { LocalStrategy } from './strategies/local.strategy'
import { JwtStrategy } from './strategies/jwt.strategy'
import { RolesGuard } from './guards/roles.guard'
import { DemoPolicyGuard } from './guards/demo-policy.guard'
import { DemoPolicyService } from './demo-policy.service'
import jwtConfig from './config/jwt.config' 
import { UsuarioModule } from '../modules/usuario/usuario.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'


@Module({
  imports: [
    UsuarioModule,
    PassportModule,
    // UsuarioModule, --- NO se requiere el módulo completo. UsuarioService no se importa en el módulo, se inyecta. Ademas la entidad Usuario NO exporto el Módulo, exporto el Servicio.

    // Se Carga la configuración en el módulo (para que esté disponible)
    ConfigModule.forFeature(jwtConfig),
    // ← solo en AuthModule, no global
    // ConfigModule requiere se importado
    // Luego se inyecta en JwtModule.registerAsync()
    // No carga variables de entorno, solo configuraciones con registerAs
    
    // Se Configura JwtModule dinámicamente usando la configuración inyectada (jwtConfig) para que JwtService pueda generar tokens JWT con el secret y opciones de expiración definidas en jwtConfig.
    JwtModule.registerAsync({     //Se requiere configurar//      
    /*
    registerAsync es un método que configura el módulo JWT de forma dinámica, es decir, las opciones se definen en tiempo de ejecución, y nos permite usar el metodo useFactory() para construir la configuración de JwtModule usando otras dependencias (como ConfigService o una configuración específica como jwtConfig). Esto es especialmente útil para cargar configuraciones desde fuentes externas, como variables de entorno, archivos de configuración o incluso servicios remotos, en lugar de tenerlas hardcodeadas en el código fuente.
    */
      // Antes se hacía así (directo):
      // secret: process.env.JWT_SECRET,
      // signOptions: {
      //   expiresIn: '1h',
      // },

      // Ahora se inyecta configuración tipada con ConfigType.
      // 1. imports: ¿Qué módulos necesita ESTA configuración?
      imports: [ConfigModule.forFeature(jwtConfig)],
      // 2. inject: ¿Qué dependencias debe inyectar NestJS en useFactory?
      //inject: [ConfigService]  // (NO RECOMENDADO)
      inject: [jwtConfig.KEY], // <3 Mejor, nos da tipado seguro y evita errores de tipeo al acceder a la configuración.
      // 3. useFactory: Función que recibe las dependencias inyectadas y retorna la configuración para JwtModule.
      // useFactory: Función que construye las opciones de configuración para JwtModule usando la configuración inyectada.
      // useFactory pertenece a la configuración dinámica de JwtModule, no a AuthModule.
      // El retorno debe ser de tipo JwtModuleOptions para que coincida con lo que espera JwtModule.
      // useFactory: (configService: ConfigService ): JwtModuleOptions => ({  (NO RECOMENDADO)
      useFactory: (myconfig: ConfigType<typeof jwtConfig>): JwtModuleOptions => ({
        //secret: configService.get<string>('JWT_SECRET'),                 // (NO RECOMENDADO) sin tipado específico para JWT.
        secret: myconfig.secret,  /// EL SECRETO ///
        signOptions: {          /// OPCIONES DE FIRMA ///
          expiresIn: myconfig.expiresIn,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    RolesGuard,
    DemoPolicyService,
    DemoPolicyGuard,
  ],
  exports: [AuthService, RolesGuard, DemoPolicyService, DemoPolicyGuard],
})
export class AuthModule {}
