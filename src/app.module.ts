import { Module } from '@nestjs/common';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
import { SolicitudModule } from './modules/solicitud/solicitud.module';
import { CotizacionModule } from './modules/cotizacion/cotizacion.module';
import { BoletoModule } from './modules/boleto/boleto.module';
// import { ComentarioModule } from './modules/comentario/comentario.module';
import { UsuarioModule } from './modules/usuario/usuario.module';
import { HistorialModule } from './modules/historial/historial.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from './auth/auth.module';


@Module({
  imports: [
    PrismaModule,
    SolicitudModule,
    CotizacionModule,
    BoletoModule,
    UsuarioModule,
    HistorialModule,
    AuthModule
    // ComentarioModule
  ]
  // controllers: [AppController], 
  // providers: [AppService],
})
export class AppModule {}
