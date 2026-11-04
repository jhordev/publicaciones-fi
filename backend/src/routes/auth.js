import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncH, HttpError, registrarBitacora } from '../lib/utils.js';

const router = Router();

// Protección contra intentos repetidos: 10 intentos fallidos por IP cada 15 minutos
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de inicio de sesión. Intente nuevamente en unos minutos.' },
});

const loginSchema = z.object({
  correo: z.string().trim().toLowerCase().email('Correo inválido'),
  password: z.string().min(1, 'Ingrese la contraseña').max(200),
});

// Hash ficticio para igualar tiempos cuando el correo no existe
const DUMMY_HASH = bcrypt.hashSync('dummy-password-no-valida', 10);

router.post('/login', loginLimiter, asyncH(async (req, res) => {
  const { correo, password } = loginSchema.parse(req.body);
  const user = await prisma.usuario.findUnique({ where: { correo }, include: { rol: true } });
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok || user.estado !== 'activo') {
    throw new HttpError(401, 'Correo o contraseña incorrectos');
  }
  await new Promise((resolve, reject) => req.session.regenerate((e) => (e ? reject(e) : resolve())));
  req.session.userId = user.id;
  await prisma.usuario.update({ where: { id: user.id }, data: { ultimoAcceso: new Date() } });
  req.user = { id: user.id };
  await registrarBitacora(req, 'login', 'usuarios', user.id);
  res.json({
    user: { id: user.id, nombres: user.nombres, apellidos: user.apellidos, correo: user.correo, rol: user.rol.nombre },
  });
}));

router.post('/logout', asyncH(async (req, res) => {
  if (req.user) await registrarBitacora(req, 'logout', 'usuarios', req.user.id);
  await new Promise((resolve) => req.session.destroy(() => resolve()));
  res.clearCookie('pubfi.sid', { path: req.app.get('cookiePath') });
  res.json({ ok: true });
}));

router.get('/me', (req, res) => {
  res.json({ user: req.user ?? null });
});

const cambioSchema = z.object({
  actual: z.string().min(1),
  nueva: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres').max(200),
});

router.post('/cambiar-password', asyncH(async (req, res) => {
  if (!req.user) throw new HttpError(401, 'Debe iniciar sesión');
  const { actual, nueva } = cambioSchema.parse(req.body);
  const user = await prisma.usuario.findUnique({ where: { id: req.user.id } });
  if (!(await bcrypt.compare(actual, user.passwordHash))) throw new HttpError(400, 'La contraseña actual no es correcta');
  await prisma.usuario.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(nueva, 12) } });
  await registrarBitacora(req, 'cambiar_password', 'usuarios', user.id);
  res.json({ ok: true });
}));

export default router;
