/**
 * Schemas de validación Zod para el módulo Example.
 * Convención:  example.schema.ts  (kebab-case)
 *
 * Bonus de Zod: el tipo del body validado sale del schema —
 *   type CreateExample = z.infer<typeof createExampleSchema>;
 * — sin duplicar interfaces a mano.
 */
import { z } from 'zod';

export const createExampleSchema = z.object({
  nombre: z
    .string({ error: 'El nombre es obligatorio' })
    .min(1, 'El nombre es obligatorio')
    .max(100, 'El nombre no puede superar 100 caracteres'),
  descripcion: z.string().max(255).nullish().or(z.literal('')),
  activo: z.boolean().optional(),
});

export const updateExampleSchema = z
  .object({
    nombre: z.string().min(1).max(100).optional(),
    descripcion: z.string().max(255).nullish().or(z.literal('')),
    activo: z.boolean().optional(),
  })
  .refine(o => Object.values(o).some(v => v !== undefined), {
    message: 'Debe enviar al menos un campo para actualizar',
  });

export const exampleIdSchema = z.object({
  id: z.coerce
    .number({ error: 'El ID debe ser un número' })
    .int('El ID debe ser entero')
    .positive('El ID debe ser positivo'),
});

/** Tipos inferidos — usar en services/controllers si se quiere tipar el body. */
export type CreateExample = z.infer<typeof createExampleSchema>;
export type UpdateExample = z.infer<typeof updateExampleSchema>;
