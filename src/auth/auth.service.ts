// src/auth/auth.service.ts
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common' //Inject es nuevo// Para inyectar la configuración JWT
import type { ConfigType } from '@nestjs/config' //nuevo//  Para tipar la configuración inyectada
import { Prisma } from '@prisma/client' //nuevo// Para tipar transacciones con Prisma
import { createHash } from 'crypto' //token hashing
import { JwtService } from '@nestjs/jwt'

import jwtConfig from './config/jwt.config' //nuevo// Importamos la configuración JWT para usar el secret y expiración de refresh tokens
import { PrismaService } from '../../prisma/prisma.service' //nuevo //Prima para la gestión de sesiones de refresh token
import { UsuarioService } from '../modules/usuario/usuario.service'
import {
  JwtPayloadType,
  PreJwtPayload,
  RefreshJwtPayloadType, //Para diferenciar el payload del refresh token
  ResponseLoginJwt, 
  ResponseRefreshJwt, // Respuesta tipada para el endpoint de refresh token
} from './types/jwt-payload.type'

@Injectable()
export class AuthService {
  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    @Inject(jwtConfig.KEY) // Para uso del secret y expiración de refresh tokens desde la configuración inyectada
    private readonly config: ConfigType<typeof jwtConfig>,
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
    }

    const token = this.jwtService.sign(payload)
    const refreshToken = await this.revokeAndCreateRefreshToken(
      user.id,
      user.rol,
    )

    const response: ResponseLoginJwt = {
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        refreshToken, //nuevo: se incluye el refresh token en la respuesta del login
        user: { // opcional, pero es común retornar info del usuario
          id: user.id,
          username: user.username,
          role: user.rol,
        },
      },
    }
    return response
  }


  

  // Lista negra con timestamps para limpiar tokens automáticamente
  private tokenBlacklist: Map<string, number> = new Map()

  /**
   * Invalida un token añadiéndolo a la lista negra con un timestamp.
   * @param token El token JWT a invalidar.
   */
  async invalidateToken(token: string): Promise<void> {
    const now = Date.now()
    this.tokenBlacklist.set(token, now)
    this.cleanupBlacklist() // Limpia tokens expirados al añadir uno nuevo
  }

  /**
   * Verifica si un token está en la lista negra.
   * @param token El token JWT a verificar.
   * @returns true si el token está invalidado, false en caso contrario.
   */
  isTokenInvalidated(token: string): boolean {
    this.cleanupBlacklist() // Limpia tokens expirados antes de verificar
    return this.tokenBlacklist.has(token)
  }

  /**
   * Limpia tokens de la lista negra que hayan expirado (más de 2 horas).
   */
  private cleanupBlacklist(): void {
    const now = Date.now()
    const twoHours = 2 * 60 * 60 * 1000 // 2 horas en milisegundos

    for (const [token, timestamp] of this.tokenBlacklist.entries()) {
      if (now - timestamp > twoHours) {
        this.tokenBlacklist.delete(token)
      }
    }
  }
}
