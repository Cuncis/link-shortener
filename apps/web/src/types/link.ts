// Mirrors the API's JSON responses. Dates arrive as ISO strings.
export type Link = {
  id: number;
  slug: string;
  url: string;
  shortUrl: string;
  clicks: number;
  createdAt: string;
};

export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type PaginatedLinks = {
  items: Link[];
  meta: PaginationMeta;
};

export type CreateLinkInput = {
  url: string;
  slug?: string;
};