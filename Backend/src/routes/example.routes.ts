/**
 * Rutas del módulo Example.
 * Convención:  example.routes.ts  (kebab-case)
 */
import { Router } from 'express';
import { ExampleController } from '../controllers/example.controller';
import { validateSchema, validateParamSchema } from '../middlewares/validation';
import { requireRole, ROLES } from '../middlewares/requireRole';
import { createExampleSchema, updateExampleSchema, exampleIdSchema } from '../schemas/example.schema';

const router = Router();

// validateToken ya corre para todo /api (routes/index.ts). requireRole va
// PRIMERO en la cadena de cada ruta: autorizar antes de validar entrada.
router.get('/', ExampleController.getAll);
router.get('/:id', validateParamSchema(exampleIdSchema), ExampleController.getById);
router.post('/', requireRole(ROLES.ADMIN, ROLES.USER), validateSchema(createExampleSchema), ExampleController.create);
router.put('/:id', requireRole(ROLES.ADMIN, ROLES.USER), validateParamSchema(exampleIdSchema), validateSchema(updateExampleSchema), ExampleController.update);
router.delete('/:id', requireRole(ROLES.ADMIN), validateParamSchema(exampleIdSchema), ExampleController.delete);

export { router as exampleRouter };
