import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { config } from '../../lib/config.js';
import { asyncH, HttpError, parseId, registrarBitacora } from '../../lib/utils.js';
import { rutaFisica, enviarArchivo } from '../../lib/archivos.js';

const router = Router();

// Tipos permitidos y su firma binaria, para no confiar solo en la extensión o el MIME declarado
const PNG_FIRMA = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const PERMITIDOS = {
  'application/pdf': { ext: '.pdf', firma: (b) => b.subarray(0, 5).toString('latin1') === '%PDF-' },
  'image/jpeg': { ext: '.jpg', firma: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  'image/png': { ext: '.png', firma: (b) => b.subarray(0, 8).equals(PNG_FIRMA) },
  'image/webp': {
    ext: '.webp',
    firma: (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP',
  },
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = path.join(config.storageDir, String(new Date().getFullYear()));
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => cb(null, crypto.randomUUID() + PERMITIDOS[file.mimetype].ext),
  }),
  limits: { fileSize: config.maxUploadBytes, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!PERMITIDOS[file.mimetype]) return cb(new HttpError(400, 'Tipo de archivo no permitido (solo PDF, JPG, PNG o WEBP)'));
    cb(null, true);
  },
});

const metaSchema = z.object({
  tipoArchivo: z.enum(['pdf', 'portada', 'otro']).default('pdf'),
  autorizadoPublico: z.preprocess((v) => v === true || v === 'true' || v === '1', z.boolean()).default(false),
});

async function leerCabecera(file) {
  const fd = await fs.promises.open(file, 'r');
  try {
    const buf = Buffer.alloc(12);
    await fd.read(buf, 0, 12, 0);
    return buf;
  } finally {
    await fd.close();
  }
}

router.post('/publicaciones/:id/archivos', upload.single('archivo'), asyncH(async (req, res) => {
  const file = req.file;
  try {
    const pubId = parseId(req.params.id);
    if (!file) throw new HttpError(400, 'Seleccione un archivo');
    const meta = metaSchema.parse(req.body);

    if (!PERMITIDOS[file.mimetype].firma(await leerCabecera(file.path))) {
      throw new HttpError(400, 'El contenido del archivo no corresponde a su tipo');
    }
    if (meta.tipoArchivo === 'pdf' && file.mimetype !== 'application/pdf') throw new HttpError(400, 'El archivo debe ser PDF');
    if (meta.tipoArchivo === 'portada' && !file.mimetype.startsWith('image/')) throw new HttpError(400, 'La portada debe ser una imagen');

    const pub = await prisma.publicacion.findUnique({ where: { id: pubId }, select: { id: true } });
    if (!pub) throw new HttpError(404, 'Publicación no encontrada');

    const archivo = await prisma.archivoPublicacion.create({
      data: {
        publicacionId: pubId,
        // multer entrega el nombre en latin1; se convierte a UTF-8 para conservar tildes
        nombreOriginal: Buffer.from(file.originalname, 'latin1').toString('utf8').slice(0, 255),
        rutaArchivo: path.relative(config.storageDir, file.path).split(path.sep).join('/'),
        tipoMime: file.mimetype,
        tamano: file.size,
        tipoArchivo: meta.tipoArchivo,
        autorizadoPublico: meta.autorizadoPublico,
      },
    });
    await registrarBitacora(req, 'subir_archivo', 'publicaciones', pubId, archivo.nombreOriginal);
    res.status(201).json(archivo);
  } catch (err) {
    if (file) fs.rm(file.path, { force: true }, () => {});
    throw err;
  }
}));

router.get('/archivos/:id', asyncH(async (req, res) => {
  const archivo = await prisma.archivoPublicacion.findUnique({ where: { id: parseId(req.params.id) } });
  if (!archivo) throw new HttpError(404, 'Archivo no encontrado');
  enviarArchivo(res, archivo, { descargar: req.query.descargar === '1' });
}));

router.patch('/archivos/:id', asyncH(async (req, res) => {
  const id = parseId(req.params.id);
  const { autorizadoPublico } = z.object({ autorizadoPublico: z.boolean() }).parse(req.body);
  const a = await prisma.archivoPublicacion.update({ where: { id }, data: { autorizadoPublico } });
  await registrarBitacora(req, autorizadoPublico ? 'autorizar_archivo' : 'restringir_archivo', 'publicaciones', a.publicacionId, a.nombreOriginal);
  res.json(a);
}));

router.delete('/archivos/:id', asyncH(async (req, res) => {
  const id = parseId(req.params.id);
  const a = await prisma.archivoPublicacion.delete({ where: { id } });
  fs.rm(rutaFisica(a.rutaArchivo), { force: true }, () => {});
  await registrarBitacora(req, 'eliminar_archivo', 'publicaciones', a.publicacionId, a.nombreOriginal);
  res.json({ ok: true });
}));

export default router;
