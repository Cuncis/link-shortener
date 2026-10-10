import {
  BadRequestException,
  ConflictException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { toErrorPayload } from './all-exceptions.filter.js';

describe('toErrorPayload', () => {
  it('maps a NotFoundException', () => {
    expect(toErrorPayload(new NotFoundException('Link not found.'))).toEqual({
      statusCode: 404,
      error: 'Not Found',
      message: 'Link not found.',
    });
  });

  it('maps a ConflictException', () => {
    expect(toErrorPayload(new ConflictException('slug taken'))).toEqual({
      statusCode: 409,
      error: 'Conflict',
      message: 'slug taken',
    });
  });

  it('keeps validation messages as an array', () => {
    const payload = toErrorPayload(new BadRequestException(['url must be a URL', 'slug too short']));

    expect(payload.statusCode).toBe(400);
    expect(payload.message).toEqual(['url must be a URL', 'slug too short']);
  });

  it('handles an HttpException created with a plain string', () => {
    expect(toErrorPayload(new HttpException('nope', 403))).toEqual({
      statusCode: 403,
      error: 'Forbidden',
      message: 'nope',
    });
  });

  it('maps body-parser style client errors (malformed JSON)', () => {
    const error = Object.assign(new SyntaxError('Unexpected token } in JSON'), {
      status: 400,
      type: 'entity.parse.failed',
    });

    expect(toErrorPayload(error)).toEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Unexpected token } in JSON',
    });
  });

  it('hides the details of unexpected errors', () => {
    const payload = toErrorPayload(new Error('password=hunter2 at db.internal:3306'));

    expect(payload).toEqual({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Internal server error',
    });
    expect(JSON.stringify(payload)).not.toContain('hunter2');
  });

  it('hides library errors that carry a 5xx status', () => {
    const error = Object.assign(new Error('upstream exploded'), { status: 502 });

    expect(toErrorPayload(error).statusCode).toBe(500);
    expect(toErrorPayload(error).message).toBe('Internal server error');
  });

  it('survives values that are not errors at all', () => {
    expect(toErrorPayload('a thrown string').statusCode).toBe(500);
    expect(toErrorPayload(undefined).statusCode).toBe(500);
    expect(toErrorPayload(null).statusCode).toBe(500);
  });
});