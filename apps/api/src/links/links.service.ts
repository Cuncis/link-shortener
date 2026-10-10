import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Link } from '@prisma/client';
import type { AppConfig } from '../config/configuration.js';
import { isUniqueViolation } from '../prisma/prisma-errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateLinkDto } from './dto/create-link.dto.js';
import { MAX_SLUG_ATTEMPTS } from './links.constants.js';
import type { LinkResponse } from './links.types.js';
import { generateSlug } from './slug.util.js';

@Injectable()
export class LinksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async create(dto: CreateLinkDto): Promise<LinkResponse> {
    this.assertNotOwnUrl(dto.url);

    if (dto.slug) {
      return this.createWithCustomSlug(dto.slug, dto.url);
    }
    return this.createWithGeneratedSlug(dto.url);
  }

  private async createWithCustomSlug(slug: string, url: string): Promise<LinkResponse> {
    try {
      const link = await this.prisma.link.create({ data: { slug, url } });
      return this.toResponse(link);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(`The slug "${slug}" is already taken.`);
      }
      throw error;
    }
  }

  private async createWithGeneratedSlug(url: string): Promise<LinkResponse> {
    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
      try {
        const link = await this.prisma.link.create({ data: { slug: generateSlug(), url } });
        return this.toResponse(link);
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;
        // Random collision: loop and try a fresh slug
      }
    }

    throw new InternalServerErrorException('Could not generate a unique slug. Please try again.');
  }

  /** Prevents redirect loops: a short link must not point back at this service. */
  private assertNotOwnUrl(url: string): void {
    let targetHost: string;
    try {
      targetHost = new URL(url).host;
    } catch {
      throw new BadRequestException('url must be a valid http or https URL');
    }

    const ownHost = new URL(this.config.get('app.baseUrl', { infer: true })).host;
    if (targetHost === ownHost) {
      throw new BadRequestException('Links that point to this service are not allowed.');
    }
  }

  private toResponse(link: Link): LinkResponse {
    const baseUrl = this.config.get('app.baseUrl', { infer: true });

    return {
      id: link.id,
      slug: link.slug,
      url: link.url,
      shortUrl: `${baseUrl}/${link.slug}`,
      clicks: link.clicks,
      createdAt: link.createdAt,
    };
  }
}