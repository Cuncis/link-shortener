import { Body, Controller, Post } from '@nestjs/common';
import { CreateLinkDto } from './dto/create-link.dto.js';
import { LinksService } from './links.service.js';
import type { LinkResponse } from './links.types.js';

@Controller('links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post()
  create(@Body() dto: CreateLinkDto): Promise<LinkResponse> {
    return this.linksService.create(dto); // POST defaults to 201 Created
  }
}