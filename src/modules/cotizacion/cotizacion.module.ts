import { Module } from '@nestjs/common'
import { CotizacionService } from './cotizacion.service'
import { CotizacionController } from './cotizacion.controller'
import { PrismaModule } from '../../../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [CotizacionController],
  providers: [CotizacionService],
})
export class CotizacionModule {}

