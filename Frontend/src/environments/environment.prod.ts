export const environment = {
  production: true,
  apiUrl: '/api',
  apiBaseUrl: '/api',
  // Portal de login: SIN USO — ver @core/entorno (LOGIN_URL por hostname en runtime)
  loginApiUrl: '',
  systemName: 'URGENCIA_NEW', // ⚠️ nombre EXACTO en ApiLogin (case-sensitive) — NO es el nombre-minúsculas del sistema
  appName: 'urgenciav2',
  version: '1.0.0',
  appVersion: '1.0.0',
  accessDataTtlMs: 30 * 60 * 1000,
};
