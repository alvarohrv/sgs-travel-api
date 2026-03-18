import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const databaseUrl = process.env.DATABASE_URL; //Variable de entorno que contiene la URL de conexión a la base de datos, definida en .env

if (!databaseUrl) {
  throw new Error('DATABASE_URL no esta definida en variables de entorno');
}

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(databaseUrl),
}); //Se requiere configurar el cliente de Prisma para usar el adaptador de MariaDB, ya que Prisma no tiene soporte nativo para MariaDB. El adaptador se encarga de traducir las consultas de Prisma a sintaxis compatible con MariaDB. Se pasa la URL de conexión a la base de datos al adaptador para que pueda establecer la conexión correctamente.

async function main() {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('1357', salt);
  const demoHash = await bcrypt.hash('usuario_demo', salt);
  const arHash = await bcrypt.hash('ar', salt);

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

    // Crear usuario ar
  await prisma.usuario.upsert({
    where: { username: 'ar' },
    update: {},
    create: {
      numero_documento: '11223344',
      cod_empleado: 'EMP003',
      nombre: 'ar',
      correo: 'ar.demo@sgs.net',
      username: 'ar',
      password_hash: arHash,
      rol: 'SUPERADMIN',
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