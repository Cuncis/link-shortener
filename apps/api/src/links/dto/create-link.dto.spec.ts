import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateLinkDto } from './create-link.dto.js';

function validate(body: Record<string, unknown>) {
  const dto = plainToInstance(CreateLinkDto, body);
  return { dto, errors: validateSync(dto) };
}

describe('CreateLinkDto', () => {
  it('accepts a valid url without a slug', () => {
    expect(validate({ url: 'https://example.com/page?x=1' }).errors).toHaveLength(0);
  });

  it('accepts localhost for development', () => {
    expect(validate({ url: 'http://localhost:3000/demo' }).errors).toHaveLength(0);
  });

  it.each(['javascript:alert(1)', 'data:text/html,<h1>hi</h1>', 'ftp://example.com', 'example.com', ''])(
    'rejects the url %p',
    (url) => {
      expect(validate({ url }).errors.length).toBeGreaterThan(0);
    },
  );

  it('rejects a missing url', () => {
    expect(validate({}).errors.length).toBeGreaterThan(0);
  });

  it('lowercases and trims the slug', () => {
    const { dto, errors } = validate({ url: 'https://example.com', slug: '  My-Link ' });
    expect(errors).toHaveLength(0);
    expect(dto.slug).toBe('my-link');
  });

  it('treats an empty slug as not provided', () => {
    const { dto, errors } = validate({ url: 'https://example.com', slug: '   ' });
    expect(errors).toHaveLength(0);
    expect(dto.slug).toBeUndefined();
  });

  it.each(['ab', 'has space', 'bad!chars', 'a'.repeat(33)])('rejects the slug %p', (slug) => {
    expect(validate({ url: 'https://example.com', slug }).errors.length).toBeGreaterThan(0);
  });

  it.each(['health', 'LINKS', 'docs'])('rejects the reserved slug %p', (slug) => {
    expect(validate({ url: 'https://example.com', slug }).errors.length).toBeGreaterThan(0);
  });
});