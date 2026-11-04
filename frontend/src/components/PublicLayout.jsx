import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { LayoutDashboard, LogIn, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import TransicionPagina from './TransicionPagina.jsx';

const logo = `${import.meta.env.BASE_URL}logo-ucss.png`;

function Header() {
  const { user } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const nav = [
    { to: '/', label: 'Inicio', end: true },
    { to: '/publicaciones', label: 'Publicaciones' },
  ];
  const claseLink = ({ isActive }) =>
    `rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'text-naranja' : 'text-marino hover:text-naranja'}`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="h-1 bg-naranja" />
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-3" aria-label="Inicio — Publicaciones FI">
          <img src={logo} alt="Universidad Católica Sedes Sapientiae" className="h-9 w-auto sm:h-10" />
          <span className="hidden border-l border-slate-300 pl-3 leading-tight md:block">
            <span className="block text-xs font-semibold uppercase tracking-wider text-naranja">Facultad de Ingeniería</span>
            <span className="block text-sm font-semibold text-marino">Publicaciones Científicas</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 sm:flex" aria-label="Navegación principal">
          {nav.map((n) => <NavLink key={n.to} to={n.to} end={n.end} className={claseLink}>{n.label}</NavLink>)}
          {user ? (
            <Link to="/admin" className="btn-dark ml-2"><LayoutDashboard className="h-4 w-4" /> Panel</Link>
          ) : (
            <Link to="/login" className="btn-outline ml-2"><LogIn className="h-4 w-4" /> Acceso</Link>
          )}
        </nav>
        <button className="btn-ghost sm:hidden" onClick={() => setAbierto(!abierto)} aria-expanded={abierto} aria-label="Abrir menú">
          {abierto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {abierto && (
        <nav className="border-t border-slate-200 bg-white px-4 py-3 sm:hidden" aria-label="Navegación móvil">
          <div className="flex flex-col gap-1">
            {nav.map((n) => <NavLink key={n.to} to={n.to} end={n.end} className={claseLink} onClick={() => setAbierto(false)}>{n.label}</NavLink>)}
            <Link to={user ? '/admin' : '/login'} className="btn-dark mt-2" onClick={() => setAbierto(false)}>
              {user ? 'Panel administrativo' : 'Acceso administrativo'}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-16 bg-marino text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-serif text-lg font-semibold text-white">Repositorio de Publicaciones Científicas</p>
          <p className="mt-2 text-sm">Facultad de Ingeniería · Universidad Católica Sedes Sapientiae</p>
        </div>
        <div className="text-sm">
          <p className="font-semibold text-white">Acerca del repositorio</p>
          <p className="mt-2">
            Difunde los artículos publicados en revistas científicas por estudiantes, docentes, egresados y colaboradores de la Facultad.
            No reemplaza los procesos editoriales de las revistas.
          </p>
        </div>
        <div className="text-sm">
          <p className="font-semibold text-white">Explorar</p>
          <ul className="mt-2 space-y-1">
            <li><Link to="/publicaciones" className="hover:text-naranja">Catálogo de publicaciones</Link></li>
            <li><Link to="/publicaciones?orden=reciente" className="hover:text-naranja">Publicaciones recientes</Link></li>
            <li><Link to="/login" className="hover:text-naranja">Acceso administrativo</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Facultad de Ingeniería — UCSS
      </div>
    </footer>
  );
}

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Saltar al contenido
      </a>
      <Header />
      <main id="contenido" className="flex-1">
        <TransicionPagina />
      </main>
      <Footer />
    </div>
  );
}
