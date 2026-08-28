/**
 * Helper / utilidades genéricas.
 * Convención:  nombre-descriptivo.helper.ts
 *
 * Errores async en controllers: Express 5 los reenvía solo al errorHandler
 * global — escribir los handlers async sin try/catch ni wrappers.
 */

/** Formatea fecha a string ISO solo fecha (YYYY-MM-DD) */
export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/** Genera respuesta paginada estándar */
export function paginatedResponse<T>(data: T[], total: number, page: number, limit: number) {
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
