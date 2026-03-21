// POST /solicitud/:id/cotizacion
// Body cuando es cotización nueva (cotizacion_anterior_id = null)
// Body cuando reemplaza una anterior (cotizacion_anterior_id = id de la anterior)

export class DetalleVueloDto {
  aerolinea?: string;          // ej: "Avianca", "Latam"
  fecha: string;               // formato: "2026-03-10" o "2026-03-10T14:30"
  vuelo: string;               // número de vuelo ej: "LA123"
  clase_tarifaria?: string;    // ej: "ECONOMY", "BUSINESS"
  politica_equipaje?: string;  // descripción libre
}

export class DetalleCotizacionDto {
  ida: DetalleVueloDto;
  vuelta?: DetalleVueloDto; // opcional para SOLO_IDA
}

export class RutaCotizacionDto {
  origen: string;
  destino: string;
}

export class CrearCotizacionDto {
  cotizacion_anterior_id: number | null; // null = nueva, número = reemplaza
  valor_total: number;
  moneda: string;
  cobertura: 'IDA' | 'IDA_Y_VUELTA' | 'RETORNO';
  ruta: RutaCotizacionDto;
  detalle?: DetalleCotizacionDto;
}
