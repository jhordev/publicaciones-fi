import { Suspense, useLayoutEffect } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { LazyMotion, domAnimation, m } from 'motion/react';

/*
 * Transición de entrada entre páginas.
 * No hay animación de salida a propósito: así la página nueva reemplaza a la anterior
 * sin dejar un hueco vacío (que hacía saltar el footer y provocaba parpadeo).
 * Solo anima cuando cambia la ruta (no al cambiar filtros o la página del listado).
 */
const transicion = { duration: 0.45, ease: [0.16, 1, 0.3, 1] }; // ease-out "expo": arranca rápido y frena suave

export default function TransicionPagina({ fallback = null }) {
  const { pathname } = useLocation();
  const outlet = useOutlet();

  // Sube al inicio antes de pintar la nueva página (sin salto visible)
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return (
    // LazyMotion + domAnimation: solo se incluye lo necesario de Motion (bundle más liviano)
    <LazyMotion features={domAnimation} strict>
      <m.div
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transicion}
      >
        <Suspense fallback={fallback}>{outlet}</Suspense>
      </m.div>
    </LazyMotion>
  );
}
