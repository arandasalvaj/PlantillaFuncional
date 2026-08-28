/**
 * Kysely + SQL Server (variante piloto — reemplaza a Sequelize).
 *
 * UNA SOLA instancia/pool para todo el backend (regla de la casa: todas las
 * BDs viven en el mismo SQL Server). Las tablas de OTRAS bases se cruzan por
 * el MISMO pool con nombres de 3 partes tipados — ver src/types/db.ts.
 *
 * Los tipos de las tablas los genera `pnpm codegen` introspectando la base
 * real: el equipo escribe SQL con autocompletado de columnas, sin aprender
 * un ORM.
 */
import { Kysely, MssqlDialect, sql } from 'kysely';
import * as tedious from 'tedious';
import * as tarn from 'tarn';
import dotenv from 'dotenv';
import type { DB } from '../types/db';

dotenv.config();

const dialect = new MssqlDialect({
  tarn: {
    ...tarn,
    // Pool acotado y perezoso: conexiones solo cuando hacen falta.
    options: {
      max: Number(process.env.DB_POOL_MAX) || 5,
      min: 0,
      idleTimeoutMillis: 10_000,
    },
  },
  tedious: {
    ...tedious,
    connectionFactory: () =>
      new tedious.Connection({
        server: process.env.DB_HOST ?? 'localhost',
        authentication: {
          type: 'default',
          options: {
            userName: process.env.DB_USER ?? 'sa',
            password: process.env.DB_PASS ?? '',
          },
        },
        options: {
          database: process.env.DB_NAME ?? 'BD_ENTI_CORPORATIVA',
          port: Number(process.env.DB_PORT) || 1433,
          encrypt: false,
          trustServerCertificate: true,
          requestTimeout: 30_000,
          rowCollectionOnRequestCompletion: false,
        },
      }),
  },
});

export const db = new Kysely<DB>({ dialect });

/**
 * Verifica la conexión al arrancar (el pool es perezoso: sin esto, el primer
 * error de credenciales aparecería recién en la primera consulta real).
 * El parámetro `mode` se mantiene por compatibilidad con index.ts; Kysely no
 * sincroniza esquemas — las tablas se crean por migración/SSMS, como manda
 * la práctica del hospital con BDs compartidas.
 */
export async function initDatabase(_mode: 'connect' = 'connect'): Promise<boolean> {
  await sql`SELECT 1`.execute(db);
  console.log('✅ Conexión a la base de datos establecida (Kysely, pool único)');
  return true;
}
