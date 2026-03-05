import { Controller } from '@nestjs/common';
import { BoletoService } from './boleto.service';

@Controller('boleto')
export class BoletoController {
  constructor(private readonly boletoService: BoletoService) {}
}
