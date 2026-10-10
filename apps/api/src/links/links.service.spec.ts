import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { LinksService } from './links.service.js';

const uniqueError = () =>
  new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
  });

const fakeLink = {
  id: 1,
  slug: 'fixed',
  url: 'https://example.com',
  clicks: 0,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

describe('LinksService', () => {
  let service: LinksService;
  const create = vi.fn();

  beforeEach(async () => {
    create.mockReset();

    const moduleRef = await Test.createTestingModule({
      providers: [
        LinksService,
        { provide: PrismaService, useValue: { link: { create } } },
        { provide: ConfigService, useValue: { get: () => 'http://localhost:3001' } },
      ],
    }).compile();

    service = moduleRef.get(LinksService);
  });

  it('creates a link with a custom slug and builds the short url', async () => {
    create.mockResolvedValue({ ...fakeLink, slug: 'my-slug' });

    const result = await service.create({ url: 'https://example.com', slug: 'my-slug' });

    expect(create).toHaveBeenCalledWith({ data: { slug: 'my-slug', url: 'https://example.com' } });
    expect(result.shortUrl).toBe('http://localhost:3001/my-slug');
    expect(result).not.toHaveProperty('updatedAt');
  });

  it('generates a slug when none is given', async () => {
    create.mockImplementation(({ data }: { data: { slug: string; url: string } }) =>
      Promise.resolve({ ...fakeLink, ...data }),
    );

    const result = await service.create({ url: 'https://example.com' });

    expect(result.slug).toMatch(/^[a-z0-9]{7}$/);
  });

  it('throws 409 when a custom slug is already taken', async () => {
    create.mockRejectedValue(uniqueError());

    await expect(service.create({ url: 'https://example.com', slug: 'taken' })).rejects.toThrow(
      ConflictException,
    );
    expect(create).toHaveBeenCalledTimes(1); // never retried for custom slugs
  });

  it('retries with a new slug when a generated one collides', async () => {
    create.mockRejectedValueOnce(uniqueError()).mockResolvedValueOnce(fakeLink);

    await service.create({ url: 'https://example.com' });

    expect(create).toHaveBeenCalledTimes(2);
  });

  it('gives up after repeated collisions', async () => {
    create.mockRejectedValue(uniqueError());

    await expect(service.create({ url: 'https://example.com' })).rejects.toThrow(
      InternalServerErrorException,
    );
    expect(create).toHaveBeenCalledTimes(5);
  });

  it('rethrows unexpected database errors untouched', async () => {
    create.mockRejectedValue(new Error('connection lost'));

    await expect(service.create({ url: 'https://example.com' })).rejects.toThrow('connection lost');
  });

  it('rejects urls that point back at this service', async () => {
    await expect(service.create({ url: 'http://localhost:3001/abc' })).rejects.toThrow(
      BadRequestException,
    );
    expect(create).not.toHaveBeenCalled();
  });
});