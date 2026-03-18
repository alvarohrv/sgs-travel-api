export class EliminarSolicitudesUsuarioDto {
  confirmacion: string // debe enviarse exactamente "ELIMINAR_USUARIO"
  motivo?: string
  reiniciar_indices?: boolean
}
