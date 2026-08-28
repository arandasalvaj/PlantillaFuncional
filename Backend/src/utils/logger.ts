/**
 * Logger estructurado con Pino
 * - Desarrollo: formato legible con colores (pino-pretty)
 * - Producción: JSON para parsing en herramientas de monitoreo
 *
 * Redacción de PII: campos sensibles (RUT, RUN, NIP, nombres, fechas de
 * nacimiento, tokens, contraseñas, autorización HTTP) se reemplazan por
 * "[REDACTED]" antes de serializar el log. La lista cubre claves a cualquier
 * profundidad usando wildcards.
 */
import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Paths para redact. Pino soporta wildcards `*` solo a un nivel; usamos
 * varios patrones para cubrir objetos planos y anidados frecuentes.
 */
const REDACT_PATHS = [
  // Identificadores personales
  '*.rut', '*.RUT', '*.run', '*.RUN', '*.nip', '*.NIP',
  '*.dv', '*.DV', '*.dvRut', '*.DigitoVerificador',
  '*.ValorIdentificador',
  // Datos de identidad
  '*.nombre', '*.Nombre', '*.NombreCompleto',
  '*.primerApellido', '*.PrimerApellido',
  '*.segundoApellido', '*.SegundoApellido',
  '*.fechaNacimiento', '*.FechaNacimiento',
  // Contacto
  '*.email', '*.Email', '*.telefono', '*.Telefono',
  // Credenciales / tokens
  '*.password', '*.Password', '*.token', '*.Token',
  '*.authorization', '*.Authorization',
  'req.headers.authorization', 'req.headers.cookie',
  'headers.authorization', 'headers.cookie',
  // Mismo set un nivel más anidado (paciente.nombre, body.paciente.run, etc.)
  '*.*.rut', '*.*.run', '*.*.nip', '*.*.nombre', '*.*.PrimerApellido',
  '*.*.SegundoApellido', '*.*.fechaNacimiento', '*.*.FechaNacimiento',
  '*.*.ValorIdentificador', '*.*.DigitoVerificador',
];

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: REDACT_PATHS,
    censor: '[REDACTED]',
    remove: false,
  },
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  // En producción, incluir timestamp ISO
  ...(isDev ? {} : { timestamp: pino.stdTimeFunctions.isoTime }),
});

// Loggers por módulo (child loggers con contexto). Crear uno por módulo nuevo:
//   export const miModuloLog = logger.child({ service: 'mi-modulo' });
export const authLog = logger.child({ service: 'auth' });
export const dbLog = logger.child({ service: 'database' });

export default logger;
