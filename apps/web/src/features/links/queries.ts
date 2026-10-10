'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, createLink, deleteLink, listLinks } from '@/lib/api';
import type { PaginatedLinks } from '@/types/link';

export const PAGE_SIZE = 10;

export const linksKeys = {
  all: ['links'] as const,
  list: (page: number, limit: number) => [...linksKeys.all, 'list', { page, limit }] as const,
};

export function useLinks(page: number) {
  return useQuery({
    queryKey: linksKeys.list(page, PAGE_SIZE),
    queryFn: () => listLinks(page, PAGE_SIZE),
    placeholderData: keepPreviousData, // keep showing the old page while the next loads
  });
}

export function useCreateLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLink,
    // A new link changes totals and page 1, so refetch every cached list page
    onSuccess: () => queryClient.invalidateQueries({ queryKey: linksKeys.all }),
  });
}

export function useDeleteLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLink,

    onMutate: async (id: number) => {
      // Stop in-flight refetches from overwriting our optimistic change
      await queryClient.cancelQueries({ queryKey: linksKeys.all });

      const snapshot = queryClient.getQueriesData<PaginatedLinks>({ queryKey: linksKeys.all });

      queryClient.setQueriesData<PaginatedLinks>({ queryKey: linksKeys.all }, (old) => {
        if (!old || !old.items.some((link) => link.id === id)) return old;

        const total = old.meta.total - 1;
        return {
          items: old.items.filter((link) => link.id !== id),
          meta: { ...old.meta, total, totalPages: Math.ceil(total / old.meta.limit) },
        };
      });

      return { snapshot };
    },

    onError: (error, _id, context) => {
      // 404 means it was already deleted elsewhere: the optimistic state is correct
      if (error instanceof ApiError && error.status === 404) return;

      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },

    // Success or failure, finish by syncing with the server's truth
    onSettled: () => queryClient.invalidateQueries({ queryKey: linksKeys.all }),
  });
}