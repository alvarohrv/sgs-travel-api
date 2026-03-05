import { Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit {

  constructor() {
    const databaseUrl = process.env.DATABASE_URL

    if (!databaseUrl) {
      throw new Error('DATABASE_URL no esta definida en las variables de entorno')
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
      console.error('❌ Error al conectar a la base de datos:', error.message);
      // No lanzamos el error para que el servidor siga prendido
    }
  }
}


