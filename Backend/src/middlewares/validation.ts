/**
 * Validación con Zod (reemplaza a Joi — deuda priorizada del stack).
 *
 * Ventaja clave sobre Joi: el schema ES la fuente del tipo —
 * `z.infer<typeof createExampleSchema>` da el tipo del body validado,
 * sin duplicar interfaces. La respuesta de error mantiene el formato
 * anterior (400 + details por campo), así los routes no cambian.
 */
import { Request, Response, NextFunction } from 'express';
import type { ZodType } from 'zod';

function formatear(error: { issues: Array<{ path: PropertyKey[]; message: string }> }): string[] {
  return error.issues.map(i => (i.path.length ? `${i.path.join('.')}: ${i.message}` : i.message));
}

/** Valida req.body contra un schema Zod (deja en req.body el valor parseado). */
export const validateSchema = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        message: 'Error de validación',
        details: formatear(result.error),
      });
      return;
    }
    req.body = result.data; // valores ya coercionados/limpios
    next();
  };
};

/** Valida req.params contra un schema Zod. */
export const validateParamSchema = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      res.status(400).json({
        message: 'Error de validación en parámetros',
        details: formatear(result.error),
      });
      return;
    }
    next();
  };
};

/** Valida req.query contra un schema Zod (con coerción de tipos vía z.coerce). */
export const validateQuerySchema = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({
        message: 'Query inválida',
        details: formatear(result.error),
      });
      return;
    }
    Object.assign(req.query, result.data); // Express 4: query es getter — mutar, no reasignar
    next();
  };
};
