import Link from "next/link";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="bg-navy text-paper px-5 py-4 flex items-center justify-between">
        <Link href="/" className="font-display font-bold text-green no-underline">
          KoyaPay
        </Link>
        <Link href="/login" className="text-sm text-white/80 no-underline">
          Connexion
        </Link>
      </header>
      <main className="max-w-2xl mx-auto px-5 py-8 prose prose-sm">{children}</main>
      <footer className="text-center text-[12px] text-ink-soft py-8 border-t border-[var(--line)]">
        <Link href="/cgu" className="mx-2 text-ink-soft">CGU</Link>
        ·
        <Link href="/confidentialite" className="mx-2 text-ink-soft">Confidentialité</Link>
        ·
        <a href="mailto:koyaapay@gmail.com" className="mx-2 text-ink-soft">Contact</a>
      </footer>
    </div>
  );
}
