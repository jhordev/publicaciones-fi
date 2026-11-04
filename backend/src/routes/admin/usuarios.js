import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { asyncH, HttpError, paginacion, parseId, registrarBitacora } from '../../lib/utils.js';

const router = Router();

const seleccion = {
  id: true, nombres: true, apellidos: true, correo: true, estado: true, ultimoAcceso: true, createdAt: true, rolId: true,
  rol: { select: { id: true, nombre: true } },
};

const base = {
  nombres: z.string().trim().min(1, 'Ingrese los nombres').max(100),
  apellidos: z.string().trim().min(1, 'Ingrese los apellidos').max(100),
  correo: z.string().trim().toLowerCase().email('Correo inválido').max(150),
  rolId: z.coerce.number().int().positive('Seleccione un rol'),
  estado: z.enum(['activo', 'inactivo']).default('activo'),
};
const password = z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(200);
const crearSchema = z.object({ ...base, password });
const editarSchema = z.object({ ...base, password: z.preprocess((v) => (v === '' ? undefined : v), password.optional()) });

router.get('/roles', asyncH(async (_req, res) => {
  res.json(await prisma.rol.findMany({ orderBy: { id: 'asc' }, include: { _count: { select: { usuarios: true } } } }));
}));

router.get('/usuarios', asyncH(async (req, res) => {
  const { page, limit, skip } = paginacion(req.query, 20, 100);
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const where = q ? { OR: [{ nombres: { contains: q } }, { apellidos: { contains: q } }, { correo: { contains: q } }] } : {};
  const [total, items] = await Promise.all([
    prisma.usuario.count({ where }),
    prisma.usuario.findMany({ where, select: seleccion, orderBy: [{ apellidos: 'asc' }], skip, take: limit }),
  ]);
  res.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
}));

router.post('/usuarios', asyncH(async (req, res) => {
  const { password: pwd, ...d } = crearSchema.parse(req.body);
  const user = await prisma.usuario.create({
    data: { ...d, passwordHash: await bcrypt.hash(pwd, 12) },
    select: seleccion,
  });
  await registrarBitacora(req, 'crear', 'usuarios', user.id, `${user.correo} (${user.rol.nombre})`);
  res.status(201).json(user);
}));

/** Evita que el sistema quede sin ningún administrador activo. */
async function verificarUltimoAdmin(id, nuevoRolId, nuevoEstado) {
  const actual = await prisma.usuario.findUnique({ where: { id }, include: { rol: true } });
  if (!actual) throw new HttpError(404, 'Usuario no encontrado');
  if (actual.rol.nombre !== 'Administrador' || actual.estado !== 'activo') return;
  const nuevoRol = nuevoRolId ? await prisma.rol.findUnique({ where: { id: nuevoRolId } }) : actual.rol;
  if (nuevoRol?.nombre === 'Administrador' && nuevoEstado !== 'inactivo') return;
  const otros = await prisma.usuario.count({ where: { id: { not: id }, estado: 'activo', rol: { nombre: 'Administrador' } } });
  if (otros === 0) throw new HttpError(400, 'Debe existir al menos un administrador activo');
}

router.put('/usuarios/:id', asyncH(async (req, res) => {
  const id = parseId(req.params.id);
  const { password: pwd, ...d } = editarSchema.parse(req.body);
  await verificarUltimoAdmin(id, d.rolId, d.estado);
  const user = await prisma.usuario.update({
    where: { id },
    data: { ...d, ...(pwd ? { passwordHash: await bcrypt.hash(pwd, 12) } : {}) },
    select: seleccion,
  });
  await registrarBitacora(req, 'editar', 'usuarios', id, `${user.correo} (${user.rol.nombre}, ${user.estado})${pwd ? ' — contraseña restablecida' : ''}`);
  res.json(user);
}));

router.delete('/usuarios/:id', asyncH(async (req, res) => {
  const id = parseId(req.params.id);
  if (id === req.user.id) throw new HttpError(400, 'No puede eliminar su propia cuenta');
  await verificarUltimoAdmin(id, null, 'inactivo');
  const user = await prisma.usuario.delete({ where: { id } });
  await registrarBitacora(req, 'eliminar', 'usuarios', id, user.correo);
  res.json({ ok: true });
}));

router.get('/bitacora', asyncH(async (req, res) => {
  const { page, limit, skip } = paginacion(req.query, 30, 100);
  const where = {
    ...(req.query.entidad ? { entidad: String(req.query.entidad) } : {}),
    ...(req.query.usuario ? { usuarioId: Number(req.query.usuario) || undefined } : {}),
    ...(req.query.accion ? { accion: { contains: String(req.query.accion) } } : {}),
  };
  const [total, items, entidades] = await Promise.all([
    prisma.bitacora.count({ where }),
    prisma.bitacora.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: { usuario: { select: { id: true, nombres: true, apellidos: true, correo: true } } },
    }),
    prisma.bitacora.groupBy({ by: ['entidad'], orderBy: { entidad: 'asc' } }),
  ]);
  res.json({ items, total, page, limit, pages: Math.ceil(total / limit), entidades: entidades.map((e) => e.entidad) });
}));

export default router;
