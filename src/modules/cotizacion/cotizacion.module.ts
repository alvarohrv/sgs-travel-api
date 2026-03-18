import { Module } from '@nestjs/common'
import { AuthModule } from '../../auth/auth.module'
import { CotizacionService } from './cotizacion.service'
import { CotizacionController } from './cotizacion.controller'
import { PrismaModule } from '../../../prisma/prisma.module'

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CotizacionController],
  providers: [CotizacionService],
})
export class CotizacionModule {}

