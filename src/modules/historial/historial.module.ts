import { Module } from '@nestjs/common';
import { HistorialService } from './historial.service';

@Module({
  providers: [HistorialService]
})
export class HistorialModule {}
