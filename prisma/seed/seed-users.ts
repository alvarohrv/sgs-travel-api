import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('12345', salt);
  const demoHash = await bcrypt.hash('usuario_demo', salt);

  // Crear usuario Carlos
  await prisma.usuario.upsert({
    where: { username: 'carlos' },
    update: {},
    create: {
      numero_documento: '87654321',
      cod_empleado: 'EMP002',
      nombre: 'Carlos',
      correo: 'calito@sgs.net',
      username: 'carlos',
      password_hash: passwordHash,
      rol: 'SOLICITANTE',
    },
  });

  // Crear usuario Alvaro
  await prisma.usuario.upsert({
    where: { username: 'alvaro' },
    update: {},
    create: {
      numero_documento: '12345678',
      cod_empleado: 'EMP001',
      nombre: 'Alvaro',
      correo: 'alvaro@sgs.net',
      username: 'alvaro',
      password_hash: passwordHash,
      rol: 'SOLICITANTE',
    },
  });

  // Crear usuario DEMO
  await prisma.usuario.upsert({
    where: { username: 'usuario_demo' },
    update: {},
    create: {
      numero_documento: '0',
      cod_empleado: 'EMP000',
      nombre: 'Sr Usuario',
      correo: 'user00@sgs.net',
      username: 'usuario_demo',
      password_hash: demoHash,
      rol: 'DEMO',
    },
  });

  console.log('Seed exitoso: Usuarios creados con contraseñas hasheadas.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });