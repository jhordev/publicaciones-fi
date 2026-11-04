import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// La aplicación vive siempre bajo la subruta /publicacionesfi/
const BASE = '/publicacionesfi/';

export default defineConfig({
  base: BASE,
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // En desarrollo se replica el proxy de Nginx: /publicacionesfi/api → API Node.js
    proxy: {
      [`${BASE}api`]: { target: 'http://127.0.0.1:3001', changeOrigin: false },
    },
  },
  build: {
    // El build se publica en /var/www/publicacionesfi/public (único frontend servido)
    outDir: '../public',
    emptyOutDir: true,
  },
});
