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
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateLinkDto } from './dto/create-link.dto.js';
import { ListLinksQuery } from './dto/list-links.query.js';
import { LinksService } from './links.service.js';
import type { LinkResponse, PaginatedLinks } from './links.types.js';

@ApiTags('links')
@Controller('links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a short link' })
  @ApiCreatedResponse({ description: 'The link was created.' })
  @ApiBadRequestResponse({ description: 'Validation failed.' })
  @ApiConflictResponse({ description: 'The custom slug is already taken.' })
  create(@Body() dto: CreateLinkDto): Promise<LinkResponse> {
    return this.linksService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List links, newest first' })
  @ApiOkResponse({ description: 'A page of links with pagination metadata.' })
  list(@Query() query: ListLinksQuery): Promise<PaginatedLinks> {
    return this.linksService.list(query);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a link' })
  @ApiNoContentResponse({ description: 'The link was deleted.' })
  @ApiNotFoundResponse({ description: 'No link with that id.' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.linksService.remove(id);
  }
}