/**
 * DTO — la forma EXACTA que devuelve el backend (tal cual llega el JSON).
 * Vive SOLO acá y en el mapper; ningún componente lo importa nunca.
 *
 * Que sea feo/inconsistente está bien: es lo que hay del otro lado (snake_case,
 * fechas como string, flags 0/1…). El mapper lo traduce al modelo limpio.
 */
export interface ExampleDto {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean | 0 | 1;
  createdAt: string; // ISO string del backend
}
