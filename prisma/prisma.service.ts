import { Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {
    const databaseUrl = configService.get<string>('database.url')

    if (!databaseUrl) {
      throw new Error('No se encontró URL de base de datos. Define DATABASE_URL.')
    }

   super()
  }
  async onModuleInit() {
    // Esto conecta a la base de datos cuando el módulo se inicia
    try {
      await this.$connect();
      console.log('✅ Base de datos conectada correctamente.');
    } catch (error) {
      console.error('❌ Error al conectar a la base de datos:', error instanceof Error ? error.message : String(error));
      // No lanzamos el error para que el servidor siga prendido
    }
  }
}
