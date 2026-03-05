import 'dotenv/config'; // Carga las variables de entorno desde el archivo .env
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
//   await app.listen(process.env.PORT ?? 3000);
// }

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000); 
  console.log(`🚀 Servidor corriendo en: ${await app.getUrl()}`);
}

bootstrap();



