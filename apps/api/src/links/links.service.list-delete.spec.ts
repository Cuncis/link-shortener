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

const row = (id: number) => ({
  id,
  slug: `slug-${id}`,
  url: `https://example.com/${id}`,
  clicks: id,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
});

describe('LinksService list and remove', () => {
  let service: LinksService;
  const count = vi.fn();
  const findMany = vi.fn();
  const del = vi.fn();

  beforeEach(async () => {
    count.mockReset();
    findMany.mockReset();
    del.mockReset();

    const prismaMock = {
      link: { count, findMany, delete: del },
      $transaction: (operations: Promise<unknown>[]) => Promise.all(operations),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        LinksService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ConfigService, useValue: { get: () => 'http://localhost:3001' } },
      ],
    }).compile();

    service = moduleRef.get(LinksService);
  });

  describe('list', () => {
    it('returns mapped items with pagination meta', async () => {
      count.mockResolvedValue(25);
      findMany.mockResolvedValue([row(2), row(1)]);

      const result = await service.list({ page: 1, limit: 2 });

      expect(result.items).toHaveLength(2);
      expect(result.items[0]?.shortUrl).toBe('http://localhost:3001/slug-2');
      expect(result.items[0]).not.toHaveProperty('updatedAt');
      expect(result.meta).toEqual({ total: 25, page: 1, limit: 2, totalPages: 13 });
    });

    it('orders newest first with an id tiebreaker and computes skip/take', async () => {
      count.mockResolvedValue(0);
      findMany.mockResolvedValue([]);

      await service.list({ page: 3, limit: 10 });

      expect(findMany).toHaveBeenCalledWith({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: 20,
        take: 10,
      });
    });

    it('returns zero pages for an empty table', async () => {
      count.mockResolvedValue(0);
      findMany.mockResolvedValue([]);

      const result = await service.list({ page: 1, limit: 20 });

      expect(result.items).toEqual([]);
      expect(result.meta.totalPages).toBe(0);
    });
  });

  describe('remove', () => {
    it('deletes by id', async () => {
      del.mockResolvedValue(row(5));

      await expect(service.remove(5)).resolves.toBeUndefined();
      expect(del).toHaveBeenCalledWith({ where: { id: 5 } });
    });

    it('throws 404 when the link does not exist', async () => {
      del.mockRejectedValue(notFoundError());

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });

    it.each([0, -1, 2_147_483_648, 1.5, Number.NaN])(
      'throws 404 for the impossible id %p without querying the database',
      async (id) => {
        await expect(service.remove(id)).rejects.toThrow(NotFoundException);
        expect(del).not.toHaveBeenCalled();
      },
    );

    it('rethrows unexpected database errors untouched', async () => {
      del.mockRejectedValue(new Error('connection lost'));

      await expect(service.remove(5)).rejects.toThrow('connection lost');
    });
  });
});