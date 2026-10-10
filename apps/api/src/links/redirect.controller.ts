import { Controller, Get, Header, Param, Redirect } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LinksService } from './links.service.js';

// No path prefix: this serves the short URLs themselves, e.g. GET /nest-docs
@ApiTags('redirect')
@Controller()
export class RedirectController {
  constructor(private readonly linksService: LinksService) {}

  @Get(':slug')
  @Header('Cache-Control', 'no-store')
  @Redirect()
  @ApiOperation({ summary: 'Follow a short link (counts one click)' })
  @ApiResponse({ status: 302, description: 'Redirects to the original URL.' })
  @ApiNotFoundResponse({ description: 'Unknown slug.' })
  async redirect(@Param('slug') slug: string): Promise<{ url: string; statusCode: number }> {
    const url = await this.linksService.resolve(slug);
    return { url, statusCode: 302 };
  }
}