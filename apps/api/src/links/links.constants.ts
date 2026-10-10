// 3-32 chars: letters, digits, "-" and "_"
export const SLUG_PATTERN = /^[a-zA-Z0-9_-]{3,32}$/;

// Routes that exist (or will exist) at the top level of the API
export const RESERVED_SLUGS = ['health', 'links', 'api', 'docs', 'admin'];

export const GENERATED_SLUG_LENGTH = 7;
export const MAX_SLUG_ATTEMPTS = 5;