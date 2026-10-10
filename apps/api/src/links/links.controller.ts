import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CreateLinkDto } from './dto/create-link.dto.js';
import { ListLinksQuery } from './dto/list-links.query.js';
import { LinksService } from './links.service.js';
import type { LinkResponse, PaginatedLinks } from './links.types.js';

@Controller('links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post()
  create(@Body() dto: CreateLinkDto): Promise<LinkResponse> {
    return this.linksService.create(dto);
  }

  @Get()
  list(@Query() query: ListLinksQuery): Promise<PaginatedLinks> {
    return this.linksService.list(query);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // 204: success with an empty body
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.linksService.remove(id);
  }
}