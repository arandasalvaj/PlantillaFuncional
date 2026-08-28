/**
 * Decodifica el payload de un token JWT sin validar su firma
 *
 * Optimizaciones:
 * - Validación rápida de formato antes de procesar
 * - Manejo eficiente de padding base64
 *
 * @param token - Token JWT en formato estándar
 * @returns Payload parseado o null si el token es inválido
 */
export function decodeJwtPayload<T = any>(token: string): T | null {
  try {
    // Validación rápida: debe tener 3 partes
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Obtener el payload (segunda parte)
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');

    // Ajustar padding base64 de forma eficiente
    const padLen = (4 - (base64.length % 4)) % 4;
    if (padLen > 0) {
      base64 += '='.repeat(padLen);
    }

    // Decodificar y parsear JSON
    const json = atob(base64);
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
