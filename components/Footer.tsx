import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <div className="text-lg font-semibold tracking-tight">HolyBond</div>
          <p className="mt-2 text-sm text-slate-400">
            Indian Christian matrimony with manual profile & photo verification for a safer community.
          </p>
        </div>

        <div className="text-sm">
          <div className="font-semibold text-slate-200">Company</div>
          <div className="mt-3 flex flex-col gap-2 text-slate-400">
            <Link className="hover:text-white" href="/about">About</Link>
            <Link className="hover:text-white" href="/contact">Contact</Link>
            <Link className="hover:text-white" href="/search">Search</Link>
          </div>
        </div>

        <div className="text-sm">
          <div className="font-semibold text-slate-200">Legal & Safety</div>
          <div className="mt-3 flex flex-col gap-2 text-slate-400">
            <Link className="hover:text-white" href="/safety">Safety</Link>
            <Link className="hover:text-white" href="/terms">Terms</Link>
            <Link className="hover:text-white" href="/privacy">Privacy</Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} HolyBond
      </div>
    </footer>
  );
}
