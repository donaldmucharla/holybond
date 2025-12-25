// app/search/page.tsx
import { Suspense } from "react";
import SearchClient from "./SearchClient";

type SP = Record<string, string | string[] | undefined>;

export default function SearchPage({ searchParams }: { searchParams: SP }) {
  return (
    <Suspense
      fallback={
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-200">
          Loading search...
        </div>
      }
    >
      <SearchClient searchParams={searchParams} />
    </Suspense>
  );
}
