import { Controller, Get, Header, Param, Redirect } from '@nestjs/common';
import { LinksService } from './links.service.js';

// No path prefix: this serves the short URLs themselves, e.g. GET /nest-docs
@Controller()
export class RedirectController {
  constructor(private readonly linksService: LinksService) {}

  @Get(':slug')
  @Header('Cache-Control', 'no-store')
  @Redirect()
  async redirect(@Param('slug') slug: string): Promise<{ url: string; statusCode: number }> {
    const url = await this.linksService.resolve(slug);
    return { url, statusCode: 302 };
  }
}