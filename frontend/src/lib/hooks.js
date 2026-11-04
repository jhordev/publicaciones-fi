import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client.js';

/** Carga datos de la API y vuelve a cargar cuando cambia la ruta. */
export function useApi(path, { enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(enabled);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!enabled || !path) return;
    const ctrl = new AbortController();
    setCargando(true);
    setError(null);
    api(path, { signal: ctrl.signal })
      .then((d) => setData(d))
      .catch((e) => { if (e.name !== 'AbortError') setError(e); })
      .finally(() => { if (!ctrl.signal.aborted) setCargando(false); });
    return () => ctrl.abort();
  }, [path, enabled, version]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);
  return { data, error, cargando, recargar, setData };
}

export function useDebounce(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function useTitulo(titulo) {
  const prev = useRef(document.title);
  useEffect(() => {
    const anterior = prev.current;
    document.title = titulo ? `${titulo} — Publicaciones FI UCSS` : 'Publicaciones Científicas FI — UCSS';
    return () => { document.title = anterior; };
  }, [titulo]);
}
