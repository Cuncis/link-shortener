import { Module } from '@nestjs/common';
import { LinksController } from './links.controller.js';
import { LinksService } from './links.service.js';
import { RedirectController } from './redirect.controller.js';

@Module({
  // Order matters: LinksController's static paths (/links) must come before /:slug
  controllers: [LinksController, RedirectController],
  providers: [LinksService],
})
export class LinksModule {}