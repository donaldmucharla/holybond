import { Suspense } from "react";
import SearchClient from "./SearchClient";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-200">
          Loading search...
        </div>
      }
    >
      <SearchClient />
    </Suspense>
  );
}
