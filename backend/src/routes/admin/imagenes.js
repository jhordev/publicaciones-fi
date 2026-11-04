import { Router } from 'express';
import multer from 'multer';
import { prisma } from '../../lib/prisma.js';
import { asyncH, HttpError, parseId, registrarBitacora } from '../../lib/utils.js';
import { procesarImagen, eliminarImagen } from '../../lib/imagenes.js';

const router = Router();

// La imagen se recibe en memoria (máx. 12 MB) y solo se guardan las versiones WebP optimizadas
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new HttpError(400, 'Seleccione una imagen (JPG, PNG, WEBP o AVIF)'));
    cb(null, true);
  },
});

/**
 * Crea las rutas para subir/eliminar la imagen de una entidad.
 * modelo: modelo Prisma · campo: columna con el id de imagen · tipo: perfil de tamaños
 */
function rutasImagen({ ruta, modelo, campo, tipo, entidad }) {
  router.post(`/${ruta}/:id/${campo}`, upload.single('imagen'), asyncH(async (req, res) => {
    const id = parseId(req.params.id);
    if (!req.file) throw new HttpError(400, 'Seleccione una imagen');
    const actual = await prisma[modelo].findUnique({ where: { id }, select: { [campo]: true } });
    if (!actual) throw new HttpError(404, 'Registro no encontrado');
    const nuevo = await procesarImagen(tipo, req.file.buffer);
    try {
      await prisma[modelo].update({ where: { id }, data: { [campo]: nuevo } });
    } catch (err) {
      eliminarImagen(tipo, nuevo);
      throw err;
    }
    eliminarImagen(tipo, actual[campo]);
    await registrarBitacora(req, actual[campo] ? `cambiar_${campo}` : `subir_${campo}`, entidad, id);
    res.status(201).json({ [campo]: nuevo });
  }));

  router.delete(`/${ruta}/:id/${campo}`, asyncH(async (req, res) => {
    const id = parseId(req.params.id);
    const actual = await prisma[modelo].findUnique({ where: { id }, select: { [campo]: true } });
    if (!actual) throw new HttpError(404, 'Registro no encontrado');
    if (actual[campo]) {
      await prisma[modelo].update({ where: { id }, data: { [campo]: null } });
      eliminarImagen(tipo, actual[campo]);
      await registrarBitacora(req, `eliminar_${campo}`, entidad, id);
    }
    res.json({ ok: true });
  }));
}

rutasImagen({ ruta: 'publicaciones', modelo: 'publicacion', campo: 'imagen', tipo: 'publicaciones', entidad: 'publicaciones' });
rutasImagen({ ruta: 'autores', modelo: 'autor', campo: 'foto', tipo: 'autores', entidad: 'autores' });

export default router;
