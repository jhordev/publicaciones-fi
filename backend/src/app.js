import express from 'express';
import session from 'express-session';
import MySQLStoreFactory from 'express-mysql-session';
import helmet from 'helmet';
import { config } from './lib/config.js';
import { prisma } from './lib/prisma.js';
import { cargarUsuario, requireAuth, requireRol, requireXhr, ROLES } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/errors.js';
import authRoutes from './routes/auth.js';
import publicRoutes from './routes/public.js';
import publicacionesAdmin from './routes/admin/publicaciones.js';
import archivosAdmin from './routes/admin/archivos.js';
import catalogosAdmin from './routes/admin/catalogos.js';
import usuariosAdmin from './routes/admin/usuarios.js';
import reportesAdmin from './routes/admin/reportes.js';
import imagenesAdmin from './routes/admin/imagenes.js';
import configuracionAdmin from './routes/admin/configuracion.js';

const MySQLStore = MySQLStoreFactory(session);

export function crearApp() {
  const app = express();
  app.disable('x-powered-by');
  // Nginx actúa como proxy inverso en el mismo servidor
  app.set('trust proxy', 'loopback');
  app.set('cookiePath', config.basePath || '/');

  // Nginx puede reenviar las peticiones como /api/* (quitando la subruta) o conservarla.
  // Se normaliza a BASE_PATH/api/* para que la cookie de sesión (limitada a BASE_PATH) funcione igual.
  if (config.basePath) {
    app.use((req, _res, next) => {
      if (req.url === '/api' || req.url.startsWith('/api/')) {
        req.url = config.basePath + req.url;
        req.originalUrl = req.url;
      }
      next();
    });
  }

  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'same-origin' } }));
  app.use(express.json({ limit: '1mb' }));

  // Imágenes optimizadas: nombres únicos (UUID), por eso se pueden cachear de forma permanente
  app.use(`${config.basePath}/api/media`, express.static(config.mediaDir, {
    immutable: true, maxAge: '365d', index: false, dotfiles: 'deny', fallthrough: false,
  }));

  app.use(session({
    name: 'pubfi.sid',
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: new MySQLStore({
      ...config.db,
      createDatabaseTable: true,
      schema: { tableName: 'sesiones' },
      clearExpired: true,
      checkExpirationInterval: 15 * 60 * 1000,
    }),
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.cookieSecure,
      path: config.basePath || '/',
      maxAge: 8 * 60 * 60 * 1000, // 8 horas de inactividad
    },
  }));

  const api = express.Router();
  api.use(requireXhr);
  api.use(cargarUsuario);

  api.get('/salud', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ ok: true });
    } catch {
      res.status(503).json({ ok: false });
    }
  });

  api.use('/auth', authRoutes);
  api.use('/public', publicRoutes);

  // Administración: Administrador y Editor
  const admin = express.Router();
  admin.use(requireAuth);
  admin.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  admin.use(requireRol(ROLES.ADMIN, ROLES.EDITOR));
  // Solo Administrador: usuarios, roles, bitácora y configuración
  admin.use(['/usuarios', '/roles', '/bitacora', '/configuracion'], requireRol(ROLES.ADMIN));
  admin.use(imagenesAdmin);
  admin.use('/publicaciones', publicacionesAdmin);
  admin.use(archivosAdmin);
  admin.use(catalogosAdmin);
  admin.use(usuariosAdmin);
  admin.use(reportesAdmin);
  admin.use(configuracionAdmin);
  api.use('/admin', admin);

  app.use(`${config.basePath}/api`, api);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
