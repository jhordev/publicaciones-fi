import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Star } from 'lucide-react';
import { listaAutoresCorta } from '../lib/format.js';
import { Avatar, ImagenPublicacion } from './Imagenes.jsx';

/** Pila de avatares de los primeros autores. */
function AvataresAutores({ autores, max = 3 }) {
  return (
    <span className="flex -space-x-2">
      {autores.slice(0, max).map((a) => <Avatar key={a.id} autor={a} px={26} className="ring-2 ring-white" />)}
    </span>
  );
}

export default function PublicacionCard({ p, compacta }) {
  const enlace = `/publicaciones/${p.slug}`;
  return (
    <article className="card group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
      {p.imagen && (
        <Link to={enlace} tabIndex={-1} aria-hidden="true" className="block overflow-hidden bg-slate-100">
          <ImagenPublicacion id={p.imagen}
            sizes={compacta ? '(min-width: 1024px) 300px, (min-width: 768px) 50vw, 100vw' : '(min-width: 1024px) 420px, (min-width: 768px) 50vw, 100vw'}
            className="aspect-video w-full transition-transform duration-500 group-hover:scale-[1.03]" />
        </Link>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="badge bg-marino-50 text-marino">{p.tipo?.nombre}</span>
          <span className="badge bg-naranja-50 text-naranja-600">{p.anioPublicacion}</span>
          {p.destacado && <span className="badge bg-amber-50 text-amber-700"><Star className="h-3 w-3 fill-current" /> Destacado</span>}
        </div>
        <h3 className="font-serif text-lg font-semibold leading-snug text-marino">
          <Link to={enlace} className="hover:text-naranja-600 focus-visible:text-naranja-600">{p.titulo}</Link>
        </h3>
        <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
          <AvataresAutores autores={p.autores} />
          <span className="min-w-0">{listaAutoresCorta(p.autores)}</span>
        </p>
        {p.revista && (
          <p className="mt-1.5 flex items-start gap-1.5 text-sm italic text-slate-500">
            <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <span>{p.revista.nombre}</span>
          </p>
        )}
        {!compacta && !p.imagen && p.resumen && <p className="mt-3 line-clamp-3 text-sm text-slate-600">{p.resumen}</p>}
        <div className="mt-auto pt-4">
          <Link to={enlace} className="inline-flex items-center gap-1 text-sm font-semibold text-naranja-600 transition-all hover:gap-2"
            aria-label={`Ver detalle: ${p.titulo}`}>
            Ver detalle <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
