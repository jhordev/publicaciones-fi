import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, GraduationCap, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useApi, useTitulo } from '../lib/hooks.js';
import { qs } from '../api/client.js';
import { TIPOS_AUTOR } from '../lib/format.js';
import PublicacionCard from '../components/PublicacionCard.jsx';
import { Avatar, urlMedia } from '../components/Imagenes.jsx';
import { ErrorCaja, Paginacion, Spinner, Vacio } from '../components/ui.jsx';
import { OrcidIcon } from './Detalle.jsx';

/** Vista ampliada de la foto (versión de 512 px). */
function FotoAmpliada({ autor, onCerrar }) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-marino/80 p-4 backdrop-blur-sm" onClick={onCerrar}
      role="dialog" aria-modal="true" aria-label={`Foto de ${autor.nombres} ${autor.apellidos}`}
      onKeyDown={(e) => e.key === 'Escape' && onCerrar()}>
      <button className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" onClick={onCerrar} aria-label="Cerrar" autoFocus>
        <X className="h-5 w-5" />
      </button>
      <img src={urlMedia('autores', autor.foto, 512)} width={512} height={512} alt={`Foto de ${autor.nombres} ${autor.apellidos}`}
        className="aspect-square w-full max-w-md rounded-2xl object-cover shadow-2xl" />
    </div>,
    document.body,
  );
}

export default function AutorPerfil() {
  const { id } = useParams();
  const [page, setPage] = useState(1);
  const [ampliada, setAmpliada] = useState(false);
  const { data: autor, cargando, error, recargar } = useApi(`/public/autores/${encodeURIComponent(id)}`);
  const { data: pubs, cargando: cargandoPubs } = useApi(autor ? `/public/publicaciones${qs({ autor: autor.id, page, limit: 9 })}` : null, { enabled: !!autor });
  useTitulo(autor ? `${autor.nombres} ${autor.apellidos}` : 'Autor');

  if (cargando) return <Spinner className="py-24" />;
  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        {error.status === 404 ? (
          <>
            <h1 className="font-serif text-2xl font-bold text-marino">Autor no encontrado</h1>
            <p className="mt-2 text-slate-500">El autor no existe o aún no tiene publicaciones visibles.</p>
            <Link to="/publicaciones" className="btn-dark mt-6">Ir al catálogo</Link>
          </>
        ) : <ErrorCaja error={error} onReintentar={recargar} />}
      </div>
    );
  }

  return (
    <>
      <section className="relative overflow-hidden bg-marino">
        <div className="pointer-events-none absolute -left-20 -top-24 h-80 w-80 rounded-full bg-naranja/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <Link to="/publicaciones" className="inline-flex items-center gap-1 text-sm text-white/70 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Catálogo
          </Link>
          <div className="mt-6 flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:text-left">
            {autor.foto ? (
              <button onClick={() => setAmpliada(true)} className="rounded-full focus-visible:outline-naranja" aria-label="Ampliar foto">
                <Avatar autor={autor} px={176} className="ring-4 ring-white/90 shadow-2xl transition-transform hover:scale-[1.02]" />
              </button>
            ) : (
              <Avatar autor={autor} px={176} className="ring-4 ring-white/90 shadow-2xl" />
            )}
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-naranja">{TIPOS_AUTOR[autor.tipoAutor]}</p>
              <h1 className="mt-1 font-serif text-3xl font-bold text-white sm:text-4xl">{autor.nombres} {autor.apellidos}</h1>
              <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-slate-300 sm:justify-start">
                {autor.programa && <span className="inline-flex items-center gap-1.5"><GraduationCap className="h-4 w-4" /> {autor.programa.nombre}</span>}
                {autor.institucion && <span className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4" /> {autor.institucion}</span>}
                {autor.orcid && (
                  <a href={`https://orcid.org/${autor.orcid}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-white hover:underline">
                    <OrcidIcon /> {autor.orcid}
                  </a>
                )}
              </div>
              <p className="mt-4 inline-flex items-baseline gap-2 rounded-lg bg-white/10 px-4 py-2 text-white ring-1 ring-white/15">
                <span className="text-2xl font-bold">{autor.totalPublicaciones}</span>
                <span className="text-sm text-slate-300">publicación(es) en el repositorio</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h2 className="font-serif text-2xl font-bold text-marino">Publicaciones</h2>
        {cargandoPubs && !pubs ? <Spinner /> : pubs?.items.length ? (
          <>
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {pubs.items.map((p) => <PublicacionCard key={p.id} p={p} />)}
            </div>
            <div className="mt-6"><Paginacion page={pubs.page} pages={pubs.pages} total={pubs.total} onChange={setPage} /></div>
          </>
        ) : <div className="card mt-6"><Vacio titulo="Sin publicaciones visibles" /></div>}
      </section>

      {ampliada && <FotoAmpliada autor={autor} onCerrar={() => setAmpliada(false)} />}
    </>
  );
}
