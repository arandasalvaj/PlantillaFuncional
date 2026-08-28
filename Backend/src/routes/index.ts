// src/routes/index.ts
// Índice de rutas principales con autenticación JWT

import express from 'express';
import { validateToken } from '@middlewares/index';
import AuthController from '@routes/auth/auth.routes';
import { exampleRouter } from '@routes/example.routes';

const router = express.Router();

// RUTAS PÚBLICAS / PROXY (deben ir antes del middleware de validación JWT)
router.use('/auth', AuthController); // NO requiere validateToken (es público)

// 🔒 AUTENTICACIÓN: Protege todas las demás rutas /api/*
router.use(validateToken);

// RUTAS PROTEGIDAS (requieren token JWT) — agregar los módulos nuevos acá:
router.use('/example', exampleRouter); // CRUD de ejemplo — borrarlo al empezar

export default router;
