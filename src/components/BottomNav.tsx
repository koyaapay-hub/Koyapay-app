"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Accueil", icon: "home" },
  { href: "/employees", label: "Employés", icon: "users" },
  { href: "/payroll", label: "Paie", icon: "wallet" },
  { href: "/tracking", label: "Suivi", icon: "chart" },
  { href: "/settings", label: "Réglages", icon: "cog" },
];

function Icon({ name, active }: { name: string; active: boolean }) {
  const c = active ? "#2FAF64" : "#5B6472";
  const props = { width: 22, height: 22, fill: "none", stroke: c, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "home":
      return (
        <svg {...props} viewBox="0 0 24 24">
          <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5z" />
        </svg>
      );
    case "users":
      return (
        <svg {...props} viewBox="0 0 24 24">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "wallet":
      return (
        <svg {...props} viewBox="0 0 24 24">
          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
          <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
          <path d="M18 12a2 2 0 0 0 0 4h3v-4h-3z" />
        </svg>
      );
    case "chart":
      return (
        <svg {...props} viewBox="0 0 24 24">
          <path d="M3 3v18h18" />
          <path d="M7 16v-5M12 16V8M17 16v-3" />
        </svg>
      );
    default:
      return (
        <svg {...props} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
        </svg>
      );
  }
}

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[var(--line)] safe-bottom">
      <div className="mx-auto max-w-[420px] flex justify-around items-center px-1 pt-2 pb-[max(8px,env(safe-area-inset-bottom))]">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 min-w-[56px] py-1 no-underline"
            >
              <Icon name={item.icon} active={active} />
              <span className={`text-[10px] font-semibold ${active ? "text-green" : "text-ink-soft"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
