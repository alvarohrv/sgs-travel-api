import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { UsuarioModule } from '../modules/usuario/usuario.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { DemoPolicyService } from './demo-policy.service'
import { DemoPolicyGuard } from './guards/demo-policy.guard'
import { RolesGuard } from './guards/roles.guard'
import { JwtStrategy } from './strategies/jwt.strategy'
import { LocalStrategy } from './strategies/local.strategy'

@Module({
  imports: [
    UsuarioModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: '1h',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    RolesGuard,
    DemoPolicyService,
    DemoPolicyGuard,
  ],
  exports: [AuthService, RolesGuard, DemoPolicyService, DemoPolicyGuard],
})
export class AuthModule {}
