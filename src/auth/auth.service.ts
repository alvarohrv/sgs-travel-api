import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

import { UsuarioService } from '../modules/usuario/usuario.service'
import { JwtPayloadType, ResponseLoginJwt, PreJwtPayload } from './types/jwt-payload.type'

@Injectable()
export class AuthService {
  // nota: aca no se implementa Passport, aunque LocalStrategy llama a validateUser y login() aprovecha el req.user que Passport inyecta en el controlador.

  constructor(
    private readonly usuarioService: UsuarioService, // ← se inyecta
    private readonly jwtService: JwtService,
  ) {}

  // Valida credenciales para la estrategia local.
  async validateUser(username: string, password: string) { //estándar esperado//
    
    // metodo es usado en LocalStrategy (/auth/strategies/local.strategy.ts) para validar las credenciales del usuario. 
    const usuario = await this.usuarioService.obtenerUsuarioParaLogin(username)

    if (!usuario || usuario.disabled_at) { //usuario puede ser null o estar deshabilitado
      throw new UnauthorizedException('Credenciales invalidas')
    }

    const passwordValido = await this.usuarioService.compararPassword(
      password,
      usuario.password_hash,
    )

    if (!passwordValido) {
      throw new UnauthorizedException('Credenciales invalidas')
    }

    // Retornamos solo lo necesario para crear payload y responder al cliente. (sin pass)
    // Forma 1
    // const { password_hash, ...result } = usuario
    // return result 
    // Forma 2 (mas visual)
    const userPayload: PreJwtPayload = {
      id: usuario.id,
      username: usuario.username,
      rol: usuario.rol,
    }
    return userPayload
  }

  // Genera JWT con sub (id del usuario) y role (rol actual).
  // Siempre que el login sea exitoso (LocalAuthGuard sea exitoso), se retornará un token.
  async login(user: { id: number; username: string; rol: string }) {
    // user, en este caso es el objeto que viene de req.user, que es inyectado por Passport después de validar las credenciales con LocalStrategy. (no directamente de los servicios de UsuarioService).
    const payload: JwtPayloadType = {
      sub: user.id,
      role: user.rol,
    } // es buena práctica definir una interfaz 

    const token = this.jwtService.sign(payload) //<3
      // Esto segun la estrategia JWT (jwt.strategy.ts) se validará usando el secret definido en la configuración JWT (/config/jwt.config.ts)      

      /* JwtService no funciona solo. Necesita saber cuál es el secret para firmar el token y las opciones de expiración. Esta configuración se proporciona a través de JwtModule, que se registra en AuthModule mediante el JwtModule.registerAsync() que se le pasa una función useFactory para cargar la configuración de forma dinámica desde jwtConfig y que retorna un objeto de configuración (JwtModuleOptions) con el secret y las opciones de expiración Luego, JwtService utiliza esta configuración para generar el token JWT con el payload definido.*/
      
    const response: ResponseLoginJwt = {
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        user: { // opcional, pero es común retornar info del usuario
          id: user.id,
          username: user.username,
          role: user.rol,
        },
      },
    }

    return response
  }
}
