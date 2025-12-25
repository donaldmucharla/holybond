import { Suspense } from "react";
import SearchClient from "./SearchClient";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="text-sm text-slate-600">Loading search…</div>
          </div>
        </div>
      }
    >
      <SearchClient />
    </Suspense>
  );
}
