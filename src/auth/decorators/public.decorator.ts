import { SetMetadata } from '@nestjs/common'

// Esta metadata se usara luego en un guard global para saltar autenticacion en rutas publicas.
export const IS_PUBLIC_KEY = 'isPublic'
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)

/*
Es mejor usar un decorador específico como @Public() en lugar de @SetMetadata('isPublic', true) directamente en los controladores, porque:
1. Claridad y Semántica: Un decorador específico como @Public() es más claro y semántico. 
2. Reutilización y Mantenimiento: Usar un decorador específico permite centralizar la lógica relacionada con la configuración de endpoints públicos.
3. Consistencia: Usar un decorador específico ayuda a mantener una consistencia en el código. Todos los endpoints públicos se marcarán de la misma manera, lo que facilita su identificación y gestión.
4. Abstracción: El decorador @Public() abstrae la implementación interna de cómo se marca un endpoint como público. Esto permite que los desarrolladores usen el decorador sin preocuparse por los detalles de la implementación, lo que mejora la experiencia de desarrollo y reduce la posibilidad de errores.
*/
