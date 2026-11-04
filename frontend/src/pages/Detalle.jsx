import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Copy, Download, ExternalLink, FileText, Link2, Mail } from 'lucide-react';
import { useApi, useTitulo } from '../lib/hooks.js';
import { urlArchivoPublico } from '../api/client.js';
import { fecha, IDIOMAS, referenciaApa, tamano, TIPOS_AUTOR } from '../lib/format.js';
import PublicacionCard from '../components/PublicacionCard.jsx';
import { Avatar, ImagenPublicacion } from '../components/Imagenes.jsx';
import { ErrorCaja, Spinner } from '../components/ui.jsx';

function Dato({ label, children }) {
  if (!children) return null;
  return (
    <div className="border-b border-slate-100 py-2.5 last:border-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-800">{children}</dd>
    </div>
  );
}

export function OrcidIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#A6CE39" />
      <path fill="#fff" d="M7.6 6.7a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8zM6.9 9.6h1.4v7.8H6.9zM10.1 9.6h3.6c3.4 0 4.9 2.4 4.9 3.9 0 1.7-1.3 3.9-4.9 3.9h-3.6zm1.4 6.6h2.1c3 0 3.6-2.2 3.6-2.7 0-1.4-.9-2.7-3.6-2.7h-2.1z" />
    </svg>
  );
}

/** Título, autores y botones de acción. `oscuro` = sobre la imagen de portada. */
function Cabecera({ p, oscuro }) {
  const pdfs = p.archivos.filter((a) => a.tipoMime === 'application/pdf');
  return (
    <>
      <Link to="/publicaciones" className={`inline-flex items-center gap-1 text-sm ${oscuro ? 'text-white/80 hover:text-white' : 'text-slate-500 hover:text-marino'}`}>
        <ArrowLeft className="h-4 w-4" /> Volver al catálogo
      </Link>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className={`badge ${oscuro ? 'bg-naranja text-white' : 'bg-marino text-white'}`}>{p.tipo.nombre}</span>
        <span className={`badge ${oscuro ? 'bg-white/15 text-white ring-1 ring-white/30 backdrop-blur' : 'bg-naranja-50 text-naranja-600'}`}>{p.anioPublicacion}</span>
        {p.programa && (
          <span className={`badge ${oscuro ? 'bg-white/15 text-white ring-1 ring-white/30 backdrop-blur' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}>{p.programa.nombre}</span>
        )}
      </div>
      <h1 className={`mt-3 max-w-4xl font-serif text-2xl font-bold leading-tight sm:text-4xl lg:text-5xl ${oscuro ? 'text-white drop-shadow-sm' : 'text-marino'}`}>
        {p.titulo}
      </h1>
      <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2" aria-label="Autores">
        {p.autores.map((a) => (
          <li key={a.id}>
            <Link to={`/autores/${a.id}`} className={`group inline-flex items-center gap-2 ${oscuro ? 'text-white' : 'text-slate-700'}`}>
              <Avatar autor={a} px={32} className={oscuro ? 'ring-2 ring-white/70' : 'ring-2 ring-white'} />
              <span className="font-medium group-hover:underline">{a.nombres} {a.apellidos}</span>
              {a.esAutorCorrespondencia && <Mail className="h-3.5 w-3.5 text-naranja" aria-label="Autor de correspondencia" />}
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap gap-2">
        {p.urlPublicacion && (
          <a href={p.urlPublicacion} target="_blank" rel="noopener noreferrer" className="btn-primary">
            <ExternalLink className="h-4 w-4" /> Ver artículo original
          </a>
        )}
        {p.doi && (
          <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noopener noreferrer"
            className={oscuro ? 'btn bg-white text-marino hover:bg-slate-100' : 'btn-dark'}>
            <Link2 className="h-4 w-4" /> Abrir DOI
          </a>
        )}
        {pdfs.map((f) => (
          <a key={f.id} href={urlArchivoPublico(f.id)} target="_blank" rel="noopener"
            className={oscuro ? 'btn border border-white/40 bg-white/10 text-white backdrop-blur hover:bg-white/20' : 'btn-outline'}>
            <FileText className="h-4 w-4" /> Ver PDF
          </a>
        ))}
      </div>
    </>
  );
}

export default function Detalle() {
  const { slug } = useParams();
  const { data: p, cargando, error, recargar } = useApi(`/public/publicaciones/${encodeURIComponent(slug)}`);
  const [copiado, setCopiado] = useState(false);
  useTitulo(p?.titulo ?? 'Publicación');

  if (cargando) return <Spinner className="py-24" />;
  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        {error.status === 404 ? (
          <div className="text-center">
            <h1 className="font-serif text-2xl font-bold text-marino">Publicación no encontrada</h1>
            <p className="mt-2 text-slate-500">Es posible que el enlace sea incorrecto o que la publicación ya no esté disponible.</p>
            <Link to="/publicaciones" className="btn-dark mt-6">Ir al catálogo</Link>
          </div>
        ) : <ErrorCaja error={error} onReintentar={recargar} />}
      </div>
    );
  }

  const referencia = referenciaApa(p);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(referencia);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch { /* el navegador no permite copiar */ }
  };
  const pdfs = p.archivos.filter((a) => a.tipoMime === 'application/pdf');
  const otros = p.archivos.filter((a) => a.tipoMime !== 'application/pdf');

  return (
    <>
      {p.imagen ? (
        <section className="relative isolate overflow-hidden bg-marino">
          <ImagenPublicacion id={p.imagen} alt="" sizes="100vw" prioridad className="absolute inset-0 -z-10 h-full w-full" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-marino via-marino/85 to-marino/30" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-marino/70 to-transparent" />
          <div className="mx-auto flex min-h-[420px] max-w-7xl flex-col justify-end px-4 pb-10 pt-8 sm:min-h-[520px] sm:px-6 sm:pb-14">
            <Cabecera p={p} oscuro />
          </div>
        </section>
      ) : (
        <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-10">
          <Cabecera p={p} />
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <section className="card p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-marino">Resumen</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-700">{p.resumen || 'Resumen no disponible.'}</p>
              {p.palabrasClave.length > 0 && (
                <div className="mt-5">
                  <h3 className="text-sm font-semibold text-slate-500">Palabras clave</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {p.palabrasClave.map((k) => (
                      <Link key={k.id} to={`/publicaciones?q=${encodeURIComponent(k.nombre)}`}
                        className="badge bg-fondo text-slate-700 ring-1 ring-slate-200 hover:ring-naranja">{k.nombre}</Link>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="card p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-marino">Autores</h2>
              <ol className="mt-3 grid gap-3 sm:grid-cols-2">
                {p.autores.map((a) => (
                  <li key={a.id}>
                    <Link to={`/autores/${a.id}`} className="flex items-center gap-4 rounded-xl border border-slate-200 p-3 transition-colors hover:border-naranja hover:bg-naranja-50/40">
                      <div className="relative">
                        <Avatar autor={a} px={64} />
                        <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-marino text-[11px] font-bold text-white ring-2 ring-white">
                          {a.ordenAutoria}
                        </span>
                      </div>
                      <div className="min-w-0 text-sm">
                        <p className="font-semibold text-slate-800">{a.nombres} {a.apellidos}</p>
                        <p className="text-slate-500">{[TIPOS_AUTOR[a.tipoAutor], a.programa?.nombre].filter(Boolean).join(' · ')}</p>
                        {a.institucion && <p className="truncate text-xs text-slate-400">{a.institucion}</p>}
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          {a.esAutorCorrespondencia && <span className="badge bg-naranja-50 text-naranja-600">Correspondencia</span>}
                          {a.orcid && <span className="inline-flex items-center gap-1 text-xs text-slate-500"><OrcidIcon /> ORCID</span>}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>

            <section className="card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-marino">Cómo citar (APA 7)</h2>
                <button className="btn-outline btn-sm" onClick={copiar}>
                  {copiado ? <><Check className="h-4 w-4 text-emerald-600" /> Copiado</> : <><Copy className="h-4 w-4" /> Copiar</>}
                </button>
              </div>
              <p className="mt-3 rounded-lg bg-fondo p-4 font-serif text-sm leading-relaxed text-slate-700">{referencia}</p>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="card p-5">
              <h2 className="text-lg font-semibold text-marino">Datos de la publicación</h2>
              <dl className="mt-2">
                <Dato label="Revista">{p.revista?.nombre}</Dato>
                <Dato label="Editorial">{p.revista?.editorial}</Dato>
                <Dato label="ISSN">{[p.revista?.issnImpreso && `${p.revista.issnImpreso} (impreso)`, p.revista?.issnElectronico && `${p.revista.issnElectronico} (electrónico)`].filter(Boolean).join(' · ')}</Dato>
                <Dato label="Indexación">{p.revista?.indexacion}</Dato>
                <Dato label="Volumen / Número">{[p.volumen && `Vol. ${p.volumen}`, p.numero && `N.º ${p.numero}`].filter(Boolean).join(', ')}</Dato>
                <Dato label="Páginas">{p.paginas}</Dato>
                <Dato label="Fecha de publicación">{p.fechaPublicacion ? fecha(p.fechaPublicacion, { day: 'numeric', month: 'long', year: 'numeric' }) : String(p.anioPublicacion)}</Dato>
                <Dato label="Idioma">{IDIOMAS[p.idioma] ?? p.idioma}</Dato>
                <Dato label="DOI">{p.doi && <a className="link break-all" href={`https://doi.org/${p.doi}`} target="_blank" rel="noopener noreferrer">{p.doi}</a>}</Dato>
                <Dato label="Líneas de investigación">{p.lineas.map((l) => l.nombre).join(' · ')}</Dato>
              </dl>
            </section>
            {p.archivos.length > 0 && (
              <section className="card p-5">
                <h2 className="text-lg font-semibold text-marino">Archivos</h2>
                <ul className="mt-3 space-y-2">
                  {[...pdfs, ...otros].map((f) => (
                    <li key={f.id} className="flex items-center justify-between gap-2 rounded-lg bg-fondo px-3 py-2 text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-naranja" />
                        <span className="truncate" title={f.nombreOriginal}>{f.nombreOriginal}</span>
                        <span className="shrink-0 text-xs text-slate-400">{tamano(f.tamano)}</span>
                      </span>
                      <a href={urlArchivoPublico(f.id, true)} className="btn-ghost btn-sm" aria-label={`Descargar ${f.nombreOriginal}`}>
                        <Download className="h-4 w-4" />
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>
        </div>

        {p.relacionadas?.length > 0 && (
          <section className="mt-12">
            <h2 className="font-serif text-2xl font-bold text-marino">Publicaciones relacionadas</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {p.relacionadas.map((r) => <PublicacionCard key={r.id} p={r} compacta />)}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
