#!/usr/bin/env node
/**
 * Diagnóstico de la conexión con el ApiLogin V2 local.
 *
 *   node scripts/diagnostico-local.mjs [--usuario <username>]
 *
 * Cuando el login local no anda, el síntoma casi nunca señala la causa: un
 * JWT_SECRET distinto se ve como "Token inválido", un sistema sin registrar en
 * SistemaWeb se ve como "sin acceso", y ApiLogin apagado se ve como un 500
 * cualquiera. Este script recorre la cadena en orden y dice cuál eslabón se
 * cortó y qué hacer.
 *
 * Sin dependencias: node:fs + node:crypto + fetch.
 */
import { readFileSync, existsSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENV = join(RAIZ, 'Backend', '.env');
const TIMEOUT_MS = 4000;

const args = process.argv.slice(2);
const usuario = args[args.indexOf('--usuario') + 1];
const tieneUsuario = args.includes('--usuario') && usuario && !usuario.startsWith('--');

let fallas = 0;
const ok = (t, d) => console.log(`✅ ${t}${d ? `\n     ${d}` : ''}`);
const mal = (t, comoArreglar) => {
  fallas++;
  console.log(`❌ ${t}\n     → ${comoArreglar.split('\n').join('\n       ')}`);
};
const info = t => console.log(`·  ${t}`);
const corte = motivo => {
  console.log(`\n🛑 Corto acá: ${motivo}\n`);
  process.exit(1);
};

console.log('\n🔎 Diagnóstico del login local\n');

/* ─ 1. El .env ─ */
if (!existsSync(ENV)) {
  mal(
    'Backend/.env no existe.',
    'cp Backend/.env.example Backend/.env  y completá los valores.'
  );
  corte('sin .env no hay nada más que revisar.');
}
ok('Backend/.env existe.');

/** Parser mínimo de .env. Cuidado con el \r: en Windows el archivo llega CRLF. */
const env = {};
for (const linea of readFileSync(ENV, 'utf8').split(/\r?\n/)) {
  const limpia = linea.trim();
  if (!limpia || limpia.startsWith('#')) continue;
  const i = limpia.indexOf('=');
  if (i < 0) continue;
  env[limpia.slice(0, i).trim()] = limpia
    .slice(i + 1)
    .trim()
    .replace(/^["']|["']$/g, '');
}

const { JWT_SECRET, API_LOGIN_URL, SISTEMA_APILOGIN } = env;
const leer = ruta => (existsSync(ruta) ? readFileSync(ruta, 'utf8') : null);

// El default sale del código y no de una constante acá: así el diagnóstico
// dice la verdad también en un sistema derivado que lo haya cambiado.
const porDefecto =
  leer(join(RAIZ, 'Backend', 'src', 'index.ts'))?.match(/process\.env\.PORT\)\s*\|\|\s*(\d+)/)?.[1] ?? '3001';
const PORT = env.PORT || porDefecto;

/* ─ 2. Variables mínimas ─ */
if (!JWT_SECRET) {
  mal(
    'JWT_SECRET vacío en Backend/.env.',
    'Copiá el MISMO valor que tiene el Backend/.env de tu ApiLogin V2 local.\n' +
      'Sin él este backend ni siquiera valida tokens (fail-fast a propósito).'
  );
} else {
  ok('JWT_SECRET presente.');
}

if (!SISTEMA_APILOGIN) {
  mal(
    'SISTEMA_APILOGIN vacío en Backend/.env.',
    'Es el nombre EXACTO y case-sensitive con el que el sistema figura en la\n' +
      'tabla SistemaWeb de ApiLogin. Sin él, hasaccess deniega a todo el mundo.'
  );
} else {
  ok(`SISTEMA_APILOGIN = "${SISTEMA_APILOGIN}"`);
}

if (!API_LOGIN_URL) {
  mal(
    'API_LOGIN_URL vacío en Backend/.env.',
    'Para desarrollo local: API_LOGIN_URL=http://localhost:3000\n' +
      'Vacío ya no significa "modo mock": hasaccess devuelve has_access:false.'
  );
  corte('sin API_LOGIN_URL no hay a quién consultarle.');
}

const puertoDe = url => {
  try {
    const u = new URL(url);
    return u.port || (u.protocol === 'https:' ? '443' : '80');
  } catch {
    return null;
  }
};

const base = API_LOGIN_URL.replace(/\/$/, '');
ok(`API_LOGIN_URL = ${base}`);
if (!/localhost|127\.0\.0\.1/.test(base)) {
  info('⚠️  Ojo: no apunta a tu máquina. Para desarrollo local va http://localhost:3000');
} else if (puertoDe(base) !== '3000') {
  info(`⚠️  El backend del ApiLogin V2 es el ÚNICO puerto fijo del ecosistema: :3000.`);
  info(`   Éste apunta a :${puertoDe(base)}. Si no lo moviste a propósito, revisalo.`);
}

/* ─ Choques de puerto ─
   No se ven en ningún log: el backend no arranca, o arranca y el frontend le
   habla al vacío, o le habla y CORS lo rechaza. Los tres se leen como "no me
   puedo conectar al ApiLogin", que no es.

   El ÚNICO puerto fijo del ecosistema es el :3000 del backend de ApiLogin.
   Todo lo demás varía por máquina, así que nada se da por sentado acá: cada
   puerto se lee del archivo del repo que lo declara. */
const puertoApiLogin = puertoDe(base);
if (puertoApiLogin === PORT) {
  mal(
    `Este backend y el ApiLogin quieren el MISMO puerto (:${PORT}).`,
    'El ApiLogin V2 es el punto fijo en :3000, así que se mueve este backend.\n' +
      'Poné otro PORT en Backend/.env (ej: PORT=3001) y ajustá apiBaseUrl en\n' +
      'Frontend/src/environments/environment.ts al mismo número.\n' +
      'Si no, este backend ni siquiera arranca: el puerto ya está tomado.'
  );
}

/* ¿El frontend le pega al puerto donde escucha este backend? */
const envFront = leer(join(RAIZ, 'Frontend', 'src', 'environments', 'environment.ts'));
const apiBaseUrl = envFront?.match(/apiBaseUrl:\s*['"]([^'"]+)['"]/)?.[1];
if (apiBaseUrl) {
  const puertoLlamado = puertoDe(apiBaseUrl);
  if (puertoLlamado && puertoLlamado !== PORT) {
    mal(
      `El frontend llama a :${puertoLlamado} pero este backend escucha en :${PORT}.`,
      `environment.ts dice apiBaseUrl = ${apiBaseUrl}, y Backend/.env dice PORT=${PORT}.\n` +
        'Hacé que coincidan. Mientras no coincidan, toda llamada del frontend\n' +
        'muere antes de salir y parece un problema de sesión.'
    );
  } else if (puertoLlamado) {
    ok(`El frontend y el backend hablan del mismo puerto (:${PORT}).`);
  }
}

/* ¿En qué puerto sirve el frontend? Sale del script `start`, que es el único
   lugar del repo que lo declara. Se avisa de dónde salió: si lo levantás a
   mano en otro puerto, el chequeo de CORS de más abajo mira el que no es. */
const pkgFront = leer(join(RAIZ, 'Frontend', 'package.json'));
const puertoFront = (() => {
  try {
    return JSON.parse(pkgFront ?? '{}').scripts?.start?.match(/--port\s+(\d+)/)?.[1] ?? '4200';
  } catch {
    return '4200';
  }
})();
const origenFront = `http://localhost:${puertoFront}`;

/* ¿Dónde está el portal de login? NO se asume :4200 — el único puerto fijo del
   ecosistema es el :3000 del backend de ApiLogin; todo lo demás varía por
   máquina. Se lee de core/entorno.ts, que es el que manda: es la URL a la que
   el sistema redirige de verdad al desloguear. */
const entornoTs = leer(join(RAIZ, 'Frontend', 'src', 'app', 'core', 'entorno.ts'));
const PORTAL_URL = entornoTs?.match(/ES_LOCAL\s*\?\s*['"](https?:\/\/[^'"]+)['"]/)?.[1] ?? null;
const puertoPortal = PORTAL_URL ? puertoDe(PORTAL_URL) : null;

/* El choque frontend↔portal NO se juzga acá: que `start` y LOGIN_URL coincidan
   en el papel no significa que choquen de verdad — servir el front en otro
   puerto a mano es normal y perfectamente válido. El veredicto se da más abajo,
   cuando ya sabemos QUIÉN contesta en la URL del portal. */
const tituloDe = html => html?.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() || null;
const miTitulo = tituloDe(leer(join(RAIZ, 'Frontend', 'src', 'index.html')));

/**
 * El timer se limpia SIEMPRE. Con AbortSignal.timeout() quedaba un handle vivo
 * y el proceso reventaba al salir en Windows ("Assertion failed: UV_HANDLE_CLOSING"),
 * devolviendo 127 en vez del código de salida real.
 */
const pedir = async (url, opciones = {}) => {
  const ac = new AbortController();
  let vencio = false;
  const timer = setTimeout(() => {
    vencio = true;
    ac.abort();
  }, TIMEOUT_MS);
  try {
    const r = await fetch(url, { ...opciones, signal: ac.signal });
    return { r, texto: await r.text() };
  } catch (e) {
    return { error: e, vencio };
  } finally {
    clearTimeout(timer);
  }
};

/* ─ 3. ¿ApiLogin está levantado? ─ */
const salud = await pedir(`${base}/health`);
if (salud.error) {
  mal(
    `No hay nadie escuchando en ${base} (${salud.vencio ? 'timeout' : 'conexión rechazada'}).`,
    'Levantá el ApiLogin V2 en su repo:  pnpm dev:backend   (queda en :3000)\n' +
      'Si lo tenés corriendo en otro puerto, ajustá API_LOGIN_URL.'
  );
  corte('sin ApiLogin arriba, el resto de las pruebas no significan nada.');
}
ok(`ApiLogin V2 responde en ${base} (HTTP ${salud.r.status}).`);

/* ─ 4. ¿El JWT_SECRET es el mismo? ─
   Se firma un token acá y se le pide a ApiLogin que lo valide. Si los secretos
   difieren, su verifyToken responde 401 "Token inválido" — el mismo mensaje que
   ves en el navegador cuando el login "no anda" sin explicar por qué. */
if (JWT_SECRET) {
  const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
  const ahora = Math.floor(Date.now() / 1000);
  // issuer/audience son los que exige el verify de ApiLogin: sin ellos el token
  // se rechazaría aunque el secreto fuese correcto, y el diagnóstico mentiría.
  const cuerpo = b64({
    sub: '1',
    userId: 1,
    iss: 'hospitalcalama.cl',
    aud: 'hospitalcalama.cl',
    iat: ahora,
    nbf: ahora,
    exp: ahora + 60,
  });
  const cabecera = b64({ alg: 'HS256', typ: 'JWT' });
  const firma = createHmac('sha256', JWT_SECRET).update(`${cabecera}.${cuerpo}`).digest('base64url');
  const token = `${cabecera}.${cuerpo}.${firma}`;

  const prueba = await pedir(`${base}/api/usuario/grupos`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (prueba.error) {
    mal('No pude probar el JWT_SECRET.', `La consulta falló: ${prueba.error.message}`);
  } else if (prueba.r.status === 401 && /inválido|invalid/i.test(prueba.texto)) {
    mal(
      'El JWT_SECRET NO coincide con el del ApiLogin V2 local.',
      'ApiLogin rechaza un token firmado con tu secreto ("Token inválido").\n' +
        'Copiá el JWT_SECRET del Backend/.env de tu ApiLogin V2 a este Backend/.env.\n' +
        'Es la causa más común: se ve como un problema de login y es de firma.'
    );
  } else {
    ok('JWT_SECRET coincide con el del ApiLogin V2.', `(su /api/usuario/grupos respondió ${prueba.r.status}, no lo rechazó por firma)`);
  }
}

/* ─ 5. hasaccess: ¿ApiLogin llega a su base de datos? ─ */
if (SISTEMA_APILOGIN) {
  // checkAccess de ApiLogin resuelve por `id` si viene, y si no por `username`.
  // Sin --usuario se manda una consulta que no puede matchear a nadie: alcanza
  // para saber si el servicio responde y llega a su base de datos.
  const cuerpo = tieneUsuario
    ? { username: usuario, sistema: SISTEMA_APILOGIN }
    : { sistema: SISTEMA_APILOGIN };
  const acceso = await pedir(`${base}/api/usuario/hasaccess`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });

  if (acceso.error) {
    mal('hasaccess no respondió.', acceso.error.message);
  } else if (acceso.r.status === 503) {
    mal(
      'ApiLogin respondió pero NO llega a su base de datos (503).',
      'El problema es del ApiLogin V2, no de este sistema: revisá las variables\n' +
        'DB_* de su .env y que el SQL Server esté alcanzable desde tu máquina.'
    );
  } else if (acceso.r.status === 422) {
    mal('hasaccess rechazó la consulta (422).', `Respuesta: ${acceso.texto.slice(0, 200)}`);
  } else if (tieneUsuario) {
    const datos = JSON.parse(acceso.texto || '{}');
    if (datos.has_access) {
      ok(
        `"${usuario}" TIENE acceso a "${SISTEMA_APILOGIN}".`,
        `rol: ${datos.rol || '(sin rol)'} · ${datos.nombre_completo || 'sin nombre'}`
      );
    } else {
      mal(
        `"${usuario}" NO tiene acceso a "${SISTEMA_APILOGIN}".`,
        'Puede ser una de tres, y ApiLogin no las distingue en la respuesta:\n' +
          `1. El username "${usuario}" no existe (¿está bien escrito?).\n` +
          `2. El sistema no está en SistemaWeb con el nombre EXACTO "${SISTEMA_APILOGIN}" (Vigencia = true).\n` +
          '3. Está registrado, pero a ese usuario no le asignaron rol en RoleUserSistemaWeb.'
      );
    }
  } else {
    ok('hasaccess responde y ApiLogin llega a su base de datos.');
    info('Para probar el acceso de alguien:  node scripts/diagnostico-local.mjs --usuario <username>');
  }
}

/* ─ 6. El portal de login (a donde redirige el logout) ─ */
if (!PORTAL_URL) {
  info('No pude leer LOGIN_URL local de core/entorno.ts — salteo la prueba del portal.');
} else {
  const portal = await pedir(PORTAL_URL);
  const tituloServido = tituloDe(portal.texto);

  if (portal.error) {
    info(`⚠️  El portal de login no responde en ${PORTAL_URL}.`);
    info('   Levantalo con  pnpm dev:frontend  en el repo del ApiLogin V2.');
    info('   Si lo servís en otro puerto, cambiá LOGIN_URL en core/entorno.ts.');
    info('   La API funciona igual, pero el logout y /errors/unauthorized te dejan en la nada.');
  } else if (miTitulo && tituloServido === miTitulo) {
    // Evidencia, no suposición: en la URL del portal contesta ESTA app.
    mal(
      `En ${PORTAL_URL} contesta ESTA app, no el portal de login.`,
      `Lo sirvió con el mismo <title> que Frontend/src/index.html ("${miTitulo}").\n` +
        'El logout y /errors/unauthorized te devuelven acá mismo, en un círculo.\n' +
        '\n' +
        'Uno de los dos está mal, y cuál depende de dónde tengas el portal:\n' +
        '· si el portal va en esa URL → serví esta app en otro puerto\n' +
        '  ("start": "ng serve --port <otro>" y sumá el origen a CORS_ORIGINS).\n' +
        '· si el portal está en otra parte → corregí LOGIN_URL en core/entorno.ts.'
    );
  } else {
    ok(`Portal de login arriba en ${PORTAL_URL}.`, tituloServido ? `("${tituloServido}")` : null);

    // Realidad OK, papel no. No es un error: es lo que te espera el día que
    // alguien corra `pnpm start` sin acordarse de pisar el puerto a mano.
    if (puertoPortal && puertoFront === puertoPortal) {
      info(`⚠️  Ojo: el script "start" de Frontend/package.json también apunta a :${puertoFront}.`);
      info('   Hoy no chocan porque estás sirviendo esta app en otro puerto,');
      info('   pero un `pnpm start` limpio le pelearía el puerto al portal.');
    }
  }
}

/* ─ 7. Este backend ─
   No alcanza con que "algo responda" en el puerto: si choca con el ApiLogin,
   quien contesta es el ApiLogin y el diagnóstico diría que está todo bien.
   Se exige la firma de NUESTRO /healthz: { ok: true }. */
const propio = await pedir(`http://localhost:${PORT}/healthz`);
let esNuestro = false;
try {
  esNuestro = JSON.parse(propio.texto ?? '{}').ok === true;
} catch {
  esNuestro = false;
}

if (propio.error) {
  info(`Este backend no responde en :${PORT} — levantalo con  cd Backend && pnpm dev`);
  info('   (con él arriba, este script además prueba CORS de verdad)');
} else if (!esNuestro) {
  mal(
    `En :${PORT} responde algo, pero NO es este backend.`,
    `Su /healthz no devolvió { ok: true }. Casi siempre es el ApiLogin ocupando\n` +
      'el puerto: elegí otro PORT en Backend/.env y ajustá apiBaseUrl.'
  );
} else {
  ok(`Este backend responde en :${PORT}.`);

  /* ─ 8. CORS, probado de verdad ─
     No se deduce de CORS_ORIGINS: se le manda al backend una request con el
     Origin del frontend y se mira si contesta el header. /healthz no sirve
     para esto porque se registra ANTES del middleware de cors; por eso va
     contra /api, que sí lo atraviesa. */
  const cors = await pedir(`http://localhost:${PORT}/api/ruta-que-no-existe`, {
    headers: { Origin: origenFront },
  });
  const permitido = cors.r?.headers.get('access-control-allow-origin');

  if (cors.error) {
    info(`No pude probar CORS: ${cors.error.message}`);
  } else if (permitido === origenFront || permitido === '*') {
    ok(`CORS deja pasar a ${origenFront}.`, `(puerto sacado del script "start" de Frontend/package.json)`);
  } else {
    mal(
      `CORS NO deja pasar al frontend (${origenFront}).`,
      `El backend no devolvió access-control-allow-origin para ese origen.\n` +
        `Agregalo en Backend/.env:  CORS_ORIGINS=${origenFront}\n` +
        'El navegador bloquea la respuesta y la consola habla de CORS, no de\n' +
        'login — pero el usuario solo ve que no puede entrar.\n' +
        `(Si servís el frontend en otro puerto que ${puertoFront}, es ESE el que va.)`
    );
  }
}

/* ─ Cierre ─ */
if (fallas === 0) {
  console.log('\n✅ Cadena completa. Si igual no podés entrar, el problema está en el navegador:');
  console.log('   revisá que exista la cookie auth_token en localhost (DevTools → Application).\n');
} else {
  console.log(`\n❌ ${fallas} ${fallas === 1 ? 'problema' : 'problemas'}. Arreglá el primero y volvé a correrlo.\n`);
  // exitCode y no exit(): deja que node cierre los sockets de fetch por su
  // cuenta en vez de matarlos a mitad de camino.
  process.exitCode = 1;
}
