"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BriefcaseBusiness,
  ScanText,
  Settings,
  Puzzle,
} from "lucide-react";

const navLinks = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/applications", label: "Applications", icon: BriefcaseBusiness },
  { href: "/resume-scorer", label: "Resume Scorer", icon: ScanText },
  { href: "/install-extension", label: "Extension", icon: Puzzle },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <>
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
            <BriefcaseBusiness className="h-5 w-5 text-primary" />
            <span>JobTracker</span>
          </Link>

          {/* Desktop nav — hidden on mobile (bottom bar handles it) */}
          <nav className="hidden sm:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ── Mobile bottom nav — visible only on small screens ── */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-md">
        <div className="flex items-center justify-around h-16 px-2">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors flex-1",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="text-[10px] font-medium truncate w-full text-center leading-tight">
                  {label === "Resume Scorer" ? "Scorer" :
                   label === "Install Extension" ? "Extension" : label}
                </span>
              </Link>
            );
          })}
        </div>
        {/* Safe area spacer for iPhone home indicator */}
        <div className="pb-safe" />
      </nav>

      {/* Pushes page content above the bottom nav on mobile */}
      <div className="sm:hidden h-16" />
    </>
  );
}