export type RolUsuario = 'SOLICITANTE' | 'ADMIN'

export class CambiarRolUsuarioDto {
  rol: RolUsuario
}
