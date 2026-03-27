import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Request } from 'express' // Permite Tipar correctamente la solicitud HTTP y acceder a sus propiedades, como request.user.
import { ROLES_KEY } from '../decorators/roles.decorator'

// Declaración de tipos globales en Express para extender la interfaz User y agregar la propiedad 'role' que no viene por defecto.
declare global { // Estará disponibles en todo el proyecto sin necesidad de importarlos.
  namespace Express { // Namespace para extender las interfaces de Express
    interface User { 
      role: string
    }
  }
}

//@SetMetadata('isPublic', true) 

@Injectable()
export class RolesGuard implements CanActivate {
  // Inyectamos el Reflector para poder acceder a los metadatos definidos por el decorador (sera @Roles) en los controladores o métodos.
  constructor(private readonly reflector: Reflector) {}

  //Metodo propio de la clase que se ejecuta antes de cada endpoint protegido para verificar si el usuario tiene el rol requerido.
  // ExecutionContext es un objeto que contiene información sobre la ejecución actual, como el request, response, handler, etc.
  // puede retornar tambien un Promise<boolean> o un Observable<boolean> si la verificación es asíncrona.
  // context es el contexto de ejecución que se pasa a este método, y se utiliza para obtener información sobre la solicitud actual, como el usuario autenticado y los roles requeridos. Viene de la interfaz CanActivate, es la Interfaz de NestJS para su sistema de guards.
  canActivate(context: ExecutionContext): boolean {
    
    // (1) ya no se aplica esta logica:::
    // const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
    //   context.getHandler(),
    //   context.getClass(),
    // ])
    // return isPublic ? true : false 


    
    // (2) -----  Ahora:
    // Obtenemos los 'roles' requeridos del metadato definido por el decorador @Roles.  
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    // requiredRoles es un array de strings con los roles requeridos o permitidos para acceder al endpoint. Si no se ha definido ningún rol, se permite el acceso (return true). Esto permite que el decorador @Roles sea opcional, y si no se usa, el guard no bloqueará el acceso.
    // ExecutionContext, Clase de NestJS con info de la petición
    // getAllAndOverride busca el metadato en el handler (método) y si no lo encuentra, lo busca en la clase (controlador). Esto permite definir roles a nivel de método o a nivel de controlador.
    // getHandler()	Método de NestJS para obtener el controlador/método que se está ejecutando
    // getClass()	Método de NestJS para obtener la clase actual del controlador que se está ejecutando
    // El orden de búsqueda es importante: primero se verifica el método, luego la clase.

    // se verifica si requiredRoles es undefined o un array vacío. Si no hay roles requeridos, se permite el acceso retornando true.
    if (!requiredRoles || requiredRoles.length === 0) {
      return true
    }

    // Pero, si hay roles requeridos, se obtiene el user autenticado de la solicitud (request.user) y se verifica si su rol coincide con alguno de los roles requeridos, estos vienen del token JWT.

    // Obtiene el objeto Request de HTTP, que contiene información sobre la solicitud actual, incluyendo el usuario autenticado (request.user) y otros datos relevantes.
    // switchToHttp()	Método nativo de ExecutionContext para obtener el contexto HTTP de la solicitud actual. Esto es necesario porque ExecutionContext puede ser utilizado en diferentes contextos (HTTP, WebSocket, RPC), y switchToHttp() asegura que estamos trabajando con una solicitud HTTP.
    const request = context.switchToHttp().getRequest<Request>()
    const user = request.user 
    // Obtiene el rol del usuario desde la propiedad 'role'
    const currentRole = user?.role

    // Si el usuario no tiene un rol definido, se deniega el acceso retornando false.
    if (!currentRole) {
      // return false
      // throw new Error('Usuario no tiene un rol definido. Acceso denegado.')
      throw new UnauthorizedException('Usuario no tiene permisos para el recurso. Acceso denegado.')
      // en lugar de un 403 Forbidden, se lanza una excepción de Unauthorized (401).
    }

    // Validación final: se verifica si el rol del usuario coincide con alguno de los roles requeridos para acceder al endpoint. 
    return requiredRoles.includes(currentRole)
  }
}

// request.headers['authorization']	Accede al encabezado de autorización de la solicitud HTTP, que generalmente contiene el token JWT. Este Guard se ejecuta después de que el JwtAuthGuard haya validado el token y haya extraído la información del usuario, incluyendo su rol. Por lo tanto, request.user debería estar disponible con los datos del usuario autenticado, incluyendo su rol.
