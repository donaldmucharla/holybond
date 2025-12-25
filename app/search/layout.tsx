import { Suspense } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="text-sm text-slate-600">Loading…</div>
          </div>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
