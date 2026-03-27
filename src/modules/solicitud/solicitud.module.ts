import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { SolicitudService } from './solicitud.service';
import { SolicitudController } from './solicitud.controller';

@Module({
  // imports: Módulos externos que este módulo necesita (sus proveedores)
  imports: [AuthModule],
  // controllers: Controladores que manejan las rutas HTTP de este módulo
  controllers: [SolicitudController], //Que Maneja peticiones HTTP relacionadas con Solicitud
   // providers: servicios internos, guards, interceptors que este módulo usa internamente
  providers: [SolicitudService], 
  // exports: Lo que este módulo COMPARTE con otros módulos que lo importen
  // exports: [SolicitudService], //Ya no!  // Exportamos el servicio para que pueda ser inyectado en otros módulos (ej: CotizacionModule)
})
export class SolicitudModule {}
