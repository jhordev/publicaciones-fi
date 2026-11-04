import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTitulo } from '../lib/hooks.js';

const logo = `${import.meta.env.BASE_URL}logo-ucss.png`;

export default function Login() {
  useTitulo('Acceso administrativo');
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [ver, setVer] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const destino = location.state?.desde?.startsWith('/admin') ? location.state.desde : '/admin';

  if (user) return <Navigate to={destino} replace />;

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await login(correo, password);
      navigate(destino, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-fondo px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-marino">
          <ArrowLeft className="h-4 w-4" /> Volver al repositorio
        </Link>
        <div className="card overflow-hidden">
          <div className="h-1.5 bg-naranja" />
          <div className="p-6 sm:p-8">
            <img src={logo} alt="Universidad Católica Sedes Sapientiae" className="h-12 w-auto" />
            <h1 className="mt-6 text-xl font-bold text-marino">Acceso administrativo</h1>
            <p className="mt-1 text-sm text-slate-500">Repositorio de Publicaciones Científicas — Facultad de Ingeniería</p>
            <form onSubmit={enviar} className="mt-6 space-y-4" noValidate>
              <div>
                <label htmlFor="correo" className="label">Correo institucional</label>
                <input id="correo" type="email" autoComplete="username" required className="input h-11"
                  value={correo} onChange={(e) => setCorreo(e.target.value)} />
              </div>
              <div>
                <label htmlFor="password" className="label">Contraseña</label>
                <div className="relative">
                  <input id="password" type={ver ? 'text' : 'password'} autoComplete="current-password" required className="input h-11 pr-10"
                    value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setVer(!ver)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                    aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                    {ver ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              <button className="btn-dark h-11 w-full" disabled={enviando || !correo || !password}>
                {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} Iniciar sesión
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
