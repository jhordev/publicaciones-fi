import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpenText, Library, Search, Users } from 'lucide-react';
import { useApi, useTitulo } from '../lib/hooks.js';
import PublicacionCard from '../components/PublicacionCard.jsx';
import HeroFondo from '../components/HeroFondo.jsx';
import { Spinner, Vacio } from '../components/ui.jsx';

function Indicador({ icono: Icono, valor, etiqueta }) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur-sm sm:p-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-naranja/15 text-naranja">
        <Icono className="h-5 w-5" />
      </span>
      <div>
        <p className="text-2xl font-bold text-white sm:text-3xl">{valor ?? '—'}</p>
        <p className="text-sm text-slate-300">{etiqueta}</p>
      </div>
    </div>
  );
}

export default function Home() {
  useTitulo(null);
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const { data: portada } = useApi('/public/portada');
  const totales = portada?.totales;
  const { data: destacadas } = useApi('/public/publicaciones?destacado=1&limit=3');
  const { data: recientes, cargando } = useApi('/public/publicaciones?orden=registro&limit=6');

  const buscar = (e) => {
    e.preventDefault();
    navigate(`/publicaciones${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
  };

  return (
    <>
      <section className="relative isolate overflow-hidden bg-marino">
        {/* Imagen de fondo y overlay: se configuran en Admin → Configuración */}
        <HeroFondo imagen={portada?.imagenHero} prioridad />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="text-sm font-semibold uppercase tracking-widest text-naranja">Facultad de Ingeniería · UCSS</p>
          <h1 className="mt-3 max-w-3xl font-serif text-3xl font-bold leading-tight text-white sm:text-5xl">
            Repositorio de Publicaciones Científicas
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
            Artículos de estudiantes, docentes, egresados y colaboradores de la Facultad, publicados en revistas científicas.
          </p>
          <form onSubmit={buscar} className="mt-8 flex max-w-2xl flex-col gap-2 sm:flex-row" role="search">
            <label htmlFor="buscador" className="sr-only">Buscar publicaciones</label>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input id="buscador" type="search" value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por título, autor, revista o palabra clave"
                className="h-12 w-full rounded-xl border-0 bg-white pl-12 pr-4 text-slate-800 shadow-lg placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-naranja/40" />
            </div>
            <button className="btn-primary h-12 px-6 text-base shadow-lg">Buscar</button>
          </form>
          {/* Se activa/desactiva desde Admin → Configuración */}
          {totales && (
            <div className="mt-10 grid animate-aparecer gap-3 sm:grid-cols-3">
              <Indicador icono={BookOpenText} valor={totales.publicaciones} etiqueta="Publicaciones" />
              <Indicador icono={Users} valor={totales.autores} etiqueta="Autores" />
              <Indicador icono={Library} valor={totales.revistas} etiqueta="Revistas" />
            </div>
          )}
        </div>
      </section>

      {destacadas?.items?.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
          <h2 className="font-serif text-2xl font-bold text-marino">Artículos destacados</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {destacadas.items.map((p) => <PublicacionCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl font-bold text-marino">Últimas publicaciones</h2>
            <p className="mt-1 text-sm text-slate-500">Registradas recientemente en el repositorio</p>
          </div>
          <Link to="/publicaciones" className="btn-outline">Ver catálogo completo <ArrowRight className="h-4 w-4" /></Link>
        </div>
        {cargando ? <Spinner /> : recientes?.items?.length ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {recientes.items.map((p) => <PublicacionCard key={p.id} p={p} />)}
          </div>
        ) : (
          <div className="card mt-6"><Vacio titulo="Aún no hay publicaciones" texto="Pronto se registrarán los primeros artículos de la Facultad." /></div>
        )}
      </section>
    </>
  );
}
