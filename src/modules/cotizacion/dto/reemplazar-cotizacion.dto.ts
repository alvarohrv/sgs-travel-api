export class DetalleVueloReemplazoDto {
  aerolinea?: string;          // ej: "Avianca", "Latam"
  fecha: string;               // formato: "2026-03-10" o "2026-03-10T14:30"
  vuelo: string;               // número de vuelo ej: "LA123"
  clase_tarifaria?: string;    // ej: "ECONOMY", "BUSINESS"
  politica_equipaje?: string;  // descripción libre
}

export class DetalleReemplazoCotizacionDto {
  ida: DetalleVueloReemplazoDto;
  vuelta?: DetalleVueloReemplazoDto; // opcional para SOLO_IDA
}

export class RutaReemplazoCotizacionDto {
  origen: string;
  destino: string;
}

export class ReemplazarCotizacionDto {
  valor_total: number;
  moneda: string;
  cobertura: 'IDA' | 'IDA_Y_VUELTA' | 'RETORNO';
  ruta: RutaReemplazoCotizacionDto;
  detalle?: DetalleReemplazoCotizacionDto;
}