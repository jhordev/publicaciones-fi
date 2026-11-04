import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Falta la variable de entorno ${name}`);
  return v;
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  host: process.env.HOST || '127.0.0.1',
  port: Number(process.env.PORT || 3001),
  sessionSecret: required('SESSION_SECRET'),
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  // Subruta pública (sin barra final). La API responde en BASE_PATH/api y también en /api.
  basePath: (process.env.BASE_PATH || '').replace(/\/+$/, ''),
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
    database: required('DB_NAME'),
  },
  storageDir: path.resolve(backendDir, process.env.STORAGE_DIR || '../storage/archivos'),
  // Imágenes públicas optimizadas (WebP): portadas de artículos y fotos de autores
  mediaDir: path.resolve(backendDir, process.env.MEDIA_DIR || '../storage/imagenes'),
  maxUploadBytes: Number(process.env.MAX_UPLOAD_MB || 20) * 1024 * 1024,
};
