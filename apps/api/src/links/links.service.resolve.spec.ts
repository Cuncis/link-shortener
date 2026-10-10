import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { LinksService } from './links.service.js';

const notFoundError = () =>
  new Prisma.PrismaClientKnownRequestError('Record not found', {
    code: 'P2025',
    clientVersion: 'test',
  });

describe('LinksService.resolve', () => {
  let service: LinksService;
  const update = vi.fn();

  beforeEach(async () => {
    update.mockReset();

    const moduleRef = await Test.createTestingModule({
      providers: [
        LinksService,
        { provide: PrismaService, useValue: { link: { update } } },
        { provide: ConfigService, useValue: { get: () => 'http://localhost:3001' } },
      ],
    }).compile();

    service = moduleRef.get(LinksService);
  });

  it('increments clicks atomically and returns the destination url', async () => {
    update.mockResolvedValue({ url: 'https://example.com' });

    const url = await service.resolve('my-slug');

    expect(url).toBe('https://example.com');
    expect(update).toHaveBeenCalledWith({
      where: { slug: 'my-slug' },
      data: { clicks: { increment: 1 } },
      select: { url: true },
    });
  });

  it('looks slugs up in lowercase', async () => {
    update.mockResolvedValue({ url: 'https://example.com' });

    await service.resolve('My-Slug');

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: 'my-slug' } }),
    );
  });

  it('throws 404 when the slug does not exist', async () => {
    update.mockRejectedValue(notFoundError());

    await expect(service.resolve('missing')).rejects.toThrow(NotFoundException);
  });

  it.each(['favicon.ico', 'ab', 'has space', 'a'.repeat(40)])(
    'throws 404 for the impossible slug %p without querying the database',
    async (slug) => {
      await expect(service.resolve(slug)).rejects.toThrow(NotFoundException);
      expect(update).not.toHaveBeenCalled();
    },
  );

  it('rethrows unexpected database errors untouched', async () => {
    update.mockRejectedValue(new Error('connection lost'));

    await expect(service.resolve('my-slug')).rejects.toThrow('connection lost');
  });
});