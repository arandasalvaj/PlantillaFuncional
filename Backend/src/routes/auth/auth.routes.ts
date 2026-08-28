import express from 'express';

import {authController} from '@controllers/auth.controller';


const router = express.Router();
router.post('/hasaccess', authController.hasAccess.bind(authController));

// Proxy para obtener grupos del usuario
router.get('/grupos', authController.getGrupos.bind(authController));
// 🔒 AUTENTICACIÓN: Protege todas las demás rutas /api/*

export default router;
