import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UsuarioService } from '../modules/usuario/usuario.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly jwtService: JwtService,
  ) {}

  // Valida credenciales para la estrategia local.
  async validateUser(username: string, password: string) {
    const usuario = await this.usuarioService.obtenerUsuarioParaLogin(username)

    if (!usuario || usuario.disabled_at) {
      throw new UnauthorizedException('Credenciales invalidas')
    }

    const passwordValido = await this.usuarioService.compararPassword(
      password,
      usuario.password_hash,
    )

    if (!passwordValido) {
      throw new UnauthorizedException('Credenciales invalidas')
    }

    // Retornamos solo lo necesario para crear payload y responder al cliente.
    return {
      id: usuario.id,
      username: usuario.username,
      rol: usuario.rol,
    }
  }

  // Genera JWT con sub (id del usuario) y role (rol actual).
  async login(user: { id: number; username: string; rol: string }) {
    const payload = {
      sub: user.id,
      role: user.rol,
    }

    const token = this.jwtService.sign(payload)

    return {
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.rol,
        },
      },
    }
  }
}
