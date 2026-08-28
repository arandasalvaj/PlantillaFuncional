/**
 * Tipos de la base de datos para Kysely.
 *
 * ⚙️  GENERADOS: correr `pnpm codegen` (con DB_* en el .env apuntando al SQL
 *     de desarrollo) y este archivo se regenera con TODAS las tablas reales
 *     de tu base — columnas, tipos y nullabilidad incluidos.
 *
 * Mientras tanto, este starter define la tabla del CRUD de ejemplo y muestra
 * cómo declarar tablas de OTRAS bases del mismo servidor (nombres de 3
 * partes) para cruzarlas por el MISMO pool con tipado completo.
 */
import type { ColumnType, Generated } from 'kysely';

export interface ExampleTable {
  id: Generated<number>;
  nombre: string;
  descripcion: string | null;
  activo: Generated<boolean>;
  createdAt: ColumnType<Date, string | undefined, never>;
  updatedAt: ColumnType<Date, string | undefined, string>;
}

/** Ejemplo de tabla de OTRA base (mismo servidor, mismo pool). */
export interface PacienteEnti {
  PacRut: string;
  PacNombre: string;
  PacApellidoPaterno: string | null;
}

export interface DB {
  examples: ExampleTable;
  // Cross-database con tipado: se consulta con
  //   db.selectFrom('BD_ENTI_CORPORATIVA.dbo.Pacientes')...
  'BD_ENTI_CORPORATIVA.dbo.Pacientes': PacienteEnti;
}
