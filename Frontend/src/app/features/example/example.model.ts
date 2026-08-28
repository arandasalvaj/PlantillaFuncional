/**
 * MODELO DE DOMINIO — la forma que usa TODA la app (componentes, plantillas).
 * Es NUESTRO contrato, no el del backend. Nombres en camelCase, tipos ricos
 * (Date en vez de string, enums en vez de números mágicos).
 *
 * REGLA DE ORO DEL HOSPITAL: la app SIEMPRE consume este modelo, jamás el DTO
 * crudo del backend. Si el backend cambia su respuesta, solo se toca el mapper
 * (example.mapper.ts) — ni un componente se entera.
 */
export interface Example {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  creadoEn: Date;
}
