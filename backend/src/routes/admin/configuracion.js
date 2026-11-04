import { Router } from 'express';
import { asyncH, HttpError, registrarBitacora } from '../../lib/utils.js';
import { guardarConfiguracion, obtenerConfiguracion, validarCambios } from '../../lib/configuracion.js';
import { eliminarImagen, procesarImagen, subidaImagen } from '../../lib/imagenes.js';

// Ajustes generales del portal (solo Administrador, ver app.js)
const router = Router();

router.get('/configuracion', asyncH(async (_req, res) => {
  res.json(await obtenerConfiguracion());
}));

router.put('/configuracion', asyncH(async (req, res) => {
  const { cambios, errores } = validarCambios(req.body);
  if (errores.length) throw new HttpError(400, 'Datos no válidos', errores);
  if (!Object.keys(cambios).length) throw new HttpError(400, 'No se envió ningún ajuste válido');
  const config = await guardarConfiguracion(cambios);
  await registrarBitacora(req, 'editar', 'configuracion', null, JSON.stringify(cambios));
  res.json(config);
}));

/** Sube la imagen de fondo del hero: se optimiza a WebP en varios anchos y reemplaza a la anterior. */
router.post('/configuracion/imagen-hero', subidaImagen.single('imagen'), asyncH(async (req, res) => {
  if (!req.file) throw new HttpError(400, 'Seleccione una imagen');
  const { imagenHero: anterior } = await obtenerConfiguracion();
  const nueva = await procesarImagen('portada', req.file.buffer);
  let config;
  try {
    config = await guardarConfiguracion({ imagenHero: nueva });
  } catch (err) {
    eliminarImagen('portada', nueva);
    throw err;
  }
  eliminarImagen('portada', anterior);
  await registrarBitacora(req, anterior ? 'cambiar_imagen' : 'subir_imagen', 'configuracion', null, 'Imagen del hero');
  res.status(201).json(config);
}));

/** Quita la imagen de fondo del hero (vuelve al fondo azul por defecto). */
router.delete('/configuracion/imagen-hero', asyncH(async (req, res) => {
  const { imagenHero: anterior } = await obtenerConfiguracion();
  const config = await guardarConfiguracion({ imagenHero: null });
  if (anterior) {
    eliminarImagen('portada', anterior);
    await registrarBitacora(req, 'eliminar_imagen', 'configuracion', null, 'Imagen del hero');
  }
  res.json(config);
}));

export default router;
