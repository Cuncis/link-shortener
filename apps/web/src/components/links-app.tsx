'use client';

import { useState } from 'react';
import { CreateLinkForm } from './create-link-form';
import { LinksList } from './links-list';

export function LinksApp() {
  const [page, setPage] = useState(1);

  return (
    <>
      <section aria-labelledby="create-heading">
        <h2 id="create-heading" className="mb-3 text-xl font-semibold">
          Create a short link
        </h2>
        <CreateLinkForm onCreated={() => setPage(1)} />
      </section>

      <section aria-labelledby="links-heading">
        <LinksList page={page} onPageChange={setPage} />
      </section>
    </>
  );
}