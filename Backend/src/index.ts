import 'dotenv/config';
import app from './app';
import { initDatabase } from './config/database';

const PORT = Number(process.env.PORT) || 3000;

(async () => {
  try {
    await initDatabase('connect');

    const server = app.listen(PORT, () => {
      console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
      console.log(`⚡ Modo: ${process.env.NODE_ENV || 'development'}`);
    });

    /* ─ Apagado limpio (regla del hospital): Kubernetes manda SIGTERM en cada
         rollout — cerrar el server drena las conexiones en vez de cortarlas. ─ */
    const apagar = (senal: string) => {
      console.log(`⏻ ${senal} recibido: cerrando servidor...`);
      server.close(() => {
        console.log('✅ Conexiones drenadas. Adiós.');
        process.exit(0);
      });
      // Red de seguridad: si algo queda colgado, salir igual.
      setTimeout(() => process.exit(1), 10_000).unref();
    };
    process.on('SIGTERM', () => apagar('SIGTERM'));
    process.on('SIGINT', () => apagar('SIGINT'));
  } catch (error) {
    console.error('❌ Error de inicio:', error);
    process.exit(1);
  }
})();

// Manejo de errores globales
process.on('unhandledRejection', err => {
  console.error('Unhandled Rejection:', err);
});

process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
});
