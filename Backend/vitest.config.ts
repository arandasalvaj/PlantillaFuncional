import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  // Resuelve los aliases @services/@middlewares/... desde tsconfig.json
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Los tests NUNCA tocan BD ni ApiLogin reales — todo mockeado.
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-secret',
      SISTEMA_APILOGIN: 'PlantillaTest',
      LOG_LEVEL: 'silent',
    },
  },
});
