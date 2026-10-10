import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ListLinksQuery } from './list-links.query.js';

function parse(query: Record<string, unknown>) {
  const dto = plainToInstance(ListLinksQuery, query);
  return { dto, errors: validateSync(dto) };
}

describe('ListLinksQuery', () => {
  it('applies defaults when nothing is provided', () => {
    const { dto, errors } = parse({});
    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(20);
  });

  it('converts query strings to numbers', () => {
    const { dto, errors } = parse({ page: '3', limit: '50' });
    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(3);
    expect(dto.limit).toBe(50);
  });

  it.each([
    { page: '0' },
    { page: '-1' },
    { page: '1.5' },
    { page: 'abc' },
    { limit: '0' },
    { limit: '101' },
    { limit: 'many' },
    { page: '' },
  ])('rejects %p', (query) => {
    expect(parse(query).errors.length).toBeGreaterThan(0);
  });
});