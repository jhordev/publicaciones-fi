/**
 * Datos iniciales: roles, tipos de publicación, programas base y administrador inicial.
 * Es idempotente: puede ejecutarse varias veces sin duplicar registros.
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const roles = [
    { nombre: 'Administrador', descripcion: 'Acceso total: publicaciones, catálogos, reportes, usuarios y bitácora' },
    { nombre: 'Editor', descripcion: 'Coordinación: registra, edita, revisa y publica artículos; administra catálogos y reportes' },
  ];
  for (const r of roles) await prisma.rol.upsert({ where: { nombre: r.nombre }, update: {}, create: r });

  const tipos = [
    { nombre: 'Artículo de aporte', descripcion: 'Contribución académica o investigación original.' },
    { nombre: 'Artículo de revisión de literatura', descripcion: 'Análisis, comparación y síntesis de investigaciones previas.' },
  ];
  for (const t of tipos) await prisma.tipoPublicacion.upsert({ where: { nombre: t.nombre }, update: {}, create: t });

  // Programas base (editables desde el panel: Catálogos → Programas)
  const programas = [
    { nombre: 'Ingeniería de Sistemas', codigo: 'IS' },
    { nombre: 'Ingeniería Civil', codigo: 'IC' },
    { nombre: 'Ingeniería Industrial', codigo: 'II' },
    { nombre: 'Ingeniería Ambiental', codigo: 'IAM' },
    { nombre: 'Ingeniería Agraria', codigo: 'IAG' },
  ];
  if ((await prisma.programa.count()) === 0) {
    for (const p of programas) await prisma.programa.create({ data: p });
  }

  const correo = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (correo && password) {
    const rol = await prisma.rol.findUnique({ where: { nombre: 'Administrador' } });
    const existe = await prisma.usuario.findUnique({ where: { correo } });
    if (!existe) {
      await prisma.usuario.create({
        data: { nombres: 'Administrador', apellidos: 'FI', correo, passwordHash: await bcrypt.hash(password, 12), rolId: rol.id },
      });
      console.log(`Administrador inicial creado: ${correo}`);
    } else {
      console.log(`El administrador ${correo} ya existe (no se modificó).`);
    }
  }
  console.log('Seed completado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
