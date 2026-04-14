import { Body, Controller, Post, Request, UseGuards, SetMetadata } from '@nestjs/common'
import { LocalAuthGuard } from './guards/local-auth.guard'
import { ApiTags} from '@nestjs/swagger'
import { Throttle, SkipThrottle } from '@nestjs/throttler'

import { Public } from './decorators/public.decorator'
import { LoginDto } from './dto/login.dto'
import { RefreshTokenDto } from './dto/refresh-token.dto'
import { AuthService } from './auth.service'
import { PreJwtPayload } from './types/jwt-payload.type'


@ApiTags('auth')
@SkipThrottle({ 'heavy-load': true, 'normal-human': true , 'health': true }) //'restrictive': true,
// @Throttle({ 'restrictive': { ttl: 60000, limit: 4 } })  // no se personaliza
@Controller({
    path: 'auth',
    version: '1'
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

// 🛡️ TODOS los endpoints de aquí usarán 40 req/min  
  //@SetMetadata('isPublic', true) // Ahora se usará el decorador @Public (ver src/auth/decorators/public.decorator.ts) 
  @Public()
// @UseGuards(AuthGuard('local'))
  @UseGuards(LocalAuthGuard) // Este guard se encarga de validar las credenciales usando la estrategia local (username/password). Si la validación es exitosa, inyecta el usuario en req.user.
  @Post('login')
  async login(@Body() _body: LoginDto, @Request() req: any) {
    // Si LocalStrategy valida, Passport inyecta el usuario en req.user
    return this.authService.login(req.user as PreJwtPayload)
    // nota: req.user esta definido por Passport después de validar las credenciales con LocalStrategy, no se usa el modelo Usuario directamente.
  }
/*
DESCRIPCIÓN: Endpoint para iniciar sesión y obtener un JWT.
ENDPOINT: POST /auth/login
            Ej:  POST http://localhost:3000/api/v1/auth/login
BODY
{
    "username": "ar",
    "password": "ar"
}
RESPUESTA:
{
    "success": true,
    "message": "Login exitoso",
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc3MzUxNzkzMywiZXhwIjoxNzczNTIxNTMzfQ.R8fNXo0d8J0hWGKDxTOWPGEWrAfzA3AOgDDJ-83hx-o",
        "user": {
            "id": 3,
            "username": "ar",
            "role": "ADMIN"
        }
    }
}
    
*/

  @Post('logout')
  async logout(@Request() req: any) {
    const token = req.headers.authorization?.split(' ')[1]; // Extract token from Authorization header
    if (!token) {
      return { message: 'No token provided' };
    }

    await this.authService.invalidateToken(token);

    return { message: 'Logged out successfully' };
  }

  /*
    Descripción: Endpoint para cerrar sesión. En una implementación real, esto podría implicar invalidar el token JWT (por ejemplo, agregándolo a una lista negra) para que no pueda ser usado nuevamente.
    Endpoint: POST /auth/logout
    Ejemplo de uso:
    POST http://localhost:3000/api/v1/auth/logout
    Headers:
    Authorization: Bearer <token>
    Respuesta:
    {
        "message": "Logged out successfully"
    }
  */

  @Post('validate-token')
  async validateToken(@Request() req: any) {
    const token = req.headers.authorization?.split(' ')[1]; // Extract token from Authorization header
    if (!token) {
      return { valid: false, message: 'No token provided' };
    }

    const isInvalidated = this.authService.isTokenInvalidated(token);
    if (isInvalidated) {
      return { valid: false, message: 'Token is invalidated' };
    }

    return { valid: true, message: 'Token is valid' };
  }

  @Public()
  @Post('refresh')
  async refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refreshToken(body.refreshToken)
  }
}
/*
Descripción: Endpoint para validar un token JWT. Esto es útil para verificar si un token es válido o ha sido invalidado (por ejemplo, después de cerrar sesión).
Endpoint: POST /auth/validate-token 
Ejemplo de uso:
POST http://localhost:3000/api/v1/auth/validate-token
Headers:
Authorization: Bearer <token>
Respuesta:
{
    "valid": true,
    "message": "Token is valid"
}
o
{
    "valid": false,
    "message": "Token is invalidated"
}
*/  


