import { Test, TestingModule } from '@nestjs/testing';
import { CotizacionService } from './cotizacion.service';

describe('CotizacionService', () => {
  let service: CotizacionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CotizacionService],
    }).compile();

    service = module.get<CotizacionService>(CotizacionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
