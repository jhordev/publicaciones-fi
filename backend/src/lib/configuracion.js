import { prisma } from './prisma.js';
import { ID_VALIDO } from './imagenes.js';

/**
 * Ajustes del portal y sus valores por defecto.
 * Si una clave no existe en la tabla `configuracion` (o su valor no es válido), se usa `defecto`.
 * editable: false → no se cambia con PUT /configuracion sino con una ruta propia (p. ej. subir imagen).
 */
export const AJUSTES = {
  // Mostrar los totales (publicaciones, autores, revistas) en el hero de la portada
  mostrarTotalesHero: { defecto: false, editable: true, valido: (v) => typeof v === 'boolean' },
  // Imagen de fondo del hero (id de las versiones WebP en MEDIA_DIR/portada)
  imagenHero: { defecto: null, editable: false, valido: (v) => v === null || (typeof v === 'string' && ID_VALIDO.test(v)) },
};

/** Devuelve todos los ajustes combinando la base de datos con los valores por defecto. */
export async function obtenerConfiguracion() {
  const filas = await prisma.configuracion.findMany({ where: { clave: { in: Object.keys(AJUSTES) } } });
  const guardados = Object.fromEntries(filas.map((f) => [f.clave, f.valor]));
  return Object.fromEntries(
    Object.entries(AJUSTES).map(([clave, def]) => [clave, clave in guardados && def.valido(guardados[clave]) ? guardados[clave] : def.defecto]),
  );
}

/** Valida los cambios recibidos por PUT. Devuelve { cambios, errores }. Ignora claves desconocidas o no editables. */
export function validarCambios(body) {
  const cambios = {};
  const errores = [];
  for (const [clave, valor] of Object.entries(body ?? {})) {
    const def = AJUSTES[clave];
    if (!def?.editable) continue;
    if (!def.valido(valor)) errores.push({ campo: clave, mensaje: 'Valor no válido' });
    else cambios[clave] = valor;
  }
  return { cambios, errores };
}

/** Guarda los cambios (upsert por clave) y devuelve la configuración completa. */
export async function guardarConfiguracion(cambios) {
  await prisma.$transaction(
    Object.entries(cambios).map(([clave, valor]) =>
      prisma.configuracion.upsert({ where: { clave }, create: { clave, valor }, update: { valor } })),
  );
  return obtenerConfiguracion();
}
