import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AllExceptionsFilter } from './common/all-exceptions.filter.js';
import { configuration } from './config/configuration.js';
import { validateEnv } from './config/env.validation.js';
import { HealthModule } from './health/health.module.js';
import { LinksModule } from './links/links.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
      validate: validateEnv,
    }),
    PrismaModule,
    HealthModule,
    LinksModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Registering through DI (instead of app.useGlobalFilters) lets the filter use injected services
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}