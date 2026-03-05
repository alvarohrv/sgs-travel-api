// POST /cotizacion/:id/rechazar
// Empleado rechaza una cotización (comentario obligatorio)
// Transición: COTIZACION_NUEVA → COTIZACION_RECHAZADA
// Efecto colateral: solicitud → EN_REVISION

export class RechazarCotizacionDto {
  comentario: string; // obligatorio
}
