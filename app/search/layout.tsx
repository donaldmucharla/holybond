import { Suspense } from "react";
import SearchAuthGate from "@/components/SearchAuthGate";

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-200">
          Checking session...
        </div>
      }
    >
      <SearchAuthGate>{children}</SearchAuthGate>
    </Suspense>
  );
}
