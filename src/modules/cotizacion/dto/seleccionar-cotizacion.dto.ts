// POST /solicitud/:solicitudId/seleccionar-cotizacion
// Empleado selecciona una cotización primaria y opcionalmente una secundaria
// Transición: cotización → OPCION_PRIMARIA | OPCION_SECUNDARIA | COTIZACION_DESCARTADA
// Efecto colateral: solicitud → EN_REVISION

// export class SeleccionarCotizacionDto {
//   cotizacion_primaria_id: number;
//   cotizacion_secundaria_id?: number;
//   comentario?: string;
// }

export class SeleccionarCotizacionDto {
  cotizacion_primaria_id: number;
  cotizacion_secundaria_id?: number; // opcional, solo si el empleado quiere marcar una segunda opción
  comentario?: string; // opcional, para que el empleado deje una nota sobre su elección
}

