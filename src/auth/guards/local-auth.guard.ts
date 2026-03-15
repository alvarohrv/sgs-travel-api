import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

// Wrapper para no repetir AuthGuard('local') en todos los controladores.
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
