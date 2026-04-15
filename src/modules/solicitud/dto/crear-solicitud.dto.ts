import { detalle_vuelo_horario } from '@prisma/client';

export class RutaDto {
  origen: string;
  destino: string;
  preferencia_aerolinea?: string; // opcional: aerolínea preferida por el empleado
}

export class FechasDto {
  ida: string; // formato: "2026-03-10"
  vuelta?: string; // opcional para vuelos solo de ida
}

export class HorarioDto {
  ida?: detalle_vuelo_horario; // opcional // formato: "MANANA" | "TARDE" | "NOCHE" | "MADRUGADA"
  vuelta?: detalle_vuelo_horario; // opcional // formato: "MANANA" | "TARDE" | "NOCHE" | "MADRUGADA"
}

export class CrearSolicitudDto {
  @ApiProperty({
  description: 'Solicitud de vuelo de ida y vuelta o solo ida',
  example:{
      "tipo_de_vuelo": "IDA_Y_VUELTA",
      "ruta": {
        "origen": "Bogotá",
        "destino": "Medellín",
        "preferencia_aerolinea": "LATAM"
      },
      "fechas": {
        "ida": "2026-03-10",  
        "vuelta": "2026-03-20"
      }
    },
  format: 'json'
})
  tipo_de_vuelo: string; // "IDA_Y_VUELTA" | "SOLO_IDA"
  ruta: RutaDto;
  fechas: FechasDto;
  horario: HorarioDto;
}



