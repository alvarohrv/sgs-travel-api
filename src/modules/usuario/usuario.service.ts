import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../../../prisma/prisma.service'
import {
	CambiarRolUsuarioDto,
	RolUsuario,
} from './dto/cambiar-rol-usuario.dto'
import { CrearUsuarioDto } from './dto/crear-usuario.dto'

@Injectable()
export class UsuarioService {
	constructor(private readonly prisma: PrismaService) {}

	async obtenerUsuarioParaLogin(username: string) {
		return this.prisma.usuario.findUnique({
			where: { username },
			select: {
				id: true,
				username: true,
				rol: true,
				password_hash: true,
				disabled_at: true,
			},
		})
	}

	async crearUsuario(data: CrearUsuarioDto) {
		const passwordHash = await bcrypt.hash(data.password, 5)

		try {
			const usuario = await this.prisma.usuario.create({
				data: {
					numero_documento: data.numero_documento,
					cod_empleado: data.cod_empleado ?? null,
					nombre: data.nombre,
					correo: data.correo,
					username: data.username,
					password_hash: passwordHash,
					rol: 'SOLICITANTE',
				},
				select: {
					id: true,
					numero_documento: true,
					cod_empleado: true,
					nombre: true,
					correo: true,
					username: true,
					rol: true,
					created_at: true,
				},
			})

			return {
				success: true,
				message: 'Usuario registrado correctamente',
				data: {
					usuario,
				},
			}
		} catch (error) {
			this.handlePrismaError(error)
		}
	}

	async cambiarRol(usuarioId: number, data: CambiarRolUsuarioDto) {
		const rol = data.rol?.toUpperCase() as RolUsuario

		if (!rol || !['SOLICITANTE', 'ADMIN'].includes(rol)) {
			throw new BadRequestException(
				'Rol invalido. Solo se permite SOLICITANTE o ADMIN',
			)
		}

		const usuarioExiste = await this.prisma.usuario.findUnique({
			where: { id: usuarioId },
			select: { id: true },
		})

		if (!usuarioExiste) {
			throw new NotFoundException(`Usuario con ID ${usuarioId} no encontrado`)
		}

		const usuario = await this.prisma.usuario.update({
			where: { id: usuarioId },
			data: { rol },
			select: {
				id: true,
				rol: true,
			},
		})

		return {
			success: true,
			message: 'Rol del usuario actualizado correctamente',
			data: {
				usuario,
			},
		}
	}

	async compararPassword(passwordPlano: string, passwordHash: string) {
		return bcrypt.compare(passwordPlano, passwordHash)
	}

	private handlePrismaError(error: unknown): never {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === 'P2002'
		) {
			const campos = Array.isArray(error.meta?.target)
				? error.meta?.target.join(', ')
				: 'campo unico'

			throw new BadRequestException(`Ya existe un registro con ${campos}`)
		}

		throw error
	}
}
