import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';
import { HttpError } from './utils.js';

fs.mkdirSync(config.storageDir, { recursive: true });

/** Resuelve la ruta física de un archivo guardado, impidiendo salir del directorio de almacenamiento. */
export function rutaFisica(rutaArchivo) {
  const full = path.resolve(config.storageDir, rutaArchivo);
  if (!full.startsWith(config.storageDir + path.sep)) throw new HttpError(400, 'Ruta de archivo inválida');
  return full;
}

/** Envía un archivo al cliente (inline para PDF/imagen, o como descarga). */
export function enviarArchivo(res, archivo, { descargar }) {
  const full = rutaFisica(archivo.rutaArchivo);
  if (!fs.existsSync(full)) throw new HttpError(404, 'El archivo no está disponible');
  const nombre = encodeURIComponent(archivo.nombreOriginal);
  res.setHeader('Content-Type', archivo.tipoMime);
  res.setHeader('Content-Disposition', `${descargar ? 'attachment' : 'inline'}; filename*=UTF-8''${nombre}`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'private, max-age=0, no-cache');
  res.sendFile(full);
}
