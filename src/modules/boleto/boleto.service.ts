import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { DemoPolicyService } from '../../auth/demo-policy.service';
import { EmitirBoletoDto } from './dto/emitir-boleto.dto';
import { NovedadBoletoDto } from './dto/novedad-boleto.dto';
import { ConservarBoletoDto } from './dto/conservar-boleto.dto';
import { ConfirmarBoletoDto } from './dto/confirmar-boleto.dto';
import { ReemplazarBoletoDto } from './dto/reemplazar-boleto.dto';
import { boleto, cotizacion, estado_boleto } from '@prisma/client';

const COBERTURAS_BOLETO_VALIDAS = ['IDA', 'IDA_Y_VUELTA', 'RETORNO'] as const;

@Injectable()
export class BoletoService {
	constructor(
		private prisma: PrismaService,
		private readonly demoPolicyService: DemoPolicyService,
	) {}

	private normalizarTextoRuta(valor: string): string {
		return valor
			.trim()
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
	}

	async emitirBoleto(cotizacionId: number, usuarioId: number, data: EmitirBoletoDto, userRole?: string) {
		await this.demoPolicyService.assertCotizacionOwnershipIfDemo(
			cotizacionId,
			usuarioId,
			userRole,
		)
		await this.demoPolicyService.assertCanCreate('boleto', usuarioId, userRole)

		if (!data.cobertura || data.cobertura.trim() === '') {
			throw new BadRequestException('La cobertura es obligatoria para emitir el boleto');
		}

		if (!Array.isArray(data.segmentos) || data.segmentos.length === 0) {
			throw new BadRequestException('Debe enviar al menos un segmento de vuelo');
		}

		if (!COBERTURAS_BOLETO_VALIDAS.includes(data.cobertura as (typeof COBERTURAS_BOLETO_VALIDAS)[number])) {
			throw new BadRequestException('La cobertura enviada no es válida. Valores permitidos: IDA, IDA_Y_VUELTA, RETORNO');
		}

		const tiposSegmento = data.segmentos.map((segmento) => segmento.tipo_segmento);
		const totalIda = tiposSegmento.filter((tipo) => tipo === 'IDA').length;
		const totalVuelta = tiposSegmento.filter((tipo) => tipo === 'VUELTA').length;

		if (data.cobertura === 'IDA_Y_VUELTA') {
			const estructuraValida = data.segmentos.length === 2 && totalIda === 1 && totalVuelta === 1;
			if (!estructuraValida) {
				throw new BadRequestException(
					'Para cobertura IDA_Y_VUELTA debe enviar exactamente dos segmentos: uno IDA y uno VUELTA',
				);
			}
		}

		if (data.cobertura === 'IDA' || data.cobertura === 'RETORNO') {
			const estructuraValida = data.segmentos.length === 1 && totalIda === 1;
			if (!estructuraValida) {
				throw new BadRequestException(
					`Para cobertura ${data.cobertura} debe enviar un solo segmento con tipo_segmento IDA`,
				);
			}
		}

		if (!data.ruta?.origen?.trim() || !data.ruta?.destino?.trim()) {
			throw new BadRequestException('La ruta es obligatoria para emitir el boleto y debe incluir origen y destino');
		}

		const cotizacion = await this.prisma.cotizacion.findUnique({
			where: { id: cotizacionId },
			include: {
				estado_cotizacion: true,
				solicitud: {
					include: {
						detalle_vuelo_solicitud: {
							select: {
								origen: true,
								destino: true,
							},
							take: 1,
							orderBy: { created_at: 'desc' },
						},
						cotizacion: {
							include: { estado_cotizacion: true },
						},
					},
				},
			},
		});

		if (!cotizacion) {
			throw new NotFoundException(`Cotizacion con ID ${cotizacionId} no encontrada`);
		}

		const estadosCotizacionNoEmitibles = [
			'cotizacion_seleccionada',
			'cotizacion_anulada',
			'cotizacion_rechazada',
			'novedad',
		]

		if (estadosCotizacionNoEmitibles.includes(cotizacion.estado_cotizacion.slug)) {
			throw new BadRequestException(
				`No se puede emitir boleto para una cotización en estado ${cotizacion.estado_cotizacion.estado}`,
			)
		}

		if (data.cobertura !== cotizacion.solicitud.tipo_de_vuelo) {
			throw new BadRequestException(
				`La cobertura del boleto debe coincidir con la solicitud (${cotizacion.solicitud.tipo_de_vuelo})`,
			)
		}

		const detalleSolicitud = cotizacion.solicitud.detalle_vuelo_solicitud?.[0]
		if (!detalleSolicitud) {
			throw new BadRequestException('La solicitud no tiene detalle de vuelo (origen/destino). Debe corregir o generar una nueva solicitud.');
		}

		const origenSolicitud = this.normalizarTextoRuta(detalleSolicitud.origen)
		const destinoSolicitud = this.normalizarTextoRuta(detalleSolicitud.destino)
		const origenBoleto = this.normalizarTextoRuta(data.ruta.origen)
		const destinoBoleto = this.normalizarTextoRuta(data.ruta.destino)

		const rutaCoincide = origenBoleto === origenSolicitud && destinoBoleto === destinoSolicitud
		if (!rutaCoincide) {
			throw new BadRequestException(
				`La ruta enviada no coincide con la solicitud. Ruta esperada: ${detalleSolicitud.origen} -> ${detalleSolicitud.destino}. Debe corregir los datos o generar una nueva solicitud.`,
			)
		}

		const [
			estadoBoletoEmitido,
			estadoBoletoAnulado,
			estadoSolicitudBoletoCargado,
			estadoCotizacionSeleccionada,
			estadoCotizacionAnulada,
			estadoSegmentoConfirmado,
		] = await Promise.all([
			this.prisma.estado_boleto.findUnique({ where: { slug: 'boleto_emitido' } }),
			this.prisma.estado_boleto.findUnique({ where: { slug: 'boleto_anulado' } }),
			this.prisma.estado_solicitud.findUnique({ where: { slug: 'boleto_cargado' } }),
			this.prisma.estado_cotizacion.findUnique({ where: { slug: 'cotizacion_seleccionada' } }),
			this.prisma.estado_cotizacion.findUnique({ where: { slug: 'cotizacion_anulada' } }),
			this.prisma.estado_segmento_boleto.findUnique({ where: { slug: 'confirmado' } }),
		]);

		if (
			!estadoBoletoEmitido ||
			!estadoBoletoAnulado ||
			!estadoSolicitudBoletoCargado ||
			!estadoCotizacionSeleccionada ||
			!estadoCotizacionAnulada ||
			!estadoSegmentoConfirmado
		) {
			throw new NotFoundException('Estados requeridos no encontrados en la base de datos');
		}

		let boletoReemplazado: (boleto & {
			estado_boleto: estado_boleto;
			cotizacion: cotizacion;
		}) | null = null;

		if (data.reemplaza_boleto_id) {
			boletoReemplazado = await this.prisma.boleto.findUnique({
				where: { id: data.reemplaza_boleto_id },
				include: {
					estado_boleto: true,
					cotizacion: true,
				},
			});

			if (!boletoReemplazado) {
				throw new NotFoundException(
					`Boleto a reemplazar con ID ${data.reemplaza_boleto_id} no encontrado`,
				);
			}

			if (boletoReemplazado.cotizacion.id !== cotizacionId) {
				throw new BadRequestException('El boleto a reemplazar no pertenece a la cotizacion indicada');
			}
		}

		const cotizacionesNoElegidas = cotizacion.solicitud.cotizacion.filter(
			(item) =>
				item.id !== cotizacionId &&
				item.estado_cotizacion.slug !== 'cotizacion_anulada' &&
				item.estado_cotizacion.slug !== 'cotizacion_descartada',
		);

		const resultado = await this.prisma.$transaction(async (tx) => {
			if (boletoReemplazado) {
				await tx.boleto.update({
					where: { id: boletoReemplazado.id },
					data: { estado_actual_id: estadoBoletoAnulado.id },
				});

				await tx.historial_estado_boleto.create({
					data: {
						boleto_id: boletoReemplazado.id,
						estado_id: estadoBoletoAnulado.id,
						usuario_id: usuarioId,
						observacion: data.comentario?.trim() || 'Boleto anulado por reemplazo',
					},
				});
			}

			await tx.cotizacion.update({
				where: { id: cotizacionId },
				data: { estado_actual_id: estadoCotizacionSeleccionada.id },
			});

			await tx.historial_estado_cotizacion.create({
				data: {
					cotizacion_id: cotizacionId,
					estado_id: estadoCotizacionSeleccionada.id,
					usuario_id: usuarioId,
					observacion: 'Cotizacion seleccionada para emision de boleto',
				},
			});

			if (cotizacionesNoElegidas.length > 0) {
				await tx.cotizacion.updateMany({
					where: {
						id: { in: cotizacionesNoElegidas.map((item) => item.id) },
					},
					data: { estado_actual_id: estadoCotizacionAnulada.id },
				});

				await tx.historial_estado_cotizacion.createMany({
					data: cotizacionesNoElegidas.map((item) => ({
						cotizacion_id: item.id,
						estado_id: estadoCotizacionAnulada.id,
						usuario_id: usuarioId,
						observacion: `Cotizacion anulada por emision de boleto para cotizacion #${cotizacionId}`,
					})),
				});
			}

			const boleto = await tx.boleto.create({
				data: {
					cotizacion_id: cotizacionId,
					reemplaza_boleto_id: data.reemplaza_boleto_id ?? null,
					emitido_usuario_id: usuarioId,
					estado_actual_id: estadoBoletoEmitido.id,
					cobertura: data.cobertura,
					valor_final: data.valor_final ?? null,
				},
				include: { estado_boleto: true },
			});

			await tx.historial_estado_boleto.create({
				data: {
					boleto_id: boleto.id,
					estado_id: estadoBoletoEmitido.id,
					usuario_id: usuarioId,
					observacion: data.comentario?.trim() || 'Boleto emitido',
				},
			});

			await tx.segmento_boleto.createMany({
				data: data.segmentos.map((segmento) => ({
					boleto_id: boleto.id,
					estado_id: estadoSegmentoConfirmado.id,
					tipo_segmento: segmento.tipo_segmento,
					aerolinea: segmento.aerolinea ?? null,
					codigo_reserva: segmento.codigo_reserva ?? null,
					numero_tiquete: segmento.numero_tiquete ?? null,
					numero_vuelo: segmento.numero_vuelo,
					fecha_vuelo: new Date(segmento.fecha_vuelo),
					fecha_compra: segmento.fecha_compra ? new Date(segmento.fecha_compra) : null,
					clase_tarifaria: segmento.clase_tarifaria ?? null,
					politica_equipaje: segmento.politica_equipaje ?? null,
					url_archivo_adjunto: segmento.url_archivo_adjunto ?? null,
				})),
			});

			await tx.solicitud.update({
				where: { id: cotizacion.solicitud_id },
				data: { estado_actual_id: estadoSolicitudBoletoCargado.id },
			});

			await tx.historial_estado_solicitud.create({
				data: {
					solicitud_id: cotizacion.solicitud_id,
					estado_id: estadoSolicitudBoletoCargado.id,
					usuario_id: usuarioId,
					observacion: `Boleto #${boleto.id} emitido para la cotizacion #${cotizacionId}`,
				},
			});

			return boleto;
		});

		await this.demoPolicyService.incrementUsage('boleto', usuarioId, userRole)

		return {
			success: true,
			message: data.reemplaza_boleto_id ? 'Boleto reemplazado correctamente' : 'Boleto emitido correctamente',
			data: {
				boleto: {
					id: resultado.id,
					estado: resultado.estado_boleto.estado,
					cotizacion_id: resultado.cotizacion_id,
					reemplaza_boleto_id: resultado.reemplaza_boleto_id,
					cobertura: resultado.cobertura,
					ruta: {
						origen: detalleSolicitud.origen,
						destino: detalleSolicitud.destino,
					},
						valor_final: resultado.valor_final,
					created_at: resultado.created_at,
					segmentos: data.segmentos.map((segmento) => ({
						...segmento,
						estado: 'CONFIRMADO',
					})),
				},
			},
			event: {
				type: data.reemplaza_boleto_id ? 'BOLETO_REEMPLAZADO' : 'BOLETO_EMITIDO',
				affected_entities: [
					{
						entity: 'solicitud',
						id: cotizacion.solicitud_id,
						new_state: 'BOLETO CARGADO',
					},
					{
						entity: 'cotizacion',
						id: cotizacionId,
						new_state: 'COTIZACION SELECCIONADA',
					},
					...(data.reemplaza_boleto_id
						? [
								{
									entity: 'boleto',
									id: data.reemplaza_boleto_id,
									new_state: 'BOLETO ANULADO',
								},
							]
						: []),
					{
						entity: 'boleto',
						id: resultado.id,
						new_state: 'BOLETO EMITIDO',
					},
					...cotizacionesNoElegidas.map((item) => ({
						entity: 'cotizacion',
						id: item.id,
						new_state: 'COTIZACION ANULADA',
					})),
				],
			},
		};
	}

	async generarNovedad(boletoId: number, usuarioId: number, data: NovedadBoletoDto, userRole?: string) {
		await this.demoPolicyService.assertBoletoOwnershipIfDemo(boletoId, usuarioId, userRole)

		if (!data.comentario || data.comentario.trim() === '') {
			throw new BadRequestException('El comentario es obligatorio para generar novedad en boleto');
		}

		const boleto = await this.prisma.boleto.findUnique({
			where: { id: boletoId },
			include: {
				cotizacion: true,
			},
		});

		if (!boleto) {
			throw new NotFoundException(`Boleto con ID ${boletoId} no encontrado`);
		}

		const [estadoBoletoNovedad, estadoSolicitudNovedad] = await Promise.all([
			this.prisma.estado_boleto.findUnique({ where: { slug: 'novedad' } }),
			this.prisma.estado_solicitud.findUnique({ where: { slug: 'novedad' } }),
		]);

		if (!estadoBoletoNovedad || !estadoSolicitudNovedad) {
			throw new NotFoundException('Estados requeridos no encontrados en la base de datos');
		}

		await this.prisma.$transaction(async (tx) => {
			await tx.boleto.update({
				where: { id: boletoId },
				data: { estado_actual_id: estadoBoletoNovedad.id },
			});

			await tx.historial_estado_boleto.create({
				data: {
					boleto_id: boletoId,
					estado_id: estadoBoletoNovedad.id,
					usuario_id: usuarioId,
					observacion: `NOVEDAD: ${data.comentario}`,
				},
			});

			await tx.solicitud.update({
				where: { id: boleto.cotizacion.solicitud_id },
				data: { estado_actual_id: estadoSolicitudNovedad.id },
			});

			await tx.historial_estado_solicitud.create({
				data: {
					solicitud_id: boleto.cotizacion.solicitud_id,
					estado_id: estadoSolicitudNovedad.id,
					usuario_id: usuarioId,
					observacion: `Novedad en boleto #${boletoId}: ${data.comentario}`,
				},
			});
		});

		return {
			success: true,
			message: 'Novedad registrada correctamente',
			data: {
				boleto: {
					id: boletoId,
					estado: estadoBoletoNovedad.estado,
				},
				comentario: data.comentario,
			},
			event: {
				type: 'BOLETO_NOVEDAD_GENERADA',
				affected_entities: [
					{
						entity: 'solicitud',
						id: boleto.cotizacion.solicitud_id,
						new_state: estadoSolicitudNovedad.estado,
					},
				],
			},
		};
	}

	async conservarBoleto(boletoId: number, usuarioId: number, data?: ConservarBoletoDto, userRole?: string) {
		await this.demoPolicyService.assertBoletoOwnershipIfDemo(boletoId, usuarioId, userRole)

		const boleto = await this.prisma.boleto.findUnique({
			where: { id: boletoId },
			include: {
				estado_boleto: true,
				cotizacion: true,
			},
		});

		if (!boleto) {
			throw new NotFoundException(`Boleto con ID ${boletoId} no encontrado`);
		}

		if (boleto.estado_boleto.slug !== 'novedad') {
			throw new BadRequestException('Solo se puede conservar un boleto en estado NOVEDAD');
		}

		const [estadoBoletoEmitido, estadoSolicitudBoletoCargado] = await Promise.all([
			this.prisma.estado_boleto.findUnique({ where: { slug: 'boleto_emitido' } }),
			this.prisma.estado_solicitud.findUnique({ where: { slug: 'boleto_cargado' } }),
		]);

		if (!estadoBoletoEmitido || !estadoSolicitudBoletoCargado) {
			throw new NotFoundException('Estados requeridos no encontrados en la base de datos');
		}

		await this.prisma.$transaction(async (tx) => {
			await tx.boleto.update({
				where: { id: boletoId },
				data: { estado_actual_id: estadoBoletoEmitido.id },
			});

			await tx.historial_estado_boleto.create({
				data: {
					boleto_id: boletoId,
					estado_id: estadoBoletoEmitido.id,
					usuario_id: usuarioId,
					observacion: data?.comentario?.trim() || 'Boleto revisado y conservado',
				},
			});

			await tx.solicitud.update({
				where: { id: boleto.cotizacion.solicitud_id },
				data: { estado_actual_id: estadoSolicitudBoletoCargado.id },
			});

			await tx.historial_estado_solicitud.create({
				data: {
					solicitud_id: boleto.cotizacion.solicitud_id,
					estado_id: estadoSolicitudBoletoCargado.id,
					usuario_id: usuarioId,
					observacion: `Boleto #${boletoId} conservado tras revision`,
				},
			});
		});

		return {
			success: true,
			message: 'Boleto revisado y conservado correctamente',
			data: {
				boleto: {
					id: boletoId,
					estado: estadoBoletoEmitido.estado,
				},
			},
			event: {
				type: 'BOLETO_CONSERVADO',
				affected_entities: [
					{
						entity: 'solicitud',
						id: boleto.cotizacion.solicitud_id,
						new_state: estadoSolicitudBoletoCargado.estado,
					},
				],
			},
		};
	}

	async confirmarBoleto(boletoId: number, usuarioId: number, data?: ConfirmarBoletoDto, userRole?: string) {
		await this.demoPolicyService.assertBoletoOwnershipIfDemo(boletoId, usuarioId, userRole)

		const boleto = await this.prisma.boleto.findUnique({
			where: { id: boletoId },
			include: {
				estado_boleto: true,
				cotizacion: true,
			},
		});

		if (!boleto) {
			throw new NotFoundException(`Boleto con ID ${boletoId} no encontrado`);
		}

		if (boleto.estado_boleto.slug !== 'boleto_emitido') {
			throw new BadRequestException('Solo se puede confirmar un boleto en estado BOLETO EMITIDO');
		}

		const [estadoBoletoConforme, estadoSolicitudConforme] = await Promise.all([
			this.prisma.estado_boleto.findUnique({ where: { slug: 'conforme_empleado' } }),
			this.prisma.estado_solicitud.findUnique({ where: { slug: 'viaje_programado' } }),
		]);

		if (!estadoBoletoConforme || !estadoSolicitudConforme) {
			throw new NotFoundException('Estados requeridos no encontrados en la base de datos');
		}

		const ahora = new Date();

		await this.prisma.$transaction(async (tx) => {
			await tx.boleto.update({
				where: { id: boletoId },
				data: {
					estado_actual_id: estadoBoletoConforme.id,
					closed_at: ahora,
				},
			});

			await tx.historial_estado_boleto.create({
				data: {
					boleto_id: boletoId,
					estado_id: estadoBoletoConforme.id,
					usuario_id: usuarioId,
					observacion: data?.comentario?.trim() || 'Boleto confirmado por el solicitante',
				},
			});

			await tx.solicitud.update({
				where: { id: boleto.cotizacion.solicitud_id },
				data: {
					estado_actual_id: estadoSolicitudConforme.id,
					closed_at: ahora,
				},
			});

			await tx.historial_estado_solicitud.create({
				data: {
					solicitud_id: boleto.cotizacion.solicitud_id,
					estado_id: estadoSolicitudConforme.id,
					usuario_id: usuarioId,
					observacion: `Solicitud exitosa por confirmacion del boleto #${boletoId}`,
				},
			});
		});

		return {
			success: true,
			message: 'Boleto confirmado correctamente',
			data: {
				boleto: {
					id: boletoId,
					estado: estadoBoletoConforme.estado,
				},
			},
			event: {
				type: 'BOLETO_CONFIRMADO',
				affected_entities: [
					{
						entity: 'solicitud',
						id: boleto.cotizacion.solicitud_id,
						new_state: estadoSolicitudConforme.estado,
					},
				],
			},
		};
	}

	async reemplazarBoleto(boletoId: number, usuarioId: number, data: ReemplazarBoletoDto, userRole?: string) {
		await this.demoPolicyService.assertBoletoOwnershipIfDemo(boletoId, usuarioId, userRole)
		await this.demoPolicyService.assertCanCreate('boleto', usuarioId, userRole)

		if (!data || Object.keys(data).length === 0) {
			throw new BadRequestException('Debe enviar un body con los datos del boleto')
		}

		if (!data.cobertura || data.cobertura.trim() === '') {
			throw new BadRequestException('La cobertura es obligatoria para reemplazar el boleto');
		}

		if (!Array.isArray(data.segmentos) || data.segmentos.length === 0) {
			throw new BadRequestException('Debe enviar al menos un segmento de vuelo');
		}

		if (!COBERTURAS_BOLETO_VALIDAS.includes(data.cobertura as (typeof COBERTURAS_BOLETO_VALIDAS)[number])) {
			throw new BadRequestException('La cobertura enviada no es válida. Valores permitidos: IDA, IDA_Y_VUELTA, RETORNO');
		}

		const tiposSegmento = data.segmentos.map((segmento) => segmento.tipo_segmento)
		const totalIda = tiposSegmento.filter((tipo) => tipo === 'IDA').length
		const totalVuelta = tiposSegmento.filter((tipo) => tipo === 'VUELTA').length

		if (data.cobertura === 'IDA_Y_VUELTA') {
			const estructuraValida = data.segmentos.length === 2 && totalIda === 1 && totalVuelta === 1
			if (!estructuraValida) {
				throw new BadRequestException(
					'Para cobertura IDA_Y_VUELTA debe enviar exactamente dos segmentos: uno IDA y uno VUELTA',
				)
			}
		}

		if (data.cobertura === 'IDA' || data.cobertura === 'RETORNO') {
			const estructuraValida = data.segmentos.length === 1 && totalIda === 1
			if (!estructuraValida) {
				throw new BadRequestException(
					`Para cobertura ${data.cobertura} debe enviar un solo segmento con tipo_segmento IDA`,
				)
			}
		}

		if (!data.ruta?.origen?.trim() || !data.ruta?.destino?.trim()) {
			throw new BadRequestException('La ruta es obligatoria para reemplazar el boleto y debe incluir origen y destino')
		}

		const boletoExistente = await this.prisma.boleto.findUnique({
			where: { id: boletoId },
			include: {
				estado_boleto: true,
				cotizacion: {
					include: {
						solicitud: {
							include: {
								detalle_vuelo_solicitud: {
									select: {
										origen: true,
										destino: true,
									},
									take: 1,
									orderBy: { created_at: 'desc' },
								},
							},
						},
					},
				},
			},
		});

		if (!boletoExistente) {
			throw new NotFoundException(`Boleto con ID ${boletoId} no encontrado`);
		}

		const estadosPermitidos = ['boleto_emitido', 'novedad'];
		if (!estadosPermitidos.includes(boletoExistente.estado_boleto.slug)) {
			throw new BadRequestException('Solo se pueden reemplazar boletos en estado BOLETO EMITIDO o NOVEDAD');
		}

		if (data.cobertura !== boletoExistente.cotizacion.solicitud.tipo_de_vuelo) {
			throw new BadRequestException(
				`La cobertura del boleto debe coincidir con la solicitud (${boletoExistente.cotizacion.solicitud.tipo_de_vuelo})`,
			)
		}

		const detalleSolicitud = boletoExistente.cotizacion.solicitud.detalle_vuelo_solicitud?.[0]
		if (!detalleSolicitud) {
			throw new BadRequestException('La solicitud no tiene detalle de vuelo (origen/destino). Debe corregir o generar una nueva solicitud.');
		}

		const origenSolicitud = this.normalizarTextoRuta(detalleSolicitud.origen)
		const destinoSolicitud = this.normalizarTextoRuta(detalleSolicitud.destino)
		const origenBoleto = this.normalizarTextoRuta(data.ruta.origen)
		const destinoBoleto = this.normalizarTextoRuta(data.ruta.destino)

		const rutaCoincide = origenBoleto === origenSolicitud && destinoBoleto === destinoSolicitud
		if (!rutaCoincide) {
			throw new BadRequestException(
				`La ruta enviada no coincide con la solicitud. Ruta esperada: ${detalleSolicitud.origen} -> ${detalleSolicitud.destino}. Debe corregir los datos o generar una nueva solicitud.`,
			)
		}

		const [estadoBoletoAnulado, estadoBoletoEmitido, estadoSolicitudBoletoCargado, estadoSegmentoReprogramado] =
			await Promise.all([
				this.prisma.estado_boleto.findUnique({ where: { slug: 'boleto_anulado' } }),
				this.prisma.estado_boleto.findUnique({ where: { slug: 'boleto_emitido' } }),
				this.prisma.estado_solicitud.findUnique({ where: { slug: 'boleto_cargado' } }),
				this.prisma.estado_segmento_boleto.findUnique({ where: { slug: 'reprogramado' } }),
			]);

		if (!estadoBoletoAnulado || !estadoBoletoEmitido || !estadoSolicitudBoletoCargado || !estadoSegmentoReprogramado) {
			throw new NotFoundException('Estados requeridos no encontrados en la base de datos');
		}

		const resultado = await this.prisma.$transaction(async (tx) => {
			await tx.boleto.update({
				where: { id: boletoId },
				data: { estado_actual_id: estadoBoletoAnulado.id },
			});

			await tx.historial_estado_boleto.create({
				data: {
					boleto_id: boletoId,
					estado_id: estadoBoletoAnulado.id,
					usuario_id: usuarioId,
					observacion: data.comentario?.trim() || 'Boleto anulado por reemplazo',
				},
			});

			const nuevoBoleto = await tx.boleto.create({
				data: {
					cotizacion_id: boletoExistente.cotizacion_id,
					reemplaza_boleto_id: boletoId,
					emitido_usuario_id: usuarioId,
					estado_actual_id: estadoBoletoEmitido.id,
					cobertura: data.cobertura,
					valor_final: data.valor_final ?? null,
				},
				include: { estado_boleto: true },
			});

			await tx.historial_estado_boleto.create({
				data: {
					boleto_id: nuevoBoleto.id,
					estado_id: estadoBoletoEmitido.id,
					usuario_id: usuarioId,
					observacion: data.comentario?.trim() || 'Boleto reemplazado',
				},
			});

			await tx.segmento_boleto.createMany({
				data: data.segmentos.map((segmento) => ({
					boleto_id: nuevoBoleto.id,
					estado_id: estadoSegmentoReprogramado.id,
					tipo_segmento: segmento.tipo_segmento,
					aerolinea: segmento.aerolinea ?? null,
					codigo_reserva: segmento.codigo_reserva ?? null,
					numero_tiquete: segmento.numero_tiquete ?? null,
					numero_vuelo: segmento.numero_vuelo,
					fecha_vuelo: new Date(segmento.fecha_vuelo),
					fecha_compra: segmento.fecha_compra ? new Date(segmento.fecha_compra) : null,
					clase_tarifaria: segmento.clase_tarifaria ?? null,
					politica_equipaje: segmento.politica_equipaje ?? null,
					url_archivo_adjunto: segmento.url_archivo_adjunto ?? null,
				})),
			});

			await tx.solicitud.update({
				where: { id: boletoExistente.cotizacion.solicitud_id },
				data: { estado_actual_id: estadoSolicitudBoletoCargado.id },
			});

			await tx.historial_estado_solicitud.create({
				data: {
					solicitud_id: boletoExistente.cotizacion.solicitud_id,
					estado_id: estadoSolicitudBoletoCargado.id,
					usuario_id: usuarioId,
					observacion: `Boleto #${boletoId} reemplazado por nuevo boleto #${nuevoBoleto.id}`,
				},
			});

			return nuevoBoleto;
		});

		await this.demoPolicyService.incrementUsage('boleto', usuarioId, userRole)

		return {
			success: true,
			message: 'Boleto reemplazado correctamente',
			data: {
				boleto: {
					id: resultado.id,
					cotizacion_id: resultado.cotizacion_id,
					estado: resultado.estado_boleto.estado,
					reemplaza_boleto_id: resultado.reemplaza_boleto_id,
					cobertura: resultado.cobertura,
					ruta: {
						origen: detalleSolicitud.origen,
						destino: detalleSolicitud.destino,
					},
					valor_final: resultado.valor_final,
					segmentos: data.segmentos.map((segmento) => ({
						...segmento,
						estado: 'REPROGRAMADO',
					})),
				},
			},
			event: {
				type: 'BOLETO_REEMPLAZADO',
				affected_entities: [
					{
						entity: 'solicitud',
						id: boletoExistente.cotizacion.solicitud_id,
						new_state: estadoSolicitudBoletoCargado.estado,
					},
					{
						entity: 'boleto',
						id: boletoId,
						new_state: 'BOLETO ANULADO',
					},
					{
						entity: 'boleto',
						id: resultado.id,
						new_state: 'BOLETO EMITIDO',
					},
				],
			},
		};
	}

	async obtenerPorId(boletoId: number) {
		const boleto = await this.prisma.boleto.findUnique({
			where: { id: boletoId },
			include: {
				estado_boleto: true,
				emitido_por_usuario: {
					select: {
						id: true,
						nombre: true,
					},
				},
				cotizacion: {
					select: {
						id: true,
						solicitud_id: true,
						solicitud: {
							select: {
								usuario: {
									select: {
										id: true,
										nombre: true,
									},
								},
								detalle_vuelo_solicitud: {
									select: {
										origen: true,
										destino: true,
									},
									take: 1,
									orderBy: { created_at: 'desc' },
								},
							},
						},
					},
				},
				segmento_boleto: {
					include: {
						estado_segmento_boleto: {
							select: {
								estado: true,
							},
						},
					},
					orderBy: { id: 'asc' },
				},
			},
		});

		if (!boleto) {
			throw new NotFoundException(`Boleto con ID ${boletoId} no encontrado`);
		}

		const ruta = boleto.cotizacion.solicitud.detalle_vuelo_solicitud[0] ?? null;

		return {
			success: true,
			message: 'Boleto obtenido correctamente',
			data: {
				boleto: {
					id: boleto.id,
					cotizacion_id: boleto.cotizacion.id,
					solicitud_id: boleto.cotizacion.solicitud_id,
					reemplaza_boleto_id: boleto.reemplaza_boleto_id,
					usuario_solicitante: {
						id: boleto.cotizacion.solicitud.usuario.id,
						nombre: boleto.cotizacion.solicitud.usuario.nombre,
					},
					usuario_generador_boleto: {
						id: boleto.emitido_por_usuario.id,
						nombre: boleto.emitido_por_usuario.nombre,
					},
					estado_boleto: {
						id: boleto.estado_boleto.id,
						estado: boleto.estado_boleto.estado,
						slug: boleto.estado_boleto.slug,
						editable: boleto.estado_boleto.editable,
						created_at: boleto.estado_boleto.created_at,
					},
					cobertura: boleto.cobertura,
					valor_final: boleto.valor_final,
					created_at: boleto.created_at,
					ruta: ruta
						? {
							origen: ruta.origen,
							destino: ruta.destino,
						}
						: null,
					segmentos: boleto.segmento_boleto.map((segmento) => ({
						tipo_segmento: segmento.tipo_segmento,
						aerolinea: segmento.aerolinea,
						codigo_reserva: segmento.codigo_reserva,
						numero_tiquete: segmento.numero_tiquete,
						numero_vuelo: segmento.numero_vuelo,
						fecha_vuelo: segmento.fecha_vuelo.toISOString().slice(0, 10),
						fecha_compra: segmento.fecha_compra ? segmento.fecha_compra.toISOString().slice(0, 10) : null,
						clase_tarifaria: segmento.clase_tarifaria,
						politica_equipaje: segmento.politica_equipaje,
						url_archivo_adjunto: segmento.url_archivo_adjunto,
						estado: segmento.estado_segmento_boleto.estado,
					})),
				},
			},
		};
	}

	/**
	 * Obtener historial de estados de un boleto por ID
	 * URL: GET /boleto/:id/historial-estado
	 */
	async obtenerHistorialPorBoletoId(boletoId: number) {
		const boleto = await this.prisma.boleto.findUnique({
			where: { id: boletoId },
			select: {
				id: true,
			},
		});

		if (!boleto) {
			throw new NotFoundException(`Boleto con ID ${boletoId} no encontrado`);
		}

		const historial = await this.prisma.historial_estado_boleto.findMany({
			where: { boleto_id: boletoId },
			include: {
				estado_boleto: {
					select: {
						id: true,
						estado: true,
						slug: true,
					},
				},
				usuario: {
					select: {
						id: true,
						nombre: true,
						username: true,
					},
				},
			},
			orderBy: { created_at: 'desc' },
		});

		return {
			success: true,
			message: 'Historial de boleto obtenido correctamente',
			data: {
				boleto_id: boletoId,
				historial_estado_boleto: historial,
				total: historial.length,
			},
		};
	}
}
