# ===================================================================================
# IMAGEN ÚNICA (estándar del hospital para sistemas NUEVOS, jul-2026)
# Un solo contenedor: Express sirve la API en /api y el Angular compilado.
#
# Por qué imagen única: la MISMA imagen corre en producción y en el ambiente
# dev (ns dev) — sin URLs horneadas, sin CORS entre hosts, sin variantes de
# build. El frontend decide su universo por hostname en runtime
# (ver Frontend/src/app/core/entorno.ts).
#
# Puerto 8080: la imagen corre como USER node (no-root) y los puertos <1024
# son privilegiados (lección CAI Ticket: EACCES en el 80).
# ===================================================================================

# ───── Stage 1: build del Frontend (Angular) ────────────────────────────────
FROM node:22-alpine AS front
WORKDIR /app
RUN npm install -g pnpm@10.33.2
# .npmrc del Frontend: consume el design system PRIVADO
# (@hospital-carlos-cisterna-calama/tokens, GitHub Packages) y su .npmrc
# referencia ${GITHUB_TOKEN} para autenticar contra npm.pkg.github.com.
COPY Frontend/package.json Frontend/pnpm-lock.yaml Frontend/.npmrc ./
# Token como BuildKit secret (NO ENV/ARG): NO queda en ninguna capa de la
# imagen. El .npmrc ya lo lee desde ${GITHUB_TOKEN} en tiempo de install.
RUN --mount=type=secret,id=github_token \
    GITHUB_TOKEN="$(cat /run/secrets/github_token)" \
    pnpm install --frozen-lockfile --ignore-scripts
COPY Frontend .
RUN pnpm run build

# ───── Stage 2: deps de producción del Backend (nativas para musl) ──────────
FROM node:22-alpine AS backdeps
WORKDIR /app
RUN npm install -g pnpm@10.33.2 && apk add --no-cache python3 make g++
COPY Backend/package.json Backend/pnpm-lock.yaml Backend/.npmrc ./
# node-linker=hoisted (.npmrc) deja node_modules PLANO → copiable al runtime.
RUN pnpm install --frozen-lockfile --prod

# ───── Stage 3: build del Backend (tsc + pkgroll) ───────────────────────────
FROM node:22-alpine AS back
WORKDIR /app
RUN npm install -g pnpm@10.33.2
COPY Backend/package.json Backend/pnpm-lock.yaml Backend/.npmrc ./
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY Backend .
RUN pnpm build

# ───── Runtime ──────────────────────────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV PUBLIC_DIR=/app/public

COPY --from=backdeps /app/node_modules ./node_modules
COPY --from=back /app/dist ./dist
COPY --from=back /app/package.json ./package.json
# Angular application builder: la salida del browser queda en dist/<proyecto>/browser
COPY --from=front /app/dist/Frontend/browser ./public

# Versión visible: el CI pasa el tag real por build-arg (health y version.json).
ARG APP_VERSION=""
ENV APP_VERSION=$APP_VERSION
RUN printf '{"version":"%s","builtAt":"%s"}' "$APP_VERSION" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > /app/public/version.json

USER node
EXPOSE 8080
CMD ["node", "dist/index.js"]
