import { Module } from '@nestjs/common';
import { BoletoService } from './boleto.service';
import { BoletoController } from './boleto.controller';

@Module({
  controllers: [BoletoController],
  providers: [BoletoService],
})
export class BoletoModule {}
