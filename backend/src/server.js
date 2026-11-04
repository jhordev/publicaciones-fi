import { config } from './lib/config.js';
import { crearApp } from './app.js';
import { prisma } from './lib/prisma.js';

const app = crearApp();
const server = app.listen(config.port, config.host, () => {
  console.log(`API Publicaciones FI escuchando en http://${config.host}:${config.port}/api (${config.env})`);
});

function cerrar(signal) {
  console.log(`${signal} recibido, cerrando...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGTERM', () => cerrar('SIGTERM'));
process.on('SIGINT', () => cerrar('SIGINT'));
