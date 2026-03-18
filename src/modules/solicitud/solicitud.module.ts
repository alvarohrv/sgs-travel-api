import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { SolicitudService } from './solicitud.service';
import { SolicitudController } from './solicitud.controller';

@Module({
  imports: [AuthModule],
  controllers: [SolicitudController],
  providers: [SolicitudService],
})
export class SolicitudModule {}
