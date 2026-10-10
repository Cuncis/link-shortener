import { NodeEnv, validateEnv } from './env.validation.js';

const validDb = 'mysql://root:root@localhost:3306/linkshortener';

describe('validateEnv', () => {
  it('applies defaults when only DATABASE_URL is set', () => {
    const env = validateEnv({ DATABASE_URL: validDb });

    expect(env.NODE_ENV).toBe(NodeEnv.Development);
    expect(env.PORT).toBe(3001);
    expect(env.BASE_URL).toBe('http://localhost:3001');
    expect(env.CORS_ORIGIN).toBe('http://localhost:3000');
  });

  it('converts PORT from string to number', () => {
    const env = validateEnv({ DATABASE_URL: validDb, PORT: '4000' });
    expect(env.PORT).toBe(4000);
  });

  it('throws when DATABASE_URL is missing', () => {
    expect(() => validateEnv({})).toThrow(/DATABASE_URL/);
  });

  it('throws when DATABASE_URL is not a mysql url', () => {
    expect(() => validateEnv({ DATABASE_URL: 'postgres://x' })).toThrow(/mysql:\/\//);
  });

  it('throws when PORT is not a valid number', () => {
    expect(() => validateEnv({ DATABASE_URL: validDb, PORT: 'abc' })).toThrow(/PORT/);
  });

  it('throws when NODE_ENV is not a known value', () => {
    expect(() => validateEnv({ DATABASE_URL: validDb, NODE_ENV: 'staging' })).toThrow(/NODE_ENV/);
  });
});