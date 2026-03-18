import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/decorators/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
/*
DESCRIPCIÓN: Endpoint público para verificar que la API está funcionando correctamente. No requiere autenticación.
ENDPOINT: GET /health
RESPUESTA:
{
    "status": "ok",
    "timestamp": "2026-03-14T15:18:04.000Z"
}
*/