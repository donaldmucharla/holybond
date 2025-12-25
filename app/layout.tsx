import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "HolyBond | Indian Christian Matrimony",
  description:
    "Indian Christian matrimony with manual profile & photo verification, privacy-first contact sharing, and safe community tools.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 rounded-xl bg-white px-3 py-2 text-sm text-slate-900"
        >
          Skip to content
        </a>
        <Header />
        <main id="content" className="mx-auto w-full max-w-6xl px-4 py-10">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
