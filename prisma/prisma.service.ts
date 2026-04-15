import { Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit {

    //antes//
  // constructor() {
  //   const databaseUrl = process.env.DATABASE_URL
  // ahora//
  constructor(private readonly configService: ConfigService) {
    const databaseUrl = configService.get<string>('database.url')
    // La prioridad por entorno se define en database.config.ts. (ver ese archivo para más detalles).

    if (!databaseUrl) {
      throw new Error('No se encontró URL de base de datos. Define DATABASE_URL (local) o MYSQL_URL (production).')
    }

    super({
      adapter: new PrismaMariaDb(databaseUrl),
    })
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


