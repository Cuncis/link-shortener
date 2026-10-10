import { ApiError } from '@/lib/api';

export type FieldErrors = {
  url?: string;
  slug?: string;
  form?: string;
};

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export function mapApiErrorToFields(error: unknown): FieldErrors {
  if (!(error instanceof ApiError)) {
    return { form: 'Something went wrong. Please try again.' };
  }
  if (error.status === 0) {
    return { form: error.message };
  }
  if (error.status >= 500) {
    return { form: 'The server had a problem. Please try again in a moment.' };
  }

  const result: FieldErrors = {};

  for (const message of error.messages) {
    const lower = message.toLowerCase();

    // "url must be...", "Links that point to this service are not allowed."
    // "slug must be...", 'The slug "x" is already taken.', "This slug is reserved..."
    const field: keyof FieldErrors =
      lower.startsWith('url') || lower.includes('point to this service')
        ? 'url'
        : lower.includes('slug')
          ? 'slug'
          : 'form';

    result[field] ??= capitalize(message); // keep the first message per field
  }

  return result;
}