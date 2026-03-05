import { Controller } from '@nestjs/common';
import { CotizacionService } from './cotizacion.service';

@Controller('cotizacion')
export class CotizacionController {
  constructor(private readonly cotizacionService: CotizacionService) {}
}
