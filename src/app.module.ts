import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
// import { AppService } from './app.service';
import { SolicitudModule } from './modules/solicitud/solicitud.module';
import { CotizacionModule } from './modules/cotizacion/cotizacion.module';
import { BoletoModule } from './modules/boleto/boleto.module';
// import { ComentarioModule } from './modules/comentario/comentario.module';
import { UsuarioModule } from './modules/usuario/usuario.module';
import { HistorialModule } from './modules/historial/historial.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    // Carga global de variables de entorno para todo NestJS.
    ConfigModule.forRoot({
      isGlobal: true,
      // validationSchema: null, // Aquí podrías agregar un esquema de validación con Joi para validar las variables de entorno. Pero en este caso se valido en cada módulo específico (ej: jwt.config.ts) para tener validaciones específicas por módulo.
    }),
    PrismaModule,
    SolicitudModule,
    CotizacionModule,
    BoletoModule,
    UsuarioModule,
    HistorialModule,
    AuthModule,
    // ComentarioModule
  ThrottlerModule.forRoot([
    // definir una estrategia global (no las puntuales en cada controlador)
    {
      name: 'normal-human',    // Configuración estándar
      ttl: 60000,        // 60 segundos
      limit: 30,        // 40 solicitudes
    },
    {
      name: 'restrictive',     // Configuración para endpoints sensibles
      ttl: 60000,        // 60 segundos
      limit: 10,          // 10 solicitudes
    },
    // {
    //   name: 'heavy-load',      // Configuración para operaciones pesadas
    //   ttl: 300000,       // 5 minutos
    //   limit: 20,         // 20 solicitudes
    // },
    {
      name: 'health',      // Configuración para operaciones tipo "health" (ej: GET /health)
      ttl: 60000,       // 1 minutos
      limit: 60,         // 60 solicitudes
    },
  ])
  ],
  controllers: [AppController],
  // providers: [AppService],
  providers: [
    {
      provide: APP_GUARD,      // NestJS entiende: "esto es un guard global"
      useClass: ThrottlerGuard, // Usa ThrottlerGuard como guard global para aplicar las reglas de rate limiting definidas en ThrottlerModule.forRoot()
    },
  ],
})
export class AppModule {}



  
