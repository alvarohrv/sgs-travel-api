// import { Controller } from '@nestjs/common';
// import { SolicitudService } from './solicitud.service';

// @Controller('solicitud')
// export class SolicitudController {
//   constructor(private readonly solicitudService: SolicitudService) {}
// }


/*
TEORIA:
Conceptos clave: decoradores, módulos y la inyección de dependencias.

¿Qué son los @decoradores?
Un decorador es una función que empieza con @ y se pega encima de una clase o método para agregarle comportamiento sin modificar su código interno.


¿Qué es @nestjs/common?
Es el paquete central de NestJS del que importas las herramientas más usadas. 
Controller - Marca una clase como controlador (maneja rutas HTTP)
Get - Indica que un método responde a GET /ruta
Post - Indica que un método responde a POST /ruta
Body - Extrae el cuerpo (body) de la petición HTTP

NestJS utiliza un paradigma llamado Programación Orientada a Aspectos y se apoya mucho en los Decoradores.
Decorador: agregar comportamiento sin tocar el código.
Un decorador no sobreescribe nada. Lo que hace es envolver una función o clase para agregarle algo extra por fuera, sin modificarla internamente.
@Controller('solicitudes')  // "Esta clase maneja rutas que empiezan con /solicitudes"
@Post()                    // "Este método responde a POST /solicitudes"
@Get()                     // "Este método responde a GET /solicitudes"
Por ejemplo, el decorador @get() ya valida el 'REQUEST_METHOD', si el requerimiento esta vacio ('/') o envia un 'id', etc.
Algo como:
app.get('/solicitudes', (req, res) => {
    const resultado = solicitudController.obtenerSolicitudes()
    res.json(resultado)
})

DTO significa Data Transfer Object. Es una clase que define la forma exacta que deben tener los datos que llegan en el body. Si el cliente manda campos de más o de menos, el DTO lo controla.
Es el equivalente a validar de forma estructurada y con tipos de TypeScript.


*/

import { Body, Controller, Get, Post } from '@nestjs/common'
import { SolicitudService } from './solicitud.service'
import { CrearSolicitudDto } from './dto/crear-solicitud.dto'

@Controller('solicitud') 
export class SolicitudController {

  //  inyección de dependencias desde el constructor <3
  // 'private'permitira el uso de this
  constructor(private solicitudService: SolicitudService) {}


  @Post()
  crearSolicitud(@Body() data: CrearSolicitudDto) {
    return this.solicitudService.crearSolicitud(data)
    //// Extrae el cuerpo de la petición (JSON) y lo guarda en la variable 'data'.
  }


//@Get() sin argumento responde a la raíz del controlador, es decir /solicitud pero para nuestro caso tendra el mismo comportamiento "solicitud/todas"
  @Get() // Responde a /solicitud
  @Get("/todas") // Responde a /solicitud/todas
  obtenerSolicitudes() {
    return this.solicitudService.obtenerSolicitudes()
    //si se devuelve un objeto o array, él le pone el header 'Content-Type: application/json' y lo envía.
  }
}

// Rutas DINAMICAS - el orden importa - 

// Por parámetro de ruta → GET /solicitudes/5
@Get(':id') 
obtenerSolicitud(@Param('id') id: string) {
    return this.solicitudService.buscarPorId(id)
}

// Por query string → GET /solicitudes?id=5
@Get()
obtenerSolicitudes(@Query('id') id: string) {
    return this.solicitudService.buscarPorId(id)
}





/*
El flujo completo del código

Cliente HTTP (Postman, frontend)
        │
        │  POST /solicitudes  { ...datos... }
        ▼
@Controller('solicitudes')         ← define la ruta base
  @Post() crearSolicitud()         ← captura POST /solicitudes
    @Body() data                   ← extrae el body de la petición
        │
        ▼
  SolicitudService.crearSolicitud(data)   ← delega la lógica al servicio
        │
        ▼
  Respuesta al cliente


*/