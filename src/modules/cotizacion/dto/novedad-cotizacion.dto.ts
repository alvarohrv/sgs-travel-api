// POST /cotizacion/:id/novedad
// Empleado o Admin reportan novedad en una cotización (comentario obligatorio)
// Transición: * → NOVEDAD
// Efecto colateral: solicitud → NOVEDAD

export class NovedadCotizacionDto {
  comentario: string; // obligatorio
}
