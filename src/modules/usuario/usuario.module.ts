import { Module } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { UsuarioController } from './usuario.controller';

@Module({
  controllers: [UsuarioController],
  providers: [UsuarioService],
  exports: [UsuarioService], // Se ecporta directamente el servicio para que pueda ser inyectado en AuthService sin necesidad de importar el módulo completo.
})
export class UsuarioModule {}
