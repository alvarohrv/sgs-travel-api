import { SetMetadata } from '@nestjs/common'
import { Rol } from '../types/rol.enum'


export const ROLES_KEY = 'roles'
// export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles)
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES_KEY, roles)




// El decorador @Roles() es una función que utiliza el decorador SetMetadata() de NestJS para asociar un array de roles (strings) con un controlador o método específico.

//  El guard RolesGuard luego leerá este metadato para verificar si el usuario autenticado tiene el rol requerido para acceder al recurso protegido.
