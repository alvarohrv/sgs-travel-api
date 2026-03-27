import { Body, Controller, Post, Request, UseGuards, SetMetadata } from '@nestjs/common'
import { LocalAuthGuard } from './guards/local-auth.guard'
import { ApiTags} from '@nestjs/swagger'
import { Throttle, SkipThrottle } from '@nestjs/throttler'

import { Public } from './decorators/public.decorator'
import { LoginDto } from './dto/login.dto'
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
