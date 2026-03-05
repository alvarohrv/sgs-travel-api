export class RutaDto {
  origen: string;
  destino: string;
}

export class FechasDto {
  ida: string; // formato: "2026-03-10"
  vuelta?: string; // opcional para vuelos solo de ida
}

export class CrearSolicitudDto {
  tipo_de_vuelo: string; // "IDA_Y_VUELTA" | "SOLO_IDA"
  ruta: RutaDto;
  fechas: FechasDto;
}
