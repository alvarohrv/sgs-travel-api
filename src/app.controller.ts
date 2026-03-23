import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { Public } from './auth/decorators/public.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
// import { Injectable } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health')
@Controller({ path: '', version: VERSION_NEUTRAL }) // Este controlador no tiene versión
export class AppController {

  constructor(private readonly prismaService: PrismaService) {}
  


  @Get('health')
  @SkipThrottle({ 'restrictive': true, 'heavy-load': true, 'normal-human': true }) //health: true
  // @Throttle({ 'health': { ttl: 60000, limit: 60 }) // 🛡️ TODOS los endpoints de aquí usarán 60 req/min
  // Usata la estrategia 'health' definida en AppModule para este endpoint específico  
  @Public() // Este endpoint es público, no requiere autenticación
  @ApiOperation({ summary: 'Verificar estado del servicio' })
  @ApiResponse({ status: 200, description: 'Servicio funcionando correctamente' })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: this.checkDatabase(),
        //redis: this.checkRedis(),
        // etc.
      }
    };
  }

  checkDatabase() {
    return this.prismaService
      .$queryRaw`SELECT 1`
      .then(() => ({ status: 'connected' }))
      .catch(() => ({ status: 'disconnected' }));
  }
}

/*
DESCRIPCIÓN: Endpoint público para verificar que la API está funcionando correctamente. No requiere autenticación.
ENDPOINT: GET /health
  Ej:  GET http://localhost:3000/api/v1/health
RESPUESTA:
{
    "status": "ok",
    "timestamp": "2026-03-14T15:18:04.000Z"
}
*/