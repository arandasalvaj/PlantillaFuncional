/**
 * PATRÓN DE TEST DE LA CASA — copiar esto para cada módulo nuevo:
 * rutas + controller + middlewares REALES, services MOCKEADOS (jamás BD).
 * Cubre: happy path, validación Zod (400) y autorización por rol (403).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// Los vi.mock se hoistean solos por encima de los imports.
vi.mock('../services/example.service', () => ({
  ExampleService: {
    getAll: vi.fn().mockResolvedValue([{ id: 1, nombre: 'demo' }]),
    getById: vi.fn(),
    create: vi.fn().mockImplementation(async (body: object) => ({ id: 2, ...body })),
    update: vi.fn(),
    delete: vi.fn().mockResolvedValue({ deleted: true }),
  },
}));
vi.mock('../services/Auth.service', () => ({
  authService: { hasAccess: vi.fn(), getGrupos: vi.fn() },
}));

import app from '../app';
import { authService } from '../services/Auth.service';
import { clearRoleCache } from '../middlewares/requireRole';

const token = (sub: number) => `Bearer ${jwt.sign({ sub }, 'test-secret')}`;
const conRol = (rol: string) =>
  vi.mocked(authService.hasAccess).mockResolvedValue({ has_access: true, rol });

beforeEach(() => clearRoleCache());

describe('GET /api/example', () => {
  it('con token válido → 200 con la lista', async () => {
    const r = await request(app).get('/api/example').set('Authorization', token(1));
    expect(r.status).toBe(200);
    expect(r.body).toEqual([{ id: 1, nombre: 'demo' }]);
  });
});

describe('POST /api/example (validación Zod)', () => {
  it('body inválido → 400 con detalle por campo', async () => {
    conRol('Admin');
    const r = await request(app).post('/api/example').set('Authorization', token(1)).send({});
    expect(r.status).toBe(400);
    expect(r.body.details?.length).toBeGreaterThan(0);
  });

  it('body válido → 201', async () => {
    conRol('Admin');
    const r = await request(app)
      .post('/api/example')
      .set('Authorization', token(1))
      .send({ nombre: 'nuevo' });
    expect(r.status).toBe(201);
    expect(r.body.id).toBe(2);
  });
});

describe('requireRole (el enforcement vive en el backend)', () => {
  it('Consultor NO puede borrar → 403 nombrando el rol requerido', async () => {
    conRol('Consultor');
    const r = await request(app).delete('/api/example/1').set('Authorization', token(1));
    expect(r.status).toBe(403);
    expect(r.body.message).toContain('Admin');
  });

  it('Admin puede borrar → 200', async () => {
    conRol('Admin');
    const r = await request(app).delete('/api/example/1').set('Authorization', token(1));
    expect(r.status).toBe(200);
    expect(r.body.deleted).toBe(true);
  });

  it('sin acceso al sistema → 403', async () => {
    vi.mocked(authService.hasAccess).mockResolvedValue({ has_access: false });
    const r = await request(app).delete('/api/example/1').set('Authorization', token(1));
    expect(r.status).toBe(403);
    expect(r.body.message).toContain('Sin acceso');
  });
});
