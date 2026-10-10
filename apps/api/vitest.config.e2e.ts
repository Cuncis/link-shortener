import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    // class-transformer/class-validator need the Reflect metadata polyfill.
    setupFiles: ['reflect-metadata'],
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Vite sets its own BASE_URL ("/") in process.env, which would clash with
    // ours, so the e2e run pins every app setting explicitly.
    env: {
      NODE_ENV: 'test',
      BASE_URL: 'http://localhost:3001',
      CORS_ORIGIN: 'http://localhost:3000',
      DATABASE_URL: 'mysql://root:root@localhost:3306/linkshortener',
    },
  },
});
