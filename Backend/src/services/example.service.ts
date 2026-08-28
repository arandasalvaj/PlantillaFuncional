/**
 * Service layer para Example — versión Kysely.
 * Contiene toda la lógica de negocio; los controllers no tocan la BD.
 *
 * Fijate lo que ganás gratis: autocompletado de tablas y columnas, tipos de
 * retorno inferidos, y SQL legible. Nada de decoradores ni modelos.
 *
 * Convención:  example.service.ts  (kebab-case)
 */
import { db } from '../config/database';

export class ExampleService {
  static async getAll() {
    return db
      .selectFrom('examples')
      .selectAll()
      .where('activo', '=', true)
      .orderBy('id', 'asc')
      .execute();
  }

  static async getById(id: number) {
    const item = await db
      .selectFrom('examples')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    if (!item) throw Object.assign(new Error('Registro no encontrado'), { status: 404 });
    return item;
  }

  static async create(data: { nombre: string; descripcion?: string }) {
    return db
      .insertInto('examples')
      .values({ nombre: data.nombre, descripcion: data.descripcion ?? null })
      .outputAll('inserted') // SQL Server: OUTPUT INSERTED.*
      .executeTakeFirstOrThrow();
  }

  static async update(id: number, data: Partial<{ nombre: string; descripcion: string; activo: boolean }>) {
    await this.getById(id); // 404 si no existe
    return db
      .updateTable('examples')
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where('id', '=', id)
      .outputAll('inserted')
      .executeTakeFirstOrThrow();
  }

  static async delete(id: number) {
    await this.getById(id); // 404 si no existe
    await db.deleteFrom('examples').where('id', '=', id).execute();
    return { message: 'Eliminado correctamente' };
  }

  /**
   * Ejemplo CROSS-DATABASE por el MISMO pool (tipado completo):
   * la tabla está declarada con nombre de 3 partes en types/db.ts.
   */
  static async buscarPacienteEnti(rut: string) {
    return db
      .selectFrom('BD_ENTI_CORPORATIVA.dbo.Pacientes')
      .select(['PacRut', 'PacNombre'])
      .where('PacRut', '=', rut)
      .executeTakeFirst();
  }
}
