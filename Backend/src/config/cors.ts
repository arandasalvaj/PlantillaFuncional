import cors from 'cors';

// Orígenes explícitos desde env (dev: localhost, etc.)
const extraOrigins = (process.env.CORS_ORIGINS || 'http://localhost:4200')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

// Acepta cualquier subdominio de hospitalcalama.cl (http y https)
const hospitalDomain = /^https?:\/\/([a-z0-9-]+\.)*hospitalcalama\.cl(:\d+)?$/i;

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Permitir peticiones sin origin (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (hospitalDomain.test(origin) || extraOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origen no permitido — ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  credentials: true,
});
