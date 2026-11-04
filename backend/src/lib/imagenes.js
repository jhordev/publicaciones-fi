/**
 * Procesamiento de imágenes: toda imagen subida se convierte a WebP optimizado
 * en varios tamaños (para tarjetas, avatares, banners y vistas ampliadas).
 *
 * Archivos generados:  <MEDIA_DIR>/<tipo>/<id>-<ancho>.webp
 * En la BD solo se guarda <id>; el frontend elige el tamaño adecuado (srcset).
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import multer from 'multer';
import { config } from './config.js';
import { HttpError } from './utils.js';

export const PERFILES = {
  // Imagen principal del artículo: 16:9 (tarjetas 640, ficha 1280, pantallas grandes 1920)
  publicaciones: { anchos: [640, 1280, 1920], aspecto: 16 / 9, minimo: 400, calidad: 78 },
  // Foto del investigador: cuadrada (avatar 96, mediano 256, perfil ampliado 512)
  autores: { anchos: [96, 256, 512], aspecto: 1, minimo: 96, calidad: 82 },
  // Fondo del hero de la portada: sin recorte (aspecto null), el navegador la encuadra con object-cover.
  // Calidad algo menor porque va debajo de un overlay oscuro (no se notan los detalles finos).
  portada: { anchos: [768, 1280, 1920, 2560], aspecto: null, minimo: 600, calidad: 72 },
};

// La imagen se recibe en memoria (máx. 12 MB) y solo se guardan las versiones WebP optimizadas
export const subidaImagen = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new HttpError(400, 'Seleccione una imagen (JPG, PNG, WEBP o AVIF)'));
    cb(null, true);
  },
});

const FORMATOS_ENTRADA = new Set(['jpeg', 'png', 'webp', 'avif', 'gif', 'tiff']);
export const ID_VALIDO = /^[0-9a-f-]{36}$/;

const dirTipo = (tipo) => path.join(config.mediaDir, tipo);
for (const tipo of Object.keys(PERFILES)) fs.mkdirSync(dirTipo(tipo), { recursive: true });

/** Procesa la imagen y devuelve el identificador base generado. */
export async function procesarImagen(tipo, buffer) {
  const perfil = PERFILES[tipo];
  let meta;
  try {
    // Decodificar la imagen valida que el contenido sea realmente una imagen
    meta = await sharp(buffer, { failOn: 'error' }).metadata();
  } catch {
    throw new HttpError(400, 'El archivo no es una imagen válida');
  }
  if (!FORMATOS_ENTRADA.has(meta.format)) throw new HttpError(400, 'Formato no permitido (use JPG, PNG, WEBP o AVIF)');
  const ladoMenor = Math.min(meta.width ?? 0, meta.height ?? 0);
  if (ladoMenor < perfil.minimo) throw new HttpError(400, `La imagen es muy pequeña (mínimo ${perfil.minimo} px por lado)`);

  const id = crypto.randomUUID();
  const generados = [];
  try {
    for (const ancho of perfil.anchos) {
      const destino = path.join(dirTipo(tipo), `${id}-${ancho}.webp`);
      await sharp(buffer, { failOn: 'error' })
        .rotate() // respeta la orientación EXIF de fotos de celular
        .resize(perfil.aspecto
          ? {
            width: ancho,
            height: Math.round(ancho / perfil.aspecto),
            fit: 'cover',
            position: sharp.strategy.attention, // recorte centrado en la zona de interés (rostros, contraste)
            withoutEnlargement: true,
          }
          : { width: ancho, withoutEnlargement: true }) // solo se reduce el ancho, conservando la proporción
        .webp({ quality: perfil.calidad, effort: 5, smartSubsample: true })
        .toFile(destino); // sharp no copia metadatos (EXIF/GPS) por defecto
      generados.push(destino);
    }
  } catch (err) {
    generados.forEach((f) => fs.rm(f, { force: true }, () => {}));
    throw err instanceof HttpError ? err : new HttpError(400, 'No se pudo procesar la imagen');
  }
  return id;
}

/** Elimina todos los tamaños de una imagen. */
export function eliminarImagen(tipo, id) {
  if (!id || !ID_VALIDO.test(id)) return;
  for (const ancho of PERFILES[tipo].anchos) {
    fs.rm(path.join(dirTipo(tipo), `${id}-${ancho}.webp`), { force: true }, () => {});
  }
}
