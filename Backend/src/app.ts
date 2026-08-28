import path from 'node:path';
import { randomUUID } from 'node:crypto';
import express from 'express';
import { pinoHttp } from 'pino-http';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middlewares/error.middleware';
import apiRouter from './routes';
import { corsMiddleware } from './config/cors';
import { logger } from './utils/logger';

const app = express();

/* ─ Detrás del ingress del clúster: IP real del cliente (regla del hospital) ─ */
app.set('trust proxy', 1);

/* ─ Health PRIMERO y JAMÁS detrás del rate-limit (incidente OTS 2026):
     las probes de Kubernetes lo golpean cada 10s. Expone la versión real
     (APP_VERSION la inyecta el CI como build-arg). ─ */
app.get('/healthz', (_req, res) =>
  res.json({
    ok: true,
    version: process.env.APP_VERSION || null,
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
  })
);

/* ─ Seguridad y performance ─
   CSP REAL (no false): con imagen única todo es same-origin, así que 'self'
   alcanza. Angular en producción no usa eval ni scripts inline — solo el CSS
   crítico va inline, por eso style-src lleva 'unsafe-inline'.
   Si el frontend algún día llama una API/imagen EXTERNA, agregar ese origen
   a connectSrc/imgSrc acá (el error en la consola del browser lo dice). ─ */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(compression());
app.use(
  rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 300,
    standardHeaders: true,
    legacyHeaders: false,
    skip: req => req.path === '/healthz',
  })
);

/* ─ CORS: en el clúster el frontend vive en el MISMO origen (imagen única),
     así que esto solo importa para `ng serve` local (localhost:4200).
     El middleware cors ya responde los preflight OPTIONS con esta misma
     config (no hace falta un app.options aparte). ─ */
app.use(corsMiddleware);

/* ─ Middleware globales ─ */
app.use(express.json({ limit: '10mb' }));

/* ─ Log HTTP estructurado (pino) con correlation-id:
     cada request lleva un X-Request-Id (se respeta el del ingress si viene) —
     con ese id se correlaciona un error del frontend con la línea exacta del
     log del pod. Los headers sensibles ya los redacta utils/logger. ─ */
app.use(
  pinoHttp({
    logger,
    genReqId: (req, res) => {
      const id = (req.headers['x-request-id'] as string) || randomUUID();
      res.setHeader('X-Request-Id', id);
      return id;
    },
    customLogLevel: (_req, res, err) =>
      err || res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
    // El health responde antes de este middleware, pero por si alguien
    // reordena la cadena: jamás loguear las probes (spamean cada 10s).
    autoLogging: { ignore: req => req.url === '/healthz' },
  })
);

/* ─ Rutas de la API ─ */
app.use('/api', apiRouter);
// Para agregar más módulos, editar src/routes/index.ts:
// import { exampleRouter } from './routes/example.routes';
// router.use('/example', exampleRouter);

/* ─ SPA Angular (modelo IMAGEN ÚNICA, estándar para sistemas nuevos):
     el mismo Express sirve la API en /api y el frontend compilado.
     Assets con hash se cachean; index.html y version.json siempre frescos. ─ */
const PUBLIC_DIR = process.env.PUBLIC_DIR || path.join(__dirname, '..', 'public');
app.use(
  express.static(PUBLIC_DIR, {
    index: false,
    maxAge: '1d',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('version.json')) res.setHeader('Cache-Control', 'no-store');
    },
  })
);
// Express 5: los wildcards llevan nombre — '/{*splat}' (las llaves lo hacen
// opcional para que también matchee '/'). El '*' pelado de Express 4 ya no existe.
app.get('/{*splat}', (req, res, next) => {
  if (req.path.startsWith('/api')) return next(); // 404 JSON para la API
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

/* ─ Manejo centralizado de errores ─ */
app.use(errorHandler);

export default app;
