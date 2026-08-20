"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  PlayCircle,
  User,
  Sparkles,
  Gamepad,
  type LucideIcon,
} from "lucide-react";

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/video", label: "講義動画", icon: PlayCircle },
  { href: "/next-server-day", label: "次サバDAY", icon: Sparkles },
  { href: "/", label: "ホーム", icon: Home },
  { href: "/game", label: "ゲーム", icon: Gamepad },
  { href: "/account", label: "アカウント", icon: User },
];

const HIDE_NAV_PREFIXES = ["/quiz", "/next-server-day"];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function BottomNav() {
  const pathname = usePathname();

  if (HIDE_NAV_PREFIXES.some((p) => pathname.startsWith(p))) {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 overflow-visible border-t border-border bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid min-h-[4.75rem] max-w-lg grid-cols-5 items-end px-1 pt-3">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          const isHome = item.href === "/";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-col items-center justify-end gap-1 pb-2",
                isHome && "-mt-6",
                active ? "text-accent" : "text-muted-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              {isHome ? (
                <span
                  className={cn(
                    "flex size-14 shrink-0 items-center justify-center rounded-full text-white shadow-[0_10px_24px_rgba(59,158,255,0.42)] ring-[4px] ring-white sm:size-[3.65rem]",
                    active ? "bg-accent-dark" : "bg-accent",
                  )}
                >
                  <Icon className="size-8" strokeWidth={2.4} />
                </span>
              ) : (
                <Icon className="size-5 shrink-0" strokeWidth={active ? 2.5 : 2} />
              )}
              <span
                className={cn(
                  "max-w-full px-0.5 text-center text-[9px] font-medium leading-tight sm:text-[10px]",
                  isHome && "mt-1",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
