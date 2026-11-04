import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setCargando(false));
    const expirada = () => setUser(null);
    window.addEventListener('pubfi:sesion-expirada', expirada);
    return () => window.removeEventListener('pubfi:sesion-expirada', expirada);
  }, []);

  const login = useCallback(async (correo, password) => {
    const d = await api('/auth/login', { method: 'POST', body: { correo, password } });
    setUser(d.user);
    return d.user;
  }, []);

  const logout = useCallback(async () => {
    try { await api('/auth/logout', { method: 'POST' }); } finally { setUser(null); }
  }, []);

  const esAdmin = user?.rol === 'Administrador';
  return <AuthContext.Provider value={{ user, cargando, login, logout, esAdmin }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
