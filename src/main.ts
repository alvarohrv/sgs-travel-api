import 'dotenv/config'; // Carga las variables de entorno desde el archivo .env
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
//   await app.listen(process.env.PORT ?? 3000);
// }

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  
 // Habilitar versionado URI
  app.enableVersioning({
    type: VersioningType.URI, // identificar la versión en las peticiones por la URI
                              // genera el '/v'+ version, automáticamente
    defaultVersion: '1',  // Versión por defecto
  });

  // Configurar un prefijo global para la 'api'
  // Y excluir rutas específicas del versionado
  app.setGlobalPrefix('api', {
    exclude: ['health']  // ← Rutas que no tendrán versión
  });
  
  // Configuración de Swagger:
  const config = new DocumentBuilder()
    .setTitle('SGS Travel API')
    //.setDescription('Documentación de la API para el sistema de gestión de viajes')
    .setVersion('1.0')
    .addBearerAuth()
    .setDescription(`
  ## Documentación de la API para el sistema de gestión de viajes

  #### 🔐 Credenciales de demostración
  | Rol | Username | Contraseña |
  |---|---|---|
  | **Demo** | usuario_demo | usuario_demo |

  > 💡 Puedes usar estas credenciales para probar los endpoints protegidos
  ## Notas importantes
  - Usa el endpoint de login para obtener un token JWT y acceder a los endpoints protegidos
  - La documentación pdf también está disponible en la ruta /docs/pdf
  - Hay límites en la creación de recursos.
  - Hay límites de tasa. Si excedes estos límites, recibirás un error 429 Too Many Requests. Por favor, ten esto en cuenta al probar la API.
  `)
  .build();

  const document = SwaggerModule.createDocument(app, config);
  // SwaggerModule.setup('docs', app, document);
  SwaggerModule.setup('docs', app, document, {
    // funcion utiliza la capacidad de OpenAPI para extensiones personalizadas (x-*)
    /*
    operationsSorter es una opción nativa de Swagger UI (no de NestJS)
    x-order es una extensión OpenAPI que puedes agregar a tus operaciones
    ApiExtension es un decorador nativo de @nestjs/swagger que permite agregar estas extensiones
    */
    swaggerOptions: {
      operationsSorter: (a: any, b: any) => { //1
        // Ordenar por método HTTP
        const methodOrder: Record<string, number> = {
          get: 1,
          post: 2,
          put: 3,
          patch: 4,
          delete: 5,
          options: 6,
          head: 7,
        };
        const methodA = String(a.get('method') ?? '').toLowerCase();
        const methodB = String(b.get('method') ?? '').toLowerCase();
        const byMethod = (methodOrder[methodA] ?? 99) - (methodOrder[methodB] ?? 99);
        if (byMethod !== 0) return byMethod;
        // Ordenar por x-order personalizado
        const orderA = Number(a.get('operation')?.get('x-order') ?? Number.MAX_SAFE_INTEGER);
        const orderB = Number(b.get('operation')?.get('x-order') ?? Number.MAX_SAFE_INTEGER);
        const byOrder = orderA - orderB;
        if (byOrder !== 0) return byOrder;
        // Ordenar alfabéticamente por path
        return String(a.get('path') ?? '').localeCompare(String(b.get('path') ?? ''));
      },
      tagsSorter: (a: string, b: string) => {  //2
        const tagOrder: Record<string, number> = {
          Health: 1,
          auth: 2,
          solicitud: 3,
          cotizacion: 4,
          boleto: 5,
          usuario: 6,
        };
        return (tagOrder[a] ?? 99) - (tagOrder[b] ?? 99);
      },
    },
  });
  /*
  nota: en \nest-cli.json se habilito un plugin para que al generar archivos con el CLI de NestJS, se apliquen automáticamente decoradores de Swagger (como @ApiProperty) y de class-validator (como @IsString) en los DTOs, entidades, etc.
  */


  app.enableCors(); // Habilitar CORS para permitir solicitudes desde el frontend (ajustar configuración según sea necesario) // CERRAR A LA APP EN REACT !!!
  //await app.listen(3000); 
  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Servidor corriendo en: ${await app.getUrl()}`);
}

bootstrap();


