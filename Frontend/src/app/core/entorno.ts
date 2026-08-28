/**
 * Entorno por HOSTNAME en runtime — el corazón del modelo de IMAGEN ÚNICA.
 *
 * La misma imagen sirve producción y desarrollo: nada de URLs horneadas por
 * build. El frontend decide en runtime según dónde está corriendo:
 *
 *   <sistema>.hospitalcalama.cl      → producción  (cookie auth_token,     login)
 *   <sistema>-dev.hospitalcalama.cl  → desarrollo  (cookie auth_token_dev, login-dev)
 *   localhost                        → local       (cookie auth_token,     ApiLogin local)
 *
 * La API va SIEMPRE por ruta relativa /api (mismo origen, cero CORS en el
 * clúster). Ver environment.ts para la excepción de `ng serve` local.
 */

/** true solo en la máquina del desarrollador (`ng serve`). */
export const ES_LOCAL =
  typeof location !== 'undefined' &&
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1');

/** true en *-dev.hospitalcalama.cl y en desarrollo local. */
export const ES_DEV =
  (typeof location !== 'undefined' && location.hostname.includes('-dev.')) || ES_LOCAL;

/**
 * Cookie de sesión que emite ApiLogin.
 *
 * Espejo EXACTO de ApiLogin (auth/utils/jwt.util.ts): SOLO los hosts `-dev.`
 * reciben auth_token_dev. Un ApiLogin corriendo en localhost emite auth_token,
 * por eso acá NO se usa ES_DEV.
 */
export const AUTH_COOKIE =
  typeof location !== 'undefined' && location.hostname.includes('-dev.')
    ? 'auth_token_dev'
    : 'auth_token';

/** Portal de login del universo correspondiente (para redirecciones). */
export const LOGIN_URL = ES_LOCAL
  ? 'http://localhost:4200'
  : ES_DEV
    ? 'https://login-dev.hospitalcalama.cl'
    : 'https://login.hospitalcalama.cl';
