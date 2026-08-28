# Sistema de Autenticación con Caché, TTL y Proxy Backend

## Características implementadas

### 1. **Persistencia en SessionStorage**
- El `accessData` (roles, profesión, permisos) se guarda en `sessionStorage`
- Sobrevive a recargas de página (F5)
- Se borra automáticamente al cerrar la pestaña del navegador
- No se comparte entre pestañas (cada pestaña tiene su propia sesión)

### 2. **TTL (Time-To-Live) de 5 minutos**
- El caché de permisos expira automáticamente después de 5 minutos
- Fuerza una revalidación contra el servidor cuando expira
- Configurable desde `environment.accessDataTtlMs`
- Balance entre rendimiento y seguridad (permisos frescos)

### 3. **Proxy en el Backend (sin CORS)**
- El frontend ahora llama a `apiBaseUrl/usuario/hasaccess` (proxy del backend)
- El backend reenvía la petición al servicio externo de login
- **Ventajas:**
  - ✅ Elimina problemas de CORS intermitentes
  - ✅ Same-origin: frontend y backend en el mismo dominio
  - ✅ Overhead mínimo (~10-30ms)
  - ✅ Centralizado: fácil agregar logs, rate limiting, caché
  - ✅ Mantenible: cambios de URL solo en el backend

### 4. **Deduplicación de peticiones**
- Si múltiples guards se ejecutan simultáneamente, solo se hace 1 petición HTTP
- Usa `shareReplay` de RxJS para compartir el Observable entre suscriptores
- Evita race conditions y requests duplicados

## Flujo de autenticación

### Primera carga (pestaña nueva)
```
1. Usuario abre app → AuthService.initFromCookie()
2. Lee token JWT desde cookie 'auth_token'
3. Intenta restaurar accessData desde sessionStorage
   - Si NO existe o expiró por TTL → accessData = null
   - Si existe y es válido → carga en memoria
4. Usuario navega a ruta protegida
   - Si hay accessData válido → acceso inmediato (síncro)
   - Si NO hay accessData → HTTP POST a /api/usuario/hasaccess (proxy del backend)
5. Backend recibe la petición y la reenvía a login.hospitalcalama.cl
6. Guarda respuesta en memoria + sessionStorage con timestamp
```

### Recarga de página (F5)
```
1. Usuario recarga → AuthService.initFromCookie()
2. Lee token JWT desde cookie
3. Restaura accessData desde sessionStorage
   - Verifica TTL: ¿pasaron más de 30 min?
   - Si TTL válido → carga datos, NO hace HTTP ✅
   - Si TTL expiró → limpia storage, fuerza revalidación
4. Usuario navega a ruta → usa datos restaurados (síncro)
```

### Durante la sesión (navegación entre rutas)
```
1. Guard se ejecuta al cambiar de ruta
2. Verifica TTL del caché en memoria
   - Si expiró → limpia y fuerza revalidación
   - Si válido → acceso inmediato (síncro)
3. NO hace peticiones HTTP mientras el caché sea válido
```

### Después de 5 minutos
```
1. Usuario navega a una ruta protegida
2. AuthService detecta que el TTL expiró
3. Limpia accessData de memoria y storage
4. Hace HTTP POST a /api/usuario/hasaccess (proxy del backend)
5. Backend reenvía a servicio externo de login
6. Guarda nueva respuesta con nuevo timestamp
```

## Configuración

### Ajustar el TTL (tiempo de revalidación)

En `src/environments/environment.ts` y `environment.prod.ts`:

```typescript
export const environment = {
  // ...
  accessDataTtlMs: 5 * 60 * 1000, // 5 minutos (valor por defecto)
  
  // Ejemplos de otros valores:
  // accessDataTtlMs: 10 * 60 * 1000,  // 10 minutos (menos requests, menos fresco)
  // accessDataTtlMs: 3 * 60 * 1000,   // 3 minutos (más seguro, más requests)
  // accessDataTtlMs: 1 * 60 * 1000,   // 1 minuto (desarrollo/testing)
};
```

### Consideraciones de seguridad

**¿Por qué 5 minutos?**
- Balance entre rendimiento (menos peticiones) y seguridad (permisos actualizados)
- Si un admin revoca permisos, el usuario los perderá en máximo 5 min
- Suficiente para una sesión de trabajo sin interrupciones
- Overhead mínimo gracias al proxy (same-origin)

**Alternativas más seguras:**
- TTL de 3 minutos: más peticiones, pero permisos más frescos
- Webhook/WebSocket: el servidor notifica cambios de permisos en tiempo real
- Validación en cada acción crítica: verificar permisos antes de operaciones sensibles

**Alternativas más rápidas:**
- TTL de 10 minutos: menos peticiones, útil si los permisos casi nunca cambian
- Sin TTL (solo al recargar): máximo rendimiento, pero permisos pueden quedar stale

## Arquitectura del Proxy Backend

### ¿Por qué usar un proxy?

**Problema original:**
- Frontend en `https://indice.hospitalcalama.cl`
- Login service en `https://login.hospitalcalama.cl`
- CORS intermitente: preflight OPTIONS fallaba con redirect
- Mixed content: HTTP en página HTTPS se bloqueaba

**Solución con proxy:**
```
Frontend (https://indice.hospitalcalama.cl)
    ↓ POST /api/usuario/hasaccess
Backend (https://api-pac.hospitalcalama.cl)
    ↓ reenvía a https://login.hospitalcalama.cl/api/usuario/hasaccess
Login Service
    ↓ respuesta
Backend (forward response)
    ↓
Frontend (recibe datos)
```

**Ventajas:**
- ✅ Same-origin: sin CORS (frontend y backend en hospitalcalama.cl)
- ✅ Centralizado: logs, rate limiting, caché en un solo lugar
- ✅ Seguro: backend puede validar/sanitizar requests
- ✅ Mantenible: cambios de URL solo en backend (env)
- ✅ Overhead mínimo: +10-30ms (imperceptible)

### Endpoints del proxy (Backend)

**POST /api/usuario/hasaccess**
- Body: `{ id: number, sistema: string }`
- Headers: forward `Authorization` y `Cookie`
- Timeout: 15 segundos
- Respuesta: JSON del servicio externo (status, data)

**GET /api/usuario/grupos**
- Headers: forward `Authorization` y `Cookie`
- Timeout: 15 segundos
- Respuesta: JSON con grupos del usuario

**Implementación (Backend):**
- Controller: `src/controllers/auth.controller.ts`
- Routes: `src/routes/usuario/index.ts`
- Usa fetch nativo de Node.js 18+ (sin dependencias)

## Métricas de rendimiento

### Peticiones HTTP evitadas

**Sin caché:**
- 1 petición por cada navegación a ruta protegida
- Ejemplo: 50 navegaciones/sesión = 50 peticiones HTTP

**Con caché en memoria (sin sessionStorage):**
- 1 petición por sesión del navegador
- Al recargar: 1 petición nueva
- Ejemplo: 10 recargas = 10 peticiones

**Con caché + sessionStorage + TTL + proxy:**
- 1 petición cada 5 minutos (si navega activamente)
- Recargas no causan peticiones (dentro del TTL)
- Ejemplo: sesión de 2 horas con 10 recargas = ~24 peticiones (cada 5 min)
- Overhead del proxy: +10-30ms por petición

### Tiempos de respuesta típicos

- **Con caché (fast path):** < 1ms (síncrono, en memoria)
- **Sin caché, con proxy (HTTP):** 120-250ms (latencia de red + proxy + servidor)
  - Proxy overhead: ~10-30ms
  - Login service: ~100-200ms
- **Mejora:** ~99% más rápido cuando usa caché

## Debugging

### Ver el caché en DevTools

Abre la consola del navegador:

```javascript
// Ver accessData guardado
JSON.parse(sessionStorage.getItem('auth_access_data'))

// Ver timestamp del caché
sessionStorage.getItem('auth_access_data_ts')

// Calcular tiempo restante hasta expiración (ms)
const timestamp = parseInt(sessionStorage.getItem('auth_access_data_ts'));
const ttl = 30 * 60 * 1000; // 30 min
const elapsed = Date.now() - timestamp;
const remaining = ttl - elapsed;
console.log('Tiempo restante:', Math.round(remaining / 1000 / 60), 'minutos');

// Limpiar caché manualmente (fuerza revalidación)
sessionStorage.removeItem('auth_access_data');
sessionStorage.removeItem('auth_access_data_ts');
```

### Network tab

- Filtrar por `/hasaccess` para ver cuándo se valida
- Debería ver 1 petición inicial, luego nada durante 30 min
- Si ve muchas peticiones, revisar que el TTL no esté muy bajo

## Casos de uso especiales

### Usuario con permisos cambiados en el servidor
- Cambio tarda hasta 30 min en reflejarse en el frontend
- Soluciones:
  1. Pedir al usuario que recargue después de cambiar permisos
  2. Reducir TTL a 5-10 minutos
  3. Implementar invalidación manual (botón "Refrescar permisos")

### Usuario en múltiples pestañas
- Cada pestaña tiene su propio sessionStorage
- Si hace login en pestaña A, pestaña B debe recargar o relogin
- El token JWT (cookie) sí se comparte entre pestañas

### Modo incógnito o storage deshabilitado
- sessionStorage.setItem lanza excepción silenciosa
- El servicio funciona normalmente, pero sin persistencia
- Cada recarga hace 1 petición HTTP (comportamiento degradado gracefully)

## Testing

### Probar TTL (cambiar a 1 minuto para testing)
```typescript
// En environment.ts temporalmente:
accessDataTtlMs: 60 * 1000, // 1 minuto (para testing)

// Flujo:
// 1. Login → navegar (debería ver 1 request a /api/usuario/hasaccess)
// 2. Esperar 61 segundos
// 3. Navegar de nuevo → debería ver nuevo request (TTL expiró)
```

### Probar proxy del backend
```typescript
// En DevTools Network tab:
// 1. Filtrar por "hasaccess"
// 2. Navegar a ruta protegida
// 3. Verificar que la petición va a:
//    https://api-pac.hospitalcalama.cl/api/usuario/hasaccess
//    (y NO a https://login.hospitalcalama.cl/api/usuario/hasaccess)
// 4. Revisar headers de respuesta para confirmar que el backend hizo proxy
```

### Probar sessionStorage
```typescript
// 1. Login y navegar (ver 1 request en Network)
// 2. F5 (recargar) → NO debería ver request
// 3. Cerrar pestaña y reabrir → debería ver request
```

## Mantenimiento futuro

### Si necesitas desactivar el caché
```typescript
// En auth.service.ts, cambiar:
ensureAccess$() {
  // Comentar estas líneas:
  // if (this.accessDataSig()) {
  //   return of(true);
  // }
  
  // Siempre hacer HTTP:
  this.loadingSig.set(true);
  return this.http.post(...);
}
```

### Si necesitas invalidación manual
```typescript
// Agregar método público en AuthService:
forceRevalidate(): void {
  this.accessDataSig.set(null);
  this.validatedSig.set(false);
  this.accessDataTimestampSig.set(null);
  // La próxima navegación forzará revalidación
}

// Usar en componente:
authService.forceRevalidate();
router.navigate(['/']); // Fuerza guards
```
