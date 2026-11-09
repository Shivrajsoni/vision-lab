"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "/playground", label: "Playground" },
  { href: "/models", label: "Models" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/status", label: "Status" },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-[76rem] flex-wrap items-center justify-between gap-x-8 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="font-display text-xl font-bold tracking-tight [font-stretch:88%]">
          Vision Lab
        </Link>
        {/* On phones the links drop to their own row so the name and theme switch share the first. */}
        <nav
          aria-label="Main"
          className="order-last flex basis-full flex-wrap gap-x-5 gap-y-1 text-[0.95rem] sm:order-none sm:flex-1 sm:basis-auto"
        >
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "text-text underline decoration-accent decoration-2 underline-offset-[6px]"
                    : "text-muted hover:text-text"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
