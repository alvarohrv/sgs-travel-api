export class EliminarTodasSolicitudesDto {
  confirmacion: string; // debe enviarse exactamente "ELIMINAR_TODAS"
  motivo?: string; // opcional: deja trazabilidad funcional del borrado masivo
  reiniciar_indices?: boolean; // opcional: reinicia AUTO_INCREMENT si las tablas quedan vacías
}