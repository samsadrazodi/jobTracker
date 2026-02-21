"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { createClient } from "../lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import {
  LayoutDashboard,
  BriefcaseBusiness,
  ScanText,
  Settings,
  Puzzle,
  LogOut,
  ChevronDown,
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
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const emailShort = user?.email?.split("@")[0] ?? "";

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

          {/* Desktop nav */}
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

            {/* User menu */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold uppercase">
                    {emailShort[0]}
                  </div>
                  <span className="hidden sm:inline max-w-[120px] truncate">{emailShort}</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </button>

                {menuOpen && (
                  <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    {/* Dropdown */}
                    <div className="absolute right-0 mt-1 w-48 rounded-lg border border-border bg-background shadow-lg z-20 py-1 text-sm">
                      <div className="px-3 py-2 text-xs text-muted-foreground truncate border-b border-border mb-1">
                        {user.email}
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Mobile bottom nav ── */}
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
        <div className="pb-safe" />
      </nav>

      {/* Pushes page content above the bottom nav on mobile */}
      <div className="sm:hidden h-16" />
    </>
  );
}