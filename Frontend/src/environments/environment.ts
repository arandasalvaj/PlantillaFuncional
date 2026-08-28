/**
 * Central environment configuration.
 * For production, these values should be overridden via environment.prod.ts
 * or build-time environment variables.
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3002/api',
  apiBaseUrl: 'http://localhost:3002/api',
  loginApiUrl: 'http://localhost:3000',
  systemName: 'URGENCIA_NEW', // ⚠️ nombre EXACTO en ApiLogin (case-sensitive) — NO es el nombre-minúsculas del sistema
  appName: 'urgenciav2',
  version: '1.0.0',
  appVersion: '1.0.0',
  accessDataTtlMs: 30 * 60 * 1000, // 30 minutos
};
