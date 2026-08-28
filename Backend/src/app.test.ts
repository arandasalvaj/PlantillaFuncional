/**
 * Tests de infraestructura de la app — SIN base de datos, SIN ApiLogin.
 * Regla de la casa: los tests jamás tocan servicios reales; lo que importa
 * acá es que el perímetro (salud, auth, headers de seguridad) no se rompa
 * al agregar módulos.
 */
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from './app';

describe('healthz', () => {
  it('responde 200 con versión, sin tocar la BD', async () => {
    const r = await request(app).get('/healthz');
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
    expect(r.body).toHaveProperty('version');
  });
});

describe('perímetro de seguridad', () => {
  it('sin token → 401 en /api', async () => {
    const r = await request(app).get('/api/example');
    expect(r.status).toBe(401);
  });

  it('CSP y X-Request-Id presentes; x-powered-by ausente', async () => {
    const r = await request(app).get('/api/example');
    expect(r.headers['content-security-policy']).toContain("default-src 'self'");
    expect(r.headers['x-request-id']).toBeDefined();
    expect(r.headers['x-powered-by']).toBeUndefined();
  });

  it('respeta el X-Request-Id entrante (correlación con el ingress)', async () => {
    const r = await request(app).get('/api/example').set('X-Request-Id', 'traza-abc');
    expect(r.headers['x-request-id']).toBe('traza-abc');
  });
});
