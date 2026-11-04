import { useEffect, useRef, useState } from 'react';
import { srcSet, urlMedia } from './Imagenes.jsx';

/**
 * Fondo del hero de la portada: imagen opcional + overlay de marca + decoración.
 * Se usa en la portada y en la vista previa de Admin → Configuración (así se ven igual).
 * Debe ir dentro de un contenedor con `relative isolate overflow-hidden bg-marino`.
 */
export default function HeroFondo({ imagen, sizes = '100vw', prioridad = false }) {
  const img = useRef(null);
  const [cargada, setCargada] = useState(false);

  // Si la imagen ya estaba en caché, el evento load puede haber ocurrido antes de montar
  useEffect(() => {
    setCargada(Boolean(img.current?.complete && img.current.naturalWidth));
  }, [imagen]);

  return (
    <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
      {imagen && (
        <>
          <img
            ref={img}
            key={imagen}
            src={urlMedia('portada', imagen, 1920)}
            srcSet={srcSet('portada', imagen)}
            sizes={sizes}
            alt=""
            loading={prioridad ? 'eager' : 'lazy'}
            fetchPriority={prioridad ? 'high' : 'auto'}
            decoding="async"
            onLoad={() => setCargada(true)}
            className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-[1200ms] ease-out ${cargada ? 'scale-100 opacity-100' : 'scale-105 opacity-0'}`}
          />
          {/* Overlay: oscuro a la izquierda (donde va el texto) y más transparente a la derecha */}
          <div className="absolute inset-0 bg-gradient-to-r from-marino via-marino/85 to-marino/45" />
          {/* Refuerzo arriba/abajo para que se integre con la cabecera y la sección siguiente */}
          <div className="absolute inset-0 bg-gradient-to-t from-marino/90 via-transparent to-marino/40" />
        </>
      )}
      {/* Brillo naranja de marca */}
      <div className={`absolute -right-24 -top-24 h-96 w-96 rounded-full blur-3xl ${imagen ? 'bg-naranja/25 mix-blend-screen' : 'bg-naranja/20'}`} />
      {/* Trama de puntos */}
      <div className={`absolute inset-0 ${imagen ? 'opacity-[0.05]' : 'opacity-[0.07]'}`}
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '22px 22px' }} />
    </div>
  );
}
