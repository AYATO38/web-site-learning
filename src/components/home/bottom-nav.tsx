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
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid h-[4.25rem] max-w-lg grid-cols-5">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-col items-center justify-center gap-1.5",
                active ? "text-accent" : "text-muted-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="size-5 shrink-0" strokeWidth={active ? 2.5 : 2} />
              <span className="max-w-full truncate px-1 text-center text-[10px] font-semibold leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
