import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import type { AppConfig } from './config/configuration.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService<AppConfig, true>>(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties that have no decorator
      forbidNonWhitelisted: true, // ...and reject the request instead of silently dropping them
      transform: true, // turn plain JSON into DTO class instances (runs our @Transform)
    }),
  );

  // Lets Nest close DB connections cleanly on SIGTERM (Docker, Kubernetes later)
  app.enableShutdownHooks();

  const port = config.get('app.port', { infer: true });
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
}

void bootstrap();