export class EliminarSolicitudDto {
  confirmacion: string; // debe enviarse exactamente "ELIMINAR"
  motivo?: string; // opcional: deja trazabilidad funcional del borrado
}