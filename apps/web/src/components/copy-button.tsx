'use client';

import { useEffect, useRef, useState } from 'react';

type CopyButtonProps = {
  text: string;
  label: string; // e.g. the slug, so screen readers hear which link is being copied
};

export function CopyButton({ text, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (permissions or insecure context): nothing useful to do
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy short link ${label}`}
        className="rounded px-2 py-1 text-sm hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:hover:bg-zinc-800"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <span role="status" className="sr-only">
        {copied ? 'Copied to clipboard' : ''}
      </span>
    </>
  );
}