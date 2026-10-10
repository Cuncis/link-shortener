'use client';

import { useRef } from 'react';
import { useDeleteLink, useLinks } from '@/features/links/queries';
import { LinkRow } from './link-row';

type LinksListProps = {
  page: number;
  onPageChange: (page: number) => void;
};

const pageButton =
  'rounded-md border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800';

export function LinksList({ page, onPageChange }: LinksListProps) {
  const { data, isPending, isError, error, refetch, isPlaceholderData } = useLinks(page);
  const deleteLink = useDeleteLink();
  const headingRef = useRef<HTMLHeadingElement>(null);

  function handleDelete(id: number) {
    // Deleting the last row of a later page would leave an empty page: step back first
    if (data && data.items.length === 1 && page > 1) {
      onPageChange(page - 1);
    }
    deleteLink.mutate(id);
    // The focused button is about to disappear: park focus on the heading
    headingRef.current?.focus();
  }

  let content: React.ReactNode;

  if (isPending) {
    content = (
      <p role="status" className="text-zinc-600 dark:text-zinc-400">
        Loading links…
      </p>
    );
  } else if (isError) {
    content = (
      <div role="alert" className="rounded-lg border border-red-600 p-4">
        <p className="text-red-700 dark:text-red-400">{error.message}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-2 text-sm underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  } else if (data.meta.total === 0) {
    content = (
      <div className="rounded-lg border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
        <p className="font-medium">No links yet</p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Create your first short link using the form above.
        </p>
      </div>
    );
  } else {
    const { meta, items } = data;
    const lastPage = Math.max(meta.totalPages, 1);

    content = (
      <>
        <ul
          aria-busy={isPlaceholderData}
          className={`space-y-3 transition-opacity ${isPlaceholderData ? 'opacity-60' : ''}`}
        >
          {items.map((link) => (
            <LinkRow key={link.id} link={link} onDelete={handleDelete} />
          ))}
        </ul>

        <nav aria-label="Pagination" className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || isPlaceholderData}
            className={pageButton}
          >
            Previous
          </button>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Page {meta.page} of {lastPage}
          </p>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= lastPage || isPlaceholderData}
            className={pageButton}
          >
            Next
          </button>
        </nav>
      </>
    );
  }

  return (
    <div className="space-y-4">
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="text-xl font-semibold focus:outline-none"
        id="links-heading"
      >
        Your links{data ? ` (${data.meta.total})` : ''}
      </h2>

      {deleteLink.isError && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          Could not delete the link: {deleteLink.error.message}
        </p>
      )}

      {content}
    </div>
  );
}