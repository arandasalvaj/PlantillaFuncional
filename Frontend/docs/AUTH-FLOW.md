# Flujo de Autenticación — Plantilla Angular + ApiLogin V2

Este documento explica de forma completa y ordenada cómo funciona la autenticación: desde que el usuario ingresa su contraseña hasta que accede (o no) a una ruta protegida.

---

## Actores

| Actor | Rol |
|---|---|
| **ApiLogin V2** | Microservicio central. Verifica credenciales, emite JWT, consulta permisos en la base de datos. |
| **Backend (Plantilla)** | Proxy intermedio. Valida JWT en rutas protegidas y reenvía consultas de permisos a ApiLogin. Evita CORS. |
| **Frontend Angular** | Lee el JWT desde cookie, protege rutas con guards y adjunta el token en cada petición HTTP. |

---

## Paso a paso

### 1. Login — ApiLogin V2 hace el trabajo

El usuario **no hace login en la plantilla**. El login ocurre en el portal de ApiLogin V2.

```
Usuario ingresa credenciales → POST /auth/authenticate (ApiLogin V2)
```

**¿Qué hace ApiLogin V2?**
1. Busca al usuario primero en el **servidor NUEVO** (PostgreSQL/MySQL).
2. Si no lo encuentra, busca en el **servidor VIEJO** (SQL Server legacy).
3. Verifica la contraseña con bcrypt.
4. Si es válida, genera un **JWT** que contiene:
   - `sub` → ID del usuario (lo necesitan todos los demás sistemas)
   - `exp` → Timestamp de expiración (6 horas)
   - `jti` → ID único del token
5. Guarda el JWT en una **cookie `auth_token`** con estas características:
   - `httpOnly: false` → Angular puede leerla con `document.cookie`
   - `domain: .hospitalcalama.cl` → Compartida entre todos los subdominios
   - `sameSite: lax` → Funciona entre subdominios
   - Duración: 6 horas

---

### 2. El usuario llega a la Plantilla Angular

El frontend Angular carga. Antes de mostrar cualquier ruta protegida, **lee la cookie**:

```ts
// auth.service.ts
initFromCookie('auth_token')
```

¿Qué hace este método?
1. Busca la cookie `auth_token` con `document.cookie`.
2. Decodifica el JWT (sin verificar firma, solo extrae el payload).
3. Extrae `sub` → lo guarda como `userId`.
4. Extrae `exp` → programa un temporizador para hacer `clear()` cuando expire.
5. Intenta restaurar `accessData` desde `sessionStorage` si existe y no venció (TTL 30 min).

---

### 3. Guard `authGuard` — ¿Hay token?

Al navegar a cualquier ruta protegida (ej: `/dashboard`):

```ts
canActivate: [authGuard, aclGuard]
```

`authGuard` verifica únicamente que **existe un token**:

```
¿Hay token? → SÍ → continúa al siguiente guard
             → NO → redirige a /errors/unauthorized
```

---

### 4. Guard `aclGuard` — ¿Tiene acceso al sistema?

Este guard verifica que el usuario tiene acceso al **sistema específico** consultando a ApiLogin V2 a través del proxy del backend.

#### Fast path (caché disponible)
Si `accessData` ya está en memoria (o se restauró de `sessionStorage`):
```
¿accessData.rol está en roles permitidos? → SÍ → accede
                                          → NO → redirige a /errors/unauthorized
```

#### Slow path (primera vez o caché vencido)
Llama a `ensureAccess$()` que hace:

```
Angular → POST /api/auth/hasaccess (Backend Plantilla)
           ↓  (reenvía el Authorization header + id + sistema)
         POST /api/usuario/hasaccess (ApiLogin V2)
           ↓  (consulta la DB)
         { has_access: true/false, rol, profesion, servicio, nombre_completo }
```

**Si `has_access: true`:**
- Guarda `accessData` en el signal y en `sessionStorage` con timestamp.
- Verifica `rol` y `profesion` contra los definidos en la ruta.

**Si `has_access: false`:**
- Limpia todo (`clear()`) y redirige a `/errors/unauthorized`.

> **¿Por qué el proxy del Backend?** Para evitar problemas de CORS. El navegador no puede llamar directamente a ApiLogin V2 desde Angular. El Backend de la Plantilla actúa como intermediario y reenvía los headers de autenticación intactos.

---

### 5. Lo que hace ApiLogin V2 al recibir `/api/usuario/hasaccess`

```ts
// Recibe: { id: 42, sistema: "URGENCIA_NEW" }
```

Hace una consulta a la BD que verifica:
1. Que el usuario exista y esté activo (`deleted_at IS NULL`).
2. Que tenga un registro en `RoleUserSistemaWeb` con `vigencia: true`.
3. Que ese registro esté asociado al sistema solicitado (`SistemaWeb.nombre = 'URGENCIA_NEW'` y `Vigencia: true`).

Si todo cumple, responde:
```json
{
  "has_access": true,
  "username": "jperez",
  "rol": "Admin",
  "profesion": "Médico",
  "servicio": "UCI",
  "nombre_completo": "Juan Pérez González"
}
```

---

### 6. Rutas protegidas por rol — `aclGuard` con `route.data`

Se pueden agregar restricciones de rol o profesión directamente en la definición de rutas:

```ts
{
  path: 'configuracion',
  canActivate: [authGuard, aclGuard],
  data: {
    roles: ['Admin'],           // Solo Admin puede entrar
    profesiones: ['Informático'] // O por profesión (opcional)
  },
  loadChildren: () => import('./features/configuracion/configuracion.routes')
}
```

`aclGuard` compara `accessData.rol` contra `roles` y `accessData.profesion` contra `profesiones`. Ambos son opcionales (si no se define, no se restringe).

---

### 7. Guards adicionales por acción — `createRoleGuard`

Para proteger acciones específicas dentro de una página (no solo la ruta):

```ts
// role.guard.ts
export const canEditExample = createRoleGuard(['Admin', 'User']);
export const canManageConfig  = createRoleGuard(['Admin']);
```

Uso en rutas o botones que llamen a rutas secundarias.

---

### 8. `PermissionsService` — permisos reactivos en templates

Para mostrar/ocultar elementos en el HTML según el rol:

```ts
// Inyectar en el componente
readonly permissions = inject(PermissionsService);
```

```html
<!-- En el template -->
<button *ngIf="permissions.canEditExample()">Editar</button>
<span *ngIf="permissions.isAdmin()">Panel Admin</span>
```

Los valores son **signals computados**, se actualizan automáticamente cuando cambia `accessData`.

---

### 9. Interceptor HTTP — Token automático en cada petición

`authInterceptor` adjunta el JWT automáticamente a **todas las peticiones HTTP**:

```ts
// Resultado en cada request:
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

Así el Backend de la Plantilla puede validar el token con `validateToken` antes de procesar rutas protegidas (`/api/*` excepto `/api/auth/*`).

---

### 10. Expiración del token

El `AuthService` programa un `setTimeout` para cuando venza el JWT:

```
exp (timestamp) → setTimeout( clear(), ms restantes )
```

Al ejecutarse:
- Limpia todos los signals (`token`, `accessData`, `userId`, etc.)
- Borra `sessionStorage`
- La próxima navegación a una ruta protegida redirige a `/errors/unauthorized`

---

## Diagrama del flujo completo

```
Usuario
  │
  ▼
[ApiLogin V2 Frontend]
  POST /auth/authenticate
  │
  ▼
[ApiLogin V2 Backend]
  ├─ Verifica credenciales (NEW → OLD fallback)
  ├─ Genera JWT (sub=userId, exp=6h)
  └─ Guarda en cookie auth_token (.hospitalcalama.cl)
  │
  ▼
[Navegador con cookie]
  │
  ▼
[Angular Frontend — Plantilla]
  initFromCookie()
  ├─ Lee cookie → decodifica JWT → extrae userId, exp
  └─ Restaura accessData de sessionStorage si existe
  │
  ▼
[authGuard]
  ├─ ¿Hay token? → NO → /errors/unauthorized
  └─ SÍ → continúa
  │
  ▼
[aclGuard]
  ├─ ¿accessData en caché? → SÍ → verifica rol → accede o deniega
  └─ NO → POST /api/auth/hasaccess (Backend Plantilla)
              │
              ▼
          [Backend Plantilla — Proxy]
              POST API_LOGIN_URL/api/usuario/hasaccess
              │
              ▼
          [ApiLogin V2 Backend]
              ├─ Consulta DB: usuario → rolesSistemasWeb → SistemaWeb
              └─ Responde { has_access, rol, profesion, servicio, nombre_completo }
              │
              ▼
          Angular guarda accessData en signal + sessionStorage (TTL 30 min)
          │
          ▼
      ¿has_access && rol permitido? → SÍ → accede al dashboard
                                    → NO → /errors/unauthorized
```

---

## Variables de entorno necesarias

### Backend (`/Backend/.env`)

| Variable | Descripción |
|---|---|
| `API_LOGIN_URL` | URL base de ApiLogin V2 (ej: `http://apilogin.hospitalcalama.cl`) |
| `AUTH_TLS_VERIFY` | `false` en desarrollo, `true` en producción (verificación SSL hacia ApiLogin) |
| `JWT_SECRET` | Secret para validar tokens emitidos por ApiLogin V2 (debe ser el mismo) |

### Frontend (`/Frontend/src/environments/environment.ts`)

| Variable | Descripción |
|---|---|
| `apiBaseUrl` | URL del Backend de la Plantilla (ej: `http://localhost:3000/api`) |
| `systemName` | Nombre del sistema tal como está registrado en ApiLogin (reemplaza el placeholder `URGENCIA_NEW`) |
| `accessDataTtlMs` | TTL del caché de permisos en ms (default: 30 minutos) |

---

## Resumen rápido para quien use la plantilla

1. **Configura `API_LOGIN_URL`** en el `.env` del backend apuntando a ApiLogin V2.
2. **Configura `systemName`** en el `environment.ts` con el nombre exacto del sistema en ApiLogin.
3. **El sistema debe estar registrado** en ApiLogin V2 (tabla `SistemaWeb`) con `Vigencia: true`.
4. **Los usuarios deben tener** un registro en `RoleUserSistemaWeb` para ese sistema.
5. Activa los guards en `app.routes.ts`: `canActivate: [authGuard, aclGuard]`.
6. Usa `route.data: { roles: ['Admin'] }` para restringir por rol si es necesario.
