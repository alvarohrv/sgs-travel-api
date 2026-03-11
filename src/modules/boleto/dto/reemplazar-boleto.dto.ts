export class SegmentoBoletoDto {
  tipo_segmento: 'IDA' | 'VUELTA' | 'ESCALA'
  aerolinea?: string
  codigo_reserva?: string
  numero_tiquete?: string
  numero_vuelo: string
  fecha_vuelo: string
  fecha_compra?: string
  clase_tarifaria?: string
  politica_equipaje?: string
  url_archivo_adjunto?: string
}

export class ReemplazarBoletoDto {
  cobertura: string;
  valor_final?: number;
  comentario?: string;
  segmentos: SegmentoBoletoDto[];
}

