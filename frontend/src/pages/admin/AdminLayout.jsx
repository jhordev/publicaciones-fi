import { Suspense, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3, BookOpenText, ExternalLink, FileText, History, KeyRound, LayoutDashboard, Library, ListTree, LogOut, Menu, UserCog, Users, X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { api } from '../../api/client.js';
import { Campo, Modal, Spinner } from '../../components/ui.jsx';

const logo = `${import.meta.env.BASE_URL}logo-ucss.png`;

const MENU = [
  { to: '/admin', label: 'Dashboard', icono: LayoutDashboard, end: true },
  { to: '/admin/publicaciones', label: 'Publicaciones', icono: FileText },
  { to: '/admin/autores', label: 'Autores', icono: Users },
  { to: '/admin/revistas', label: 'Revistas', icono: Library },
  { to: '/admin/catalogos', label: 'Catálogos', icono: ListTree },
  { to: '/admin/reportes', label: 'Reportes', icono: BarChart3 },
  { to: '/admin/usuarios', label: 'Usuarios', icono: UserCog, admin: true },
  { to: '/admin/bitacora', label: 'Bitácora', icono: History, admin: true },
];

function CambiarPassword({ abierto, onCerrar }) {
  const toast = useToast();
  const [f, setF] = useState({ actual: '', nueva: '', repetir: '' });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const cerrar = () => { setF({ actual: '', nueva: '', repetir: '' }); setError(''); onCerrar(); };
  const guardar = async (e) => {
    e.preventDefault();
    if (f.nueva !== f.repetir) return setError('Las contraseñas no coinciden');
    setEnviando(true);
    try {
      await api('/auth/cambiar-password', { method: 'POST', body: { actual: f.actual, nueva: f.nueva } });
      toast.ok('Contraseña actualizada');
      cerrar();
    } catch (err) {
      setError(err.details?.[0]?.mensaje ?? err.message);
    } finally {
      setEnviando(false);
    }
  };
  return (
    <Modal abierto={abierto} titulo="Cambiar contraseña" onCerrar={cerrar} ancho="max-w-md">
      <form onSubmit={guardar} className="space-y-4">
        <Campo label="Contraseña actual"><input type="password" className="input" autoComplete="current-password" value={f.actual} onChange={(e) => setF({ ...f, actual: e.target.value })} /></Campo>
        <Campo label="Nueva contraseña" ayuda="Mínimo 8 caracteres"><input type="password" className="input" autoComplete="new-password" value={f.nueva} onChange={(e) => setF({ ...f, nueva: e.target.value })} /></Campo>
        <Campo label="Repetir nueva contraseña"><input type="password" className="input" autoComplete="new-password" value={f.repetir} onChange={(e) => setF({ ...f, repetir: e.target.value })} /></Campo>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-outline" onClick={cerrar}>Cancelar</button>
          <button className="btn-dark" disabled={enviando || !f.actual || !f.nueva}>Guardar</button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminLayout() {
  const { user, esAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [menuMovil, setMenuMovil] = useState(false);
  const [cambiarPwd, setCambiarPwd] = useState(false);

  const salir = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const sidebar = (
    <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Menú administrativo">
      {MENU.filter((m) => !m.admin || esAdmin).map(({ to, label, icono: Icono, end }) => (
        <NavLink key={to} to={to} end={end} onClick={() => setMenuMovil(false)}
          className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-naranja text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>
          <Icono className="h-4 w-4" /> {label}
        </NavLink>
      ))}
      <div className="mt-auto border-t border-white/10 pt-3">
        <Link to="/" target="_blank" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-white/10 hover:text-white">
          <ExternalLink className="h-4 w-4" /> Ver portal público
        </Link>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="hidden bg-marino lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="flex items-center gap-2 border-b border-white/10 px-5 py-5">
          <BookOpenText className="h-6 w-6 text-naranja" />
          <div className="leading-tight">
            <p className="text-sm font-bold text-white">Publicaciones FI</p>
            <p className="text-xs text-slate-400">Panel administrativo</p>
          </div>
        </div>
        {sidebar}
      </aside>

      {menuMovil && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuMovil(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-marino">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <p className="font-bold text-white">Publicaciones FI</p>
              <button onClick={() => setMenuMovil(false)} className="text-slate-300" aria-label="Cerrar menú"><X className="h-5 w-5" /></button>
            </div>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button className="btn-ghost px-2 lg:hidden" onClick={() => setMenuMovil(true)} aria-label="Abrir menú"><Menu className="h-5 w-5" /></button>
            <img src={logo} alt="UCSS" className="h-8 w-auto" />
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-semibold text-slate-800">{user.nombres} {user.apellidos}</p>
              <p className="text-xs text-slate-500">{user.rol}</p>
            </div>
            <button className="btn-ghost px-2" onClick={() => setCambiarPwd(true)} title="Cambiar contraseña" aria-label="Cambiar contraseña">
              <KeyRound className="h-4 w-4" />
            </button>
            <button className="btn-outline btn-sm" onClick={salir}><LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Salir</span></button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">
          <Suspense fallback={<Spinner />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <CambiarPassword abierto={cambiarPwd} onCerrar={() => setCambiarPwd(false)} />
    </div>
  );
}

/** Encabezado estándar de las páginas del panel. */
export function Encabezado({ titulo, descripcion, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-marino">{titulo}</h1>
        {descripcion && <p className="mt-1 text-sm text-slate-500">{descripcion}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
