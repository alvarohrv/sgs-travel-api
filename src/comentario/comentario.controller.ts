import { Controller } from '@nestjs/common';
import { ComentarioService } from './comentario.service';

@Controller('comentario')
export class ComentarioController {
  constructor(private readonly comentarioService: ComentarioService) {}
}
