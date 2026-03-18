import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { BoletoService } from './boleto.service';
import { BoletoController } from './boleto.controller';

@Module({
  imports: [AuthModule],
  controllers: [BoletoController],
  providers: [BoletoService],
})
export class BoletoModule {}
