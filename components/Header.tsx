import Link from "next/link";
import Image from "next/image";
import UserMenu from "@/components/UserMenu";

const NavLink = ({ href, label }: { href: string; label: string }) => (
  <Link
    href={href}
    className="rounded-xl px-3 py-2 text-sm text-slate-200 hover:bg-white/5 hover:text-white transition"
  >
    {label}
  </Link>
);

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          {/* Logo */}
          <div className="relative h-10 w-10 overflow-hidden rounded-2xl ring-1 ring-white/10 bg-white/5">
            <Image
              src="/logo.png"
              alt="HolyBond logo"
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Text */}
          <div className="leading-tight">
            <div className="text-lg font-semibold tracking-tight text-white">
              HolyBond
            </div>
            <div className="text-xs text-slate-300">
              Indian Christian Matrimony
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink href="/search" label="Search" />
          <NavLink href="/safety" label="Safety" />
          <NavLink href="/contact" label="Contact" />
          <NavLink href="/about" label="About" />
        </nav>

        {/* ✅ Auth area */}
        <div className="flex items-center gap-2">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
