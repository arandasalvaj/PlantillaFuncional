/**
 * MAPPER — el ÚNICO lugar que conoce las dos formas (DTO backend ↔ modelo app).
 *
 * ⭐ REGLA DEL HOSPITAL: todo dato que entra del backend pasa por un mapper
 * antes de tocar la app. Beneficio concreto: si mañana el backend renombra
 * `createdAt` a `fecha_creacion` o manda `activo` como 0/1, se corrige UNA
 * línea acá y CERO componentes se rompen. El resto de la app ni se entera.
 *
 * Convención: funciones puras `toModel` (entrada) y `toDto` (salida, si hace
 * falta enviar). Sin estado, testeables en aislamiento.
 */
import type { Example } from './example.model';
import type { ExampleDto } from './example.dto';

/** DTO del backend → modelo de dominio (lo que usa la app). */
export function toExample(dto: ExampleDto): Example {
  return {
    id: dto.id,
    nombre: dto.nombre,
    descripcion: dto.descripcion,
    activo: dto.activo === true || dto.activo === 1,
    creadoEn: new Date(dto.createdAt),
  };
}

/** Modelo de dominio → DTO para enviar al backend (create/update). */
export function toExampleDto(model: Partial<Example>): Partial<ExampleDto> {
  return {
    ...(model.nombre !== undefined && { nombre: model.nombre }),
    ...(model.descripcion !== undefined && { descripcion: model.descripcion }),
    ...(model.activo !== undefined && { activo: model.activo }),
  };
}
