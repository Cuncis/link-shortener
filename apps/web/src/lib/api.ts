import type { CreateLinkInput, Link, PaginatedLinks } from '@/types/link';

// Same-origin by default: next.config.ts proxies /api/* to the Nest API
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? '/api').replace(/\/+$/, '');
const REQUEST_TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  readonly status: number; // 0 means the server could not be reached
  readonly messages: string[];

  constructor(status: number, messages: string[]) {
    super(messages[0] ?? 'Request failed');
    this.name = 'ApiError';
    this.status = status;
    this.messages = messages;
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  try {
    const body: unknown = await response.json();

    if (typeof body === 'object' && body !== null && 'message' in body) {
      const { message } = body as { message: unknown };

      if (typeof message === 'string') {
        return new ApiError(response.status, [message]);
      }
      if (Array.isArray(message) && message.every((m): m is string => typeof m === 'string')) {
        return new ApiError(response.status, message);
      }
    }
  } catch {
    // Body was not JSON (e.g. a proxy error page): fall through
  }

  return new ApiError(response.status, [`Request failed (${response.status}).`]);
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const hasBody = options.body !== undefined;
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
      body: hasBody ? JSON.stringify(options.body) : undefined,
      // A hung request must become an error, not an endless "Loading…"
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new ApiError(0, ['Cannot reach the server. Check your connection and try again.']);
  }

  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return undefined as T; // DELETE returns no body

  return (await response.json()) as T;
}

export function createLink(input: CreateLinkInput): Promise<Link> {
  return request<Link>('/links', { method: 'POST', body: input });
}

export function listLinks(page: number, limit: number): Promise<PaginatedLinks> {
  return request<PaginatedLinks>(`/links?page=${page}&limit=${limit}`);
}

export function deleteLink(id: number): Promise<void> {
  return request<void>(`/links/${id}`, { method: 'DELETE' });
}