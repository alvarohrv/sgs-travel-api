import { Body, Controller, Param, Patch, Post } from '@nestjs/common'
import { UsuarioService } from './usuario.service'
import { CambiarRolUsuarioDto } from './dto/cambiar-rol-usuario.dto'
import { CrearUsuarioDto } from './dto/crear-usuario.dto'

@Controller('usuario')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Post()
  async crearUsuario(@Body() data: CrearUsuarioDto) {
    return this.usuarioService.crearUsuario(data)
  }
  /*
  @Pos
  DESCRIPCIÓN: Endpoint para crear un nuevo usuario.
  ENDPOINT: POST /usuario
              Ej:  POST http://localhost:3000/usuario
  BODY   
  {
    "numero_documento": "123456789",
    "cod_empleado": "AR-2026-0001",
    "nombre": "Alvarex",
    "correo": "alv-demo@gmail.com",
    "username": "ar",
    "password": "ar"
  }
  RESPUESTA
  {
      "success": true,
      "message": "Usuario registrado correctamente",
      "data": {
          "usuario": {
              "id": 3,
              "numero_documento": "123456789",
              "cod_empleado": "AR-2026-0001",
              "nombre": "Alvarex",
              "correo": "alv-demo@gmail.com",
              "username": "ar",
              "rol": "SOLICITANTE",
              "created_at": "2026-03-14T15:18:04.000Z"
          }
      }
  }

*/

  @Patch(':id/rol')
  async cambiarRol(
    @Param('id') id: string,
    @Body() data: CambiarRolUsuarioDto,
  ) {
    return this.usuarioService.cambiarRol(Number(id), data)
  }
}
/*
  DESCRIPCIÓN: Endpoint para cambiar el rol de un usuario.
  ENDPOINT: PATCH /usuario/:id/rol
              Ej:  PATCH http://localhost:3000/usuario/3/rol
  BODY
  {
    "rol": "ADMIN"
  }
  RESPUESTA
  {
      "success": true,
      "message": "Rol del usuario actualizado correctamente",
      "data": {
          "usuario": {
              "id": 3,
              "rol": "ADMIN"
          }
      }
  }
*/
