'use client';

import { useState } from 'react';
import type { Link } from '@/types/link';
import { CopyButton } from './copy-button';

type LinkRowProps = {
  link: Link;
  onDelete: (id: number) => void;
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const actionButton =
  'rounded px-2 py-1 text-sm hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:hover:bg-zinc-800';

export function LinkRow({ link, onDelete }: LinkRowProps) {
  const [confirming, setConfirming] = useState(false);

  return (
    <li className="rounded-lg border border-zinc-300 p-4 dark:border-zinc-700">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <a
            href={link.shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all font-mono font-medium text-blue-700 underline dark:text-blue-400"
          >
            {link.shortUrl}
          </a>
          <p className="mt-1 truncate text-sm text-zinc-600 dark:text-zinc-400" title={link.url}>
            → {link.url}
          </p>
        </div>

        <div className="text-right text-sm">
          <p className="font-medium">
            {link.clicks} {link.clicks === 1 ? 'click' : 'clicks'}
          </p>
          <time dateTime={link.createdAt} className="text-xs text-zinc-600 dark:text-zinc-400">
            {dateFormatter.format(new Date(link.createdAt))}
          </time>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1">
        {confirming ? (
          <div role="group" aria-label={`Confirm deleting ${link.slug}`} className="flex items-center gap-1">
            <span className="text-sm">Delete?</span>
            <button
              type="button"
              onClick={() => onDelete(link.id)}
              className={`${actionButton} font-medium text-red-600 dark:text-red-400`}
            >
              Yes
            </button>
            <button type="button" autoFocus onClick={() => setConfirming(false)} className={actionButton}>
              No
            </button>
          </div>
        ) : (
          <>
            <CopyButton text={link.shortUrl} label={link.slug} />
            <button
              type="button"
              onClick={() => setConfirming(true)}
              aria-label={`Delete short link ${link.slug}`}
              className={`${actionButton} text-red-600 dark:text-red-400`}
            >
              Delete
            </button>
          </>
        )}
      </div>
    </li>
  );
}