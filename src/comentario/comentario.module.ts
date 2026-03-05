import { Module } from '@nestjs/common';
import { ComentarioService } from './comentario.service';
import { ComentarioController } from './comentario.controller';

@Module({
  controllers: [ComentarioController],
  providers: [ComentarioService],
})
export class ComentarioModule {}
