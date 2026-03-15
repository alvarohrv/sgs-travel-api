import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

// Wrapper para no repetir AuthGuard('jwt') en cada endpoint protegido.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
