import { lazy, Suspense } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import PublicLayout from './components/PublicLayout.jsx';
import { Spinner } from './components/ui.jsx';
import { useAuth } from './context/AuthContext.jsx';
import Home from './pages/Home.jsx';
import Catalogo from './pages/Catalogo.jsx';
import Detalle from './pages/Detalle.jsx';
import Login from './pages/Login.jsx';
import AutorPerfil from './pages/AutorPerfil.jsx';

// El panel administrativo se carga bajo demanda para aligerar el portal público
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout.jsx'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard.jsx'));
const Publicaciones = lazy(() => import('./pages/admin/Publicaciones.jsx'));
const PublicacionForm = lazy(() => import('./pages/admin/PublicacionForm.jsx'));
const Autores = lazy(() => import('./pages/admin/Autores.jsx'));
const Revistas = lazy(() => import('./pages/admin/Revistas.jsx'));
const Catalogos = lazy(() => import('./pages/admin/Catalogos.jsx'));
const Reportes = lazy(() => import('./pages/admin/Reportes.jsx'));
const Usuarios = lazy(() => import('./pages/admin/Usuarios.jsx'));
const Bitacora = lazy(() => import('./pages/admin/Bitacora.jsx'));

function RequiereSesion({ children, soloAdmin }) {
  const { user, cargando, esAdmin } = useAuth();
  const location = useLocation();
  if (cargando) return <Spinner className="min-h-screen" />;
  if (!user) return <Navigate to="/login" replace state={{ desde: location.pathname + location.search }} />;
  if (soloAdmin && !esAdmin) return <Navigate to="/admin" replace />;
  return children;
}

function NoEncontrado() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-serif text-6xl font-bold text-naranja">404</p>
      <h1 className="mt-4 text-2xl font-bold text-marino">Página no encontrada</h1>
      <p className="mt-2 text-slate-500">La dirección que buscó no existe en el repositorio.</p>
      <Link to="/" className="btn-dark mt-6">Ir al inicio</Link>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<Spinner className="min-h-screen" />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="publicaciones" element={<Catalogo />} />
          <Route path="publicaciones/:slug" element={<Detalle />} />
          <Route path="autores/:id" element={<AutorPerfil />} />
          <Route path="*" element={<NoEncontrado />} />
        </Route>
        <Route path="login" element={<Login />} />
        <Route path="admin" element={<RequiereSesion><AdminLayout /></RequiereSesion>}>
          <Route index element={<Dashboard />} />
          <Route path="publicaciones" element={<Publicaciones />} />
          <Route path="publicaciones/nueva" element={<PublicacionForm />} />
          <Route path="publicaciones/:id" element={<PublicacionForm />} />
          <Route path="autores" element={<Autores />} />
          <Route path="revistas" element={<Revistas />} />
          <Route path="catalogos" element={<Catalogos />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="usuarios" element={<RequiereSesion soloAdmin><Usuarios /></RequiereSesion>} />
          <Route path="bitacora" element={<RequiereSesion soloAdmin><Bitacora /></RequiereSesion>} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
