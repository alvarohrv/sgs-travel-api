import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { DemoPolicyResource } from './decorators/demo-policy.decorator'

@Injectable()
export class DemoPolicyService {
  private readonly limitsByResource: Record<DemoPolicyResource, number> = {
    solicitud: 5,
    cotizacion: 10,
    boleto: 15,
  }

  constructor(private readonly prisma: PrismaService) {}

  async assertCanCreate(resource: DemoPolicyResource, userId: number, role?: string) {
    if ((role ?? '').toUpperCase() !== 'DEMO') {
      return
    }

    const stats = await this.getOrCreateTodayStats(userId)
    const currentCount = this.getResourceCount(stats, resource)
    const limit = this.limitsByResource[resource]

    if (currentCount >= limit) {
      throw new ForbiddenException(
        `El usuario DEMO alcanzo su limite diario de ${limit} ${resource}s`,
      )
    }
  }

  async incrementUsage(resource: DemoPolicyResource, userId: number, role?: string) {
    if ((role ?? '').toUpperCase() !== 'DEMO') {
      return
    }

    const stats = await this.getOrCreateTodayStats(userId)
    const now = new Date()

    await this.prisma.estad_sticas_de_uso_demo.update({
      where: { user_id: userId },
      data: {
        solicitudes_creadas:
          resource === 'solicitud'
            ? this.toSafeCount(stats.solicitudes_creadas) + 1
            : stats.solicitudes_creadas,
        cotizaciones_creadas:
          resource === 'cotizacion'
            ? this.toSafeCount(stats.cotizaciones_creadas) + 1
            : stats.cotizaciones_creadas,
        boletos_creados:
          resource === 'boleto'
            ? this.toSafeCount(stats.boletos_creados) + 1
            : stats.boletos_creados,
        ultima_actualizacion: now,
      },
    })
  }

  async decrementUsage(resource: DemoPolicyResource, userId: number, role?: string) {
    if ((role ?? '').toUpperCase() !== 'DEMO') {
      return
    }

    const stats = await this.getOrCreateTodayStats(userId)
    const now = new Date()

    await this.prisma.estad_sticas_de_uso_demo.update({
      where: { user_id: userId },
      data: {
        solicitudes_creadas:
          resource === 'solicitud'
            ? Math.max(0, this.toSafeCount(stats.solicitudes_creadas) - 1)
            : stats.solicitudes_creadas,
        cotizaciones_creadas:
          resource === 'cotizacion'
            ? Math.max(0, this.toSafeCount(stats.cotizaciones_creadas) - 1)
            : stats.cotizaciones_creadas,
        boletos_creados:
          resource === 'boleto'
            ? Math.max(0, this.toSafeCount(stats.boletos_creados) - 1)
            : stats.boletos_creados,
        ultima_actualizacion: now,
      },
    })
  }

  async decrementUsageByAmount(
    resource: DemoPolicyResource,
    userId: number,
    amount: number,
    role?: string,
  ) {
    if ((role ?? '').toUpperCase() !== 'DEMO') {
      return
    }

    const normalizedAmount = Math.max(0, Math.floor(amount))

    if (normalizedAmount === 0) {
      return
    }

    const stats = await this.getOrCreateTodayStats(userId)
    const now = new Date()

    await this.prisma.estad_sticas_de_uso_demo.update({
      where: { user_id: userId },
      data: {
        solicitudes_creadas:
          resource === 'solicitud'
            ? Math.max(0, this.toSafeCount(stats.solicitudes_creadas) - normalizedAmount)
            : stats.solicitudes_creadas,
        cotizaciones_creadas:
          resource === 'cotizacion'
            ? Math.max(0, this.toSafeCount(stats.cotizaciones_creadas) - normalizedAmount)
            : stats.cotizaciones_creadas,
        boletos_creados:
          resource === 'boleto'
            ? Math.max(0, this.toSafeCount(stats.boletos_creados) - normalizedAmount)
            : stats.boletos_creados,
        ultima_actualizacion: now,
      },
    })
  }

  async assertSolicitudOwnershipIfDemo(
    solicitudId: number,
    userId: number,
    role?: string,
  ) {
    if ((role ?? '').toUpperCase() !== 'DEMO') {
      return
    }

    const solicitud = await this.prisma.solicitud.findUnique({
      where: { id: solicitudId },
      select: { usuario_id: true },
    })

    if (!solicitud) {
      throw new NotFoundException(`Solicitud con ID ${solicitudId} no encontrada`)
    }

    if (solicitud.usuario_id !== userId) {
      throw new ForbiddenException('El usuario DEMO solo puede operar solicitudes propias')
    }
  }

  async assertCotizacionOwnershipIfDemo(
    cotizacionId: number,
    userId: number,
    role?: string,
  ) {
    if ((role ?? '').toUpperCase() !== 'DEMO') {
      return
    }

    const cotizacion = await this.prisma.cotizacion.findUnique({
      where: { id: cotizacionId },
      select: { solicitud: { select: { usuario_id: true } } },
    })

    if (!cotizacion) {
      throw new NotFoundException(`Cotizacion con ID ${cotizacionId} no encontrada`)
    }

    if (cotizacion.solicitud.usuario_id !== userId) {
      throw new ForbiddenException('El usuario DEMO solo puede operar cotizaciones propias')
    }
  }

  async assertBoletoOwnershipIfDemo(boletoId: number, userId: number, role?: string) {
    if ((role ?? '').toUpperCase() !== 'DEMO') {
      return
    }

    const boleto = await this.prisma.boleto.findUnique({
      where: { id: boletoId },
      select: { cotizacion: { select: { solicitud: { select: { usuario_id: true } } } } },
    })

    if (!boleto) {
      throw new NotFoundException(`Boleto con ID ${boletoId} no encontrado`)
    }

    if (boleto.cotizacion.solicitud.usuario_id !== userId) {
      throw new ForbiddenException('El usuario DEMO solo puede operar boletos propios')
    }
  }

  private getResourceCount(
    stats: {
      solicitudes_creadas: number | null
      cotizaciones_creadas: number | null
      boletos_creados: number | null
    },
    resource: DemoPolicyResource,
  ): number {
    if (resource === 'solicitud') {
      return this.toSafeCount(stats.solicitudes_creadas)
    }

    if (resource === 'cotizacion') {
      return this.toSafeCount(stats.cotizaciones_creadas)
    }

    return this.toSafeCount(stats.boletos_creados)
  }

  private async getOrCreateTodayStats(userId: number) {
    const now = new Date()
    let stats = await this.prisma.estad_sticas_de_uso_demo.upsert({
      where: { user_id: userId },
      update: {},
      create: {
        user_id: userId,
        solicitudes_creadas: 0,
        cotizaciones_creadas: 0,
        boletos_creados: 0,
        ultima_actualizacion: now,
      },
    })

    if (!this.isSameDay(stats.ultima_actualizacion, now)) {
      stats = await this.prisma.estad_sticas_de_uso_demo.update({
        where: { user_id: userId },
        data: {
          solicitudes_creadas: 0,
          cotizaciones_creadas: 0,
          boletos_creados: 0,
          ultima_actualizacion: now,
        },
      })
    }

    return stats
  }

  private toSafeCount(value: number | null | undefined): number {
    return value ?? 0
  }

  private isSameDay(left: Date, right: Date): boolean {
    return (
      left.getFullYear() === right.getFullYear() &&
      left.getMonth() === right.getMonth() &&
      left.getDate() === right.getDate()
    )
  }
}
