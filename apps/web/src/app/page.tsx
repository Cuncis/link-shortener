import { LinksApp } from '@/components/links-app';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl space-y-10 px-4 py-8">
      <header>
        <h1 className="text-3xl font-bold">Link Shortener</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Paste a long URL, get a short one, and watch the clicks.
        </p>
      </header>

      <LinksApp />
    </main>
  );
}