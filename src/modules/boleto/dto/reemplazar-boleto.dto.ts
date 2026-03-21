export class SegmentoBoletoDto {
  tipo_segmento: 'IDA' | 'VUELTA'
  estado?: string
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

export class RutaBoletoDto {
  origen: string
  destino: string
}

export class ReemplazarBoletoDto {
  cobertura: string
  ruta: RutaBoletoDto
  valor_final?: number
  comentario?: string
  segmentos: SegmentoBoletoDto[]
}

