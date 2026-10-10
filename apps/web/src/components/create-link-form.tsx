'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { mapApiErrorToFields, type FieldErrors } from '@/features/links/errors';
import { useCreateLink } from '@/features/links/queries';
import type { Link } from '@/types/link';
import { CopyButton } from './copy-button';

type CreateLinkFormProps = {
  onCreated: () => void;
};

const fieldClass =
  'w-full rounded-md border border-zinc-300 bg-transparent p-2 outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700';

export function CreateLinkForm({ onCreated }: CreateLinkFormProps) {
  const createLink = useCreateLink();

  const [url, setUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [created, setCreated] = useState<Link | null>(null);

  const urlRef = useRef<HTMLInputElement>(null);
  const slugRef = useRef<HTMLInputElement>(null);
  const urlId = useId();
  const slugId = useId();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreated(null);

    const trimmedUrl = url.trim();
    if (trimmedUrl === '') {
      setErrors({ url: 'URL is required.' });
      urlRef.current?.focus();
      return;
    }

    setErrors({});

    createLink.mutate(
      { url: trimmedUrl, slug: slug.trim() || undefined },
      {
        onSuccess: (link) => {
          setCreated(link);
          setUrl('');
          setSlug('');
          onCreated(); // jump to page 1, where the new link appears
          urlRef.current?.focus();
        },
        onError: (error) => {
          const mapped = mapApiErrorToFields(error);
          setErrors(mapped);

          if (mapped.url) urlRef.current?.focus();
          else if (mapped.slug) slugRef.current?.focus();
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor={urlId} className="mb-1 block text-sm font-medium">
          Destination URL
        </label>
        <input
          ref={urlRef}
          id={urlId}
          type="url"
          inputMode="url"
          autoComplete="off"
          placeholder="https://example.com/a/very/long/link"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setErrors((prev) => ({ ...prev, url: undefined }));
          }}
          aria-invalid={errors.url ? true : undefined}
          aria-describedby={errors.url ? `${urlId}-error` : undefined}
          className={fieldClass}
        />
        {errors.url && (
          <p id={`${urlId}-error`} role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.url}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={slugId} className="mb-1 block text-sm font-medium">
          Custom slug{' '}
          <span className="font-normal text-zinc-600 dark:text-zinc-400">(optional)</span>
        </label>
        <input
          ref={slugRef}
          id={slugId}
          type="text"
          autoComplete="off"
          placeholder="my-link"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setErrors((prev) => ({ ...prev, slug: undefined }));
          }}
          aria-invalid={errors.slug ? true : undefined}
          aria-describedby={errors.slug ? `${slugId}-error` : `${slugId}-hint`}
          className={fieldClass}
        />
        {errors.slug ? (
          <p
            id={`${slugId}-error`}
            role="alert"
            className="mt-1 text-sm text-red-600 dark:text-red-400"
          >
            {errors.slug}
          </p>
        ) : (
          <p id={`${slugId}-hint`} className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            3-32 characters: letters, numbers, - or _. Leave empty for a random one.
          </p>
        )}
      </div>

      {errors.form && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {errors.form}
        </p>
      )}

      <button
        type="submit"
        disabled={createLink.isPending}
        className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60"
      >
        {createLink.isPending ? 'Creating…' : 'Create short link'}
      </button>

      {created && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-2 rounded-md border border-green-600 bg-green-50 p-3 text-sm text-green-900 dark:bg-green-950/40 dark:text-green-100"
        >
          <span>Created:</span>
          <a
            href={created.shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono font-medium underline"
          >
            {created.shortUrl}
          </a>
          <CopyButton text={created.shortUrl} label={created.slug} />
        </div>
      )}
    </form>
  );
}