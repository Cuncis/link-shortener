import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import type { AppConfig } from './config/configuration.js';
import { configureApp } from './setup-app.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService<AppConfig, true>>(ConfigService);

  configureApp(app);

  // Lets Nest close DB connections cleanly on SIGTERM (Docker, Kubernetes later)
  app.enableShutdownHooks();

  const port = config.get('app.port', { infer: true });
  const host = config.get('app.host', { infer: true });
  await app.listen(port, host);
  console.log(`API running on http://${host}:${port}`);
}

void bootstrap();