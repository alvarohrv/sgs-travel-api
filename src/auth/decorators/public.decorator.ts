import { SetMetadata } from '@nestjs/common'

// Esta metadata se usara luego en un guard global para saltar autenticacion en rutas publicas.
export const IS_PUBLIC_KEY = 'isPublic'
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
