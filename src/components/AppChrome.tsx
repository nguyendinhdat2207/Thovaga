"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Mascot } from "@/components/ui/Mascot";
import { signOut } from "@/app/login/actions";

const NAV_ITEMS = [
  { href: "/", label: "Học", match: (p: string) => p === "/" || p.startsWith("/subjects") || p.startsWith("/quiz") },
  { href: "/vocab", label: "Từ vựng", match: (p: string) => p.startsWith("/vocab") },
  { href: "/history", label: "Lịch sử", match: (p: string) => p.startsWith("/history") },
  { href: "/upload", label: "Tài liệu", match: (p: string) => p.startsWith("/upload") },
];

export function AppChrome({
  totalStudiedLabel,
  children,
}: {
  totalStudiedLabel: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const hideChrome =
    (pathname.startsWith("/quiz/") && !pathname.includes("/result")) ||
    pathname.startsWith("/vocab/flashcard") ||
    pathname.startsWith("/vocab/quiz");

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      {!hideChrome && (
        <header
          className="border-b border-border sticky top-0 bg-white z-10"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="max-w-[1160px] mx-auto px-5 py-3 flex items-center gap-4 flex-wrap">
            <Link href="/" className="flex items-center gap-2.5">
              <Mascot size={38} />
              <span className="font-display font-extrabold text-xl text-ink whitespace-nowrap">
                Thỏ &amp; Gà
              </span>
            </Link>
            <nav className="hidden sm:flex gap-0.5">
              {NAV_ITEMS.map((item) => {
                const active = item.match(pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`font-display px-3.5 py-1.5 border-b-[3px] ${
                      active
                        ? "font-extrabold text-ink border-yellow"
                        : "font-bold text-ink-muted border-transparent"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="flex-1" />
            <span className="hidden sm:inline font-bold text-sm text-ink-muted whitespace-nowrap">
              {totalStudiedLabel} đã học
            </span>
            <div className="w-[34px] h-[34px] rounded-full border-2 border-border overflow-hidden shrink-0">
              <Mascot size={34} variant="alt" focusTop={false} />
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="font-bold text-xs text-ink-faint hover:text-orange whitespace-nowrap"
              >
                Đăng xuất
              </button>
            </form>
          </div>
        </header>
      )}

      <main className="flex-1">{children}</main>

      {!hideChrome && (
        <nav
          className="sm:hidden sticky bottom-0 bg-white border-t border-border grid grid-cols-4 pt-2 px-1.5"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          {NAV_ITEMS.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 py-0.5"
              >
                <span
                  className={`w-[22px] h-[22px] rounded-[7px] ${active ? "bg-yellow" : "bg-track"}`}
                />
                <span
                  className={`font-display text-[11px] ${active ? "font-extrabold text-ink" : "font-bold text-ink-muted"}`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
