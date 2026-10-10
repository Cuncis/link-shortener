import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    // Fail at startup, not on the first request, if the database is unreachable
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    // Called on shutdown because main.ts enables shutdown hooks
    await this.$disconnect();
  }
}