import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Link } from '@prisma/client';
import type { AppConfig } from '../config/configuration.js';
import { isRecordNotFound, isUniqueViolation } from '../prisma/prisma-errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateLinkDto } from './dto/create-link.dto.js';
import { MAX_SLUG_ATTEMPTS, SLUG_PATTERN } from './links.constants.js';
import type { ListLinksQuery } from './dto/list-links.query.js';
import type { LinkResponse,PaginatedLinks } from './links.types.js';
import { generateSlug } from './slug.util.js';

const MAX_INT32 = 2_147_483_647; // MySQL INT upper bound

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

    /** Counts one click and returns the destination URL. Throws 404 for unknown slugs. */
  async resolve(rawSlug: string): Promise<string> {
    const slug = rawSlug.toLowerCase(); // slugs are stored lowercase

    // Can't possibly exist (e.g. "favicon.ico"): skip the database entirely
    if (!SLUG_PATTERN.test(slug)) {
      throw new NotFoundException('Link not found.');
    }

    try {
      const link = await this.prisma.link.update({
        where: { slug },
        data: { clicks: { increment: 1 } }, // atomic: SET clicks = clicks + 1
        select: { url: true },
      });
      return link.url;
    } catch (error) {
      if (isRecordNotFound(error)) {
        throw new NotFoundException('Link not found.');
      }
      throw error;
    }
  }

    async list({ page, limit }: ListLinksQuery): Promise<PaginatedLinks> {
    // One transaction so `total` and `items` come from the same snapshot
    const [total, links] = await this.prisma.$transaction([
      this.prisma.link.count(),
      this.prisma.link.findMany({
        // `id` breaks ties so pages never overlap or skip rows
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      items: links.map((link) => this.toResponse(link)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async remove(id: number): Promise<void> {
    // Can't exist in an INT column; also avoids a Prisma overflow error (500)
    if (!Number.isSafeInteger(id) || id < 1 || id > MAX_INT32) {
      throw new NotFoundException('Link not found.');
    }

    try {
      await this.prisma.link.delete({ where: { id } });
    } catch (error) {
      if (isRecordNotFound(error)) {
        throw new NotFoundException('Link not found.');
      }
      throw error;
    }
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

