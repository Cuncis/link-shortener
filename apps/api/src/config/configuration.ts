import { validateEnv } from './env.validation.js';

export const configuration = () => {
  const env = validateEnv(process.env);

  return {
    app: {
      nodeEnv: env.NODE_ENV,
      port: env.PORT,
      host: env.HOST,
      // No trailing slash, so we can safely build `${baseUrl}/${slug}`
      baseUrl: env.BASE_URL.replace(/\/+$/, ''),
      corsOrigin: env.CORS_ORIGIN.replace(/\/+$/, ''),
    },
    database: {
      url: env.DATABASE_URL,
    },
  };
};

export type AppConfig = ReturnType<typeof configuration>;