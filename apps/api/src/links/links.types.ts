export type LinkResponse = {
  id: number;
  slug: string;
  url: string;
  shortUrl: string;
  clicks: number;
  createdAt: Date;
};

export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type PaginatedLinks = {
  items: LinkResponse[];
  meta: PaginationMeta;
};