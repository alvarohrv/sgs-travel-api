// POST /cotizacion/:id/seleccionar
// Empleado selecciona una cotización como opción primaria o secundaria
// Transición: COTIZACION_NUEVA → OPCION_PRIMARIA | OPCION_SECUNDARIA
// Efecto colateral: solicitud → PENDIENTE (pendiente de emisión de boleto)

export class SeleccionarCotizacionDto {
  preferencia: 'OPCION_PRIMARIA' | 'OPCION_SECUNDARIA';
}
