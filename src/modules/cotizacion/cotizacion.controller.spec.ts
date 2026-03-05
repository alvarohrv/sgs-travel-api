import { Test, TestingModule } from '@nestjs/testing';
import { CotizacionController } from './cotizacion.controller';
import { CotizacionService } from './cotizacion.service';

describe('CotizacionController', () => {
  let controller: CotizacionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CotizacionController],
      providers: [CotizacionService],
    }).compile();

    controller = module.get<CotizacionController>(CotizacionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
