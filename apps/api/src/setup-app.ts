import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import type { AppConfig } from './config/configuration.js';
import { NodeEnv } from './config/env.validation.js';

export function configureApp(app: INestApplication): void {
  const config = app.get<ConfigService<AppConfig, true>>(ConfigService);
  const isProduction = config.get('app.nodeEnv', { infer: true }) === NodeEnv.Production;

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          // [] keeps the directive on (production, behind HTTPS); null turns it off for http://localhost
          upgradeInsecureRequests: isProduction ? [] : null,
        },
      },
    }),
  );

  app.enableCors({
    origin: config.get('app.corsOrigin', { infer: true }),
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    maxAge: 600, // browsers may cache the preflight answer for 10 minutes
  });

  if (!isProduction) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Link Shortener API')
        .setDescription('Create short links, redirect, list, and delete.')
        .setVersion('1.0')
        .build(),
    );
    SwaggerModule.setup('docs', app, document);
  }
}