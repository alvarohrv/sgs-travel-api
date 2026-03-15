import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common'
import { AuthService } from './auth.service'
import { Public } from './decorators/public.decorator'
import { LoginDto } from './dto/login.dto'
import { LocalAuthGuard } from './guards/local-auth.guard'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Body() _body: LoginDto, @Request() req: any) {
    // Si LocalStrategy valida, Passport inyecta el usuario en req.user.
    return this.authService.login(req.user)
  }
}
/*
DESCRIPCIÓN: Endpoint para iniciar sesión y obtener un JWT.
ENDPOINT: POST /auth/login
            Ej:  POST http://localhost:3000/auth/login
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
