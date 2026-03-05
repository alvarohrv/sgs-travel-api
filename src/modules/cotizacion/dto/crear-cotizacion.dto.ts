// POST /solicitud/:id/cotizacion
// Body cuando es cotización nueva (cotizacion_anterior_id = null)
// Body cuando reemplaza una anterior (cotizacion_anterior_id = id de la anterior)

export class DetalleVueloDto {
  fecha: string;
  vuelo: string;
}

export class DetalleCotizacionDto {
  ida: DetalleVueloDto;
  vuelta?: DetalleVueloDto; // opcional para SOLO_IDA
}

export class CrearCotizacionDto {
  cotizacion_anterior_id: number | null; // null = nueva, número = reemplaza
  aerolinea: string;
  valor_total: number;
  moneda: string;
  cobertura: string; // "COMPLETA" | "SOLO_IDA"
  detalle?: DetalleCotizacionDto;
}
