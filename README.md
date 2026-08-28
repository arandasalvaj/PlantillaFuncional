# Plantilla de Sistema — Hospital Carlos Cisterna de Calama

Plantilla oficial para **sistemas nuevos** del hospital. Angular 21 zoneless +
Express 5/TypeScript + Kysely (SQL tipado) en **IMAGEN ÚNICA** (el mismo Express
sirve la API en `/api` y el frontend compilado), con CI/CD, tests, seguridad de
fábrica, ambiente de desarrollo y el flujo de ramas del hospital **ya cableados**.

```
├── Frontend/            ← Angular 21 + Tailwind v4 (signals, standalone, OnPush)
│   └── src/app/
│       ├── auth/        ← módulo de auth REUTILIZABLE (solo se toca roles.ts)
│       ├── core/        ← entorno.ts: universo dev/prod por hostname (NO tocar)
│       ├── features/    ← TUS pantallas van acá
│       └── shared/      ← header, footer, ui (toast, badges, dev-ribbon…)
├── Backend/             ← Express 5 + TS + Kysely (SQL tipado, SQL Server)
│   └── src/
│       ├── routes/      ← index.ts registra los módulos de la API
│       ├── middlewares/ ← validateToken, requireRole (roles), validación Zod
│       ├── services/    ← lógica de negocio (clases) — ejemplo CRUD Kysely
│       ├── types/       ← db.ts: tablas tipadas (pnpm codegen las regenera)
│       ├── config/      ← cors, database
│       └── *.test.ts    ← tests junto al código (vitest, ver sección Tests)
├── Dockerfile           ← imagen única (front + back). No hay dos imágenes.
├── k8s/                 ← manifests de producción y dev (bootstrap una sola vez)
└── .github/workflows/   ← CI/CD completo con guard de ramas
```

## Por qué imagen única

La misma imagen corre en **producción** y en el **ambiente dev** del clúster:

- La API va por ruta **relativa `/api`** → cero CORS, cero URLs horneadas por build.
- El frontend detecta su universo por **hostname en runtime**
  ([`core/entorno.ts`](Frontend/src/app/core/entorno.ts)): en `*-dev.hospitalcalama.cl`
  usa la cookie `auth_token_dev` y el login `login-dev`; en producción, `auth_token` y `login`.
- La franja amarilla "Ambiente de desarrollo" aparece sola en los hosts `-dev`.

## Flujo de trabajo (obligatorio — el CI lo hace cumplir)

```
rama feature ──PR (squash)──▶ desarrollo ──deploy automático──▶ <sistema>-dev.hospitalcalama.cl
                                   │
                                   └──PR (MERGE COMMIT + 1 aprobación)──▶ Produccion ──▶ producción
```

- **Nunca** se pushea directo a `Produccion` ni a `desarrollo` — todo por PR.
- Los PRs a `Produccion` **solo** pueden venir de `desarrollo` (el check `guard-origen`
  rechaza cualquier otra rama) y necesitan **1 aprobación**.
- La versión (`Backend/package.json`) se bumpea **en la promoción**, no en cada feature.
- Hotfix de emergencia: rama `hotfix/*` directo a Produccion + back-merge inmediato a desarrollo.

## Cómo nace un sistema nuevo (checklist)

1. **Crear el repo** desde esta plantilla (botón *Use this template* en GitHub, org
   `Hospital-Carlos-Cisterna-Calama`, repo **privado**).
2. **Buscar y reemplazar** en todo el repo (son TRES placeholders distintos):
   - `urgenciav2` → nombre del sistema en **minúsculas** (ej: `farmacia`).
     Define la imagen ghcr, la app del panel, los hosts y textos de UI.
   - `BD_ENTI_CORPORATIVA` → base de datos real (está en `k8s/*.yaml` **y** en
     `Backend/src/config/database.ts` como fallback local).
   - `URGENCIA_NEW` (en `Frontend/src/environments/*`, `k8s/*.yaml`
     env `SISTEMA_APILOGIN` y `Backend/.env.example`) → el nombre **EXACTO
     y case-sensitive** con el que el sistema está registrado en ApiLogin
     (ej: `FarmaciaNew`, NO `farmacia`). ⚠️ Si esto no coincide, el deploy sale
     verde pero **nadie puede entrar** — `hasaccess` deniega a todos en silencio
     (y `requireRole` respondería 403 a todo).
3. **Registrar el sistema en ApiLogin** (¡el paso que siempre se olvida!):
   crear el sistema en la tabla `SistemaWeb` (Vigencia = true) con ese mismo
   nombre exacto, y asignar los roles de los usuarios de prueba en
   `RoleUserSistemaWeb`. Detalle completo en `Frontend/docs/AUTH-FLOW.md`.
   Ajustar también `Frontend/src/app/auth/roles.ts` a los roles reales del sistema.
4. **Ramas y protecciones** (las configura Sebastián con el molde):
   `Produccion` default + `desarrollo`; protecciones PR-only (1 aprobación + guard en prod).
5. **DNS** (¡ANTES de que nadie consulte los nombres! — cache negativo de 1 hora):
   en el panel `/dns` crear `<sistema>` y `<sistema>-dev` → A → `10.67.14.140` → DNS only.
6. **BD**: confirmar que la base exista en el SQL de prod **y** en el de dev.
7. **Bootstrap del clúster** (una sola vez, lo corre Sebastián):
   `kubectl apply -f k8s/dev.yaml` y `kubectl apply -f k8s/produccion.yaml`.
   ⚠️ No re-aplicar después: pisa la imagen del CI con el placeholder.
8. **Primer deploy**: mergear cualquier PR a `desarrollo` → el CI construye
   `dev-<sha7>` y lo despliega al ns dev. Probar en `https://<sistema>-dev.hospitalcalama.cl`.
9. **Primera promoción**: bump en `Backend/package.json` (PR a desarrollo) →
   PR `desarrollo → Produccion` con *Create a merge commit*.

## Desarrollo local

```bash
# ApiLogin V2 corriendo en tu máquina PRIMERO (backend 3000, frontend 4200).
# Sin él no hay sesión: este sistema no tiene login propio.

# Token del registry privado (una sola vez por máquina, para @hospital-carlos-cisterna-calama)
pnpm config set "//npm.pkg.github.com/:_authToken" TU_PAT_CON_read:packages

# Backend (puerto 3010 — el 3000 lo ocupa ApiLogin)
cd Backend && pnpm install && pnpm dev

# Frontend (puerto 4300 — el 4200 lo ocupa el frontend de ApiLogin)
cd Frontend && pnpm install && pnpm start

# Tests del backend (services mockeados — no necesitan BD ni ApiLogin)
cd Backend && pnpm test          # pnpm test:watch para desarrollo
```

- ¿No podés entrar? `node scripts/diagnostico-local.mjs` recorre la cadena
  (.env → ApiLogin arriba → JWT_SECRET → hasaccess → portal → CORS) y dice cuál
  eslabón se cortó. Con `--usuario <username>` además verifica el acceso de esa
  persona al sistema.
- Login local: se inicia sesión en el portal de ApiLogin (`http://localhost:4200`),
  que deja la cookie `auth_token` en `localhost`; este frontend la lee de ahí.
- SQL Server: variables en `Backend/.env` (copiar `Backend/.env.example` y completar) —
  en el clúster las inyectan los Secrets; **jamás** commitear credenciales.

## Regla del frontend: TODO dato del backend pasa por un MAPPER

Ningún componente consume la respuesta cruda del backend. El flujo es siempre:

```
backend → DTO (forma exacta del JSON) → mapper → modelo de dominio → componente
```

- **Modelo de dominio** (`*.model.ts`): la forma limpia que usa la app (camelCase,
  `Date`, enums). Es NUESTRO contrato.
- **DTO** (`*.dto.ts`): la forma del backend, tal cual llega. Vive solo en el
  mapper y el service; ningún componente lo importa.
- **Mapper** (`*.mapper.ts`): funciones puras `toModel`/`toDto` — el único lugar
  que conoce las dos formas.
- **Service**: hace el HTTP tipado al DTO y devuelve **siempre** el modelo.

**El porqué**: si el backend cambia su respuesta (renombra un campo, manda `0/1`
en vez de bool, otra estructura), se corrige **una línea en el mapper** y **cero
componentes se rompen**. Ejemplo completo cableado en
[`src/app/features/example/`](Frontend/src/app/features/example/) — copialo como molde.

## Reglas duras del hospital (no negociables)

- Rutas Express **literales antes que `:params`** (shadowing).
- SQL **siempre parametrizado**, un solo pool global (Kysely lo hace por defecto).
- `/healthz` nunca detrás del rate-limit (las probes de k8s lo golpean cada 10s).
- Secrets solo por `secretKeyRef` — nada de claves en el repo ni en los manifests.
- Frontend: convenciones Angular 21 del hospital (signals, standalone, OnPush,
  paleta teal, `dark:` obligatorio en toda clase de color) + **mapper obligatorio**
  para datos del backend (ver arriba).

## Seguridad de fábrica (no tocar salvo que sepas por qué)

Todo sistema nacido de esta plantilla arranca con:

- **CSP estricta** (helmet): todo es same-origin con imagen única, así que
  `'self'` alcanza. Si el frontend llama una API o imagen EXTERNA, agregar ese
  origen en `Backend/src/app.ts` (directivas `connectSrc`/`imgSrc`) — el error
  de la consola del browser dice exactamente qué directiva falta.
- **Logs estructurados con correlation-id**: toda respuesta lleva `X-Request-Id`
  (pino-http). Ante un error de usuario, pedir ese id y buscarlo en los logs
  del pod — es la línea exacta. PII (RUT, nombres, tokens, cookies) se redacta
  sola (`Backend/src/utils/logger.ts`).
- **JWT con algoritmo fijado** (HS256, el de ApiLogin) y fail-fast si falta
  `JWT_SECRET` — jamás un secret por defecto.
- **Autorización por rol EN EL BACKEND** (`requireRole(ROLES.ADMIN, ...)`):
  el frontend solo esconde botones — la regla vive en la ruta
  (ver `example.routes.ts`). El rol sale de ApiLogin (`hasaccess`) con caché
  de 5 min por usuario; requiere el env `SISTEMA_APILOGIN`.
- **Contenedor blindado**: no-root (uid 1000), filesystem de solo lectura
  (solo `/tmp` escribible), sin token de ServiceAccount, seccomp, capabilities
  en cero. Si una lib nueva necesita escribir a disco, que escriba en `/tmp`.
- **Errores async** van solos al `errorHandler` (Express 5) — los controllers
  NO llevan try/catch.
- **CI con ojos**: job `security` (pnpm audit + Trivy) en cada PR — no bloquea
  el merge, pero si sale rojo hay que mirarlo. Dependabot propone updates
  semanales (kysely y tedious tienen candado, ver `.github/dependabot.yml`).

## Tests (patrón de la casa — el CI los corre en cada PR)

```bash
cd Backend && pnpm test        # vitest run (test:watch para desarrollo)
```

Regla: **los tests jamás tocan la BD ni ApiLogin reales** — rutas, controllers
y middlewares corren de verdad; los services se mockean (`vi.mock`). Los dos
archivos incluidos son el molde:

- `src/app.test.ts` — perímetro: healthz, 401 sin token, CSP, request-id.
- `src/controllers/example.controller.test.ts` — **copiar este para cada
  módulo nuevo**: happy path, Zod 400 y requireRole 403 con el service mockeado.

Todo módulo nuevo lleva al menos un test de su controller. No es opcional:
el primer test de esta plantilla encontró un router sin montar que los docs
anunciaban como funcionando.

## Base de datos: Kysely (SQL tipado, sin ORM)

- **Un solo pool** por backend (todas las BDs viven en el mismo SQL Server).
- Tablas de OTRAS bases se cruzan por el mismo pool con nombres de 3 partes
  **tipados**: `db.selectFrom('BD_ENTI_CORPORATIVA.dbo.Pacientes')`.
- `pnpm codegen` (en Backend/, con el .env apuntando al SQL de dev) regenera
  `src/types/db.ts` con TODAS las tablas reales: SQL con autocompletado de
  columnas, sin aprender un ORM.
- Los VALORES siempre parametrizados (Kysely lo hace solo); jamás interpolar
  input del usuario en identificadores.

## Endpoints incluidos

| Ruta | Descripción |
|---|---|
| `GET /healthz` | Health + versión real (la usa Kubernetes y el panel) |
| `GET /version.json` | Versión del frontend (badge flotante) |
| `GET/POST/PUT/DELETE /api/example` | CRUD de ejemplo con JWT + roles (escribir: Admin/User · borrar: solo Admin) — borrarlo al empezar |
| `POST /api/auth/hasaccess` · `GET /api/auth/grupos` | Proxy de acceso y grupos contra ApiLogin |
