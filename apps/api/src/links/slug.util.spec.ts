import { generateSlug } from './slug.util.js';

describe('generateSlug', () => {
  it('generates 7 lowercase alphanumeric characters by default', () => {
    expect(generateSlug()).toMatch(/^[a-z0-9]{7}$/);
  });

  it('respects a custom length', () => {
    expect(generateSlug(12)).toHaveLength(12);
  });

  it('produces different values across calls', () => {
    const slugs = new Set(Array.from({ length: 50 }, () => generateSlug()));
    expect(slugs.size).toBeGreaterThan(45);
  });
});