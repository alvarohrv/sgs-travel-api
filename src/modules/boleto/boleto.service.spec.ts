import { Test, TestingModule } from '@nestjs/testing';
import { BoletoService } from './boleto.service';

describe('BoletoService', () => {
  let service: BoletoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BoletoService],
    }).compile();

    service = module.get<BoletoService>(BoletoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
