import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/utils.js';

export const ROLES = { ADMIN: 'Administrador', EDITOR: 'Editor' };

/** Carga el usuario de la sesión (si existe y sigue activo) en req.user. */
export async function cargarUsuario(req, _res, next) {
  try {
    const id = req.session?.userId;
    if (id) {
      const user = await prisma.usuario.findUnique({ where: { id }, include: { rol: true } });
      if (user && user.estado === 'activo') {
        req.user = { id: user.id, nombres: user.nombres, apellidos: user.apellidos, correo: user.correo, rol: user.rol.nombre };
      } else {
        req.session.destroy(() => {});
      }
    }
    next();
  } catch (err) {
    next(err);
  }
}

export function requireAuth(req, _res, next) {
  if (!req.user) return next(new HttpError(401, 'Debe iniciar sesión'));
  next();
}

export const requireRol = (...roles) => (req, _res, next) => {
  if (!req.user) return next(new HttpError(401, 'Debe iniciar sesión'));
  if (!roles.includes(req.user.rol)) return next(new HttpError(403, 'No tiene permisos para esta operación'));
  next();
};

/**
 * Protección CSRF simple: las peticiones que modifican datos deben incluir
 * la cabecera X-Requested-With (un formulario de otro sitio no puede enviarla
 * sin pasar por CORS, que no está habilitado).
 */
export function requireXhr(req, _res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.get('X-Requested-With') !== 'fetch') return next(new HttpError(403, 'Solicitud no permitida'));
  next();
}
