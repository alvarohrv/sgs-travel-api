
// archivos iniciales:
// import { Injectable } from '@nestjs/common';
// @Injectable()
// export class SolicitudService {}

import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CrearSolicitudDto } from './dto/crear-solicitud.dto'

@Injectable()
export class SolicitudService {
  constructor(private prisma: PrismaService) {}

  async crearSolicitud(data: CrearSolicitudDto) {
    return this.prisma.solicitud.create({
      data: {
        usuario_id: BigInt(data.usuario_id), // Convertimos a BigInt para MySQL
        estado_actual_id: BigInt(data.estado_id), // Ajusté el nombre según tu schema previo
        tipo_de_vuelo: data.tipo_de_vuelo,
      }
    });
  }

  async obtenerSolicitudes() {
    return this.prisma.solicitud.findMany({
      include: {
        usuario: true, // Esto es como un "JOIN" en SQL, trae los datos del usuario
        estado_solicitud: true, // Trae la info del estado
      }
    });
  }

  // Método para buscar por ID único
  async buscarPorId(id: string) {
    const solicitud = await this.prisma.solicitud.findUnique({
      where: { id: BigInt(id) },
      include: {
        usuario: true,
        cotizacion: true, // Trae también sus cotizaciones
      }
    });
    if (!solicitud) {
      throw new NotFoundException(`La solicitud con ID ${id} no existe`);
    }
    return solicitud;
  }

}
