"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  BrainCircuit,
  GitCommit,
  Layers,
  LayoutGrid,
  Menu,
  Network,
  Rocket,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { hoverSubtle, tapSubtle } from "@/lib/motion";

interface AppLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: Activity },
  { name: "Deployments", href: "/deployments", icon: GitCommit },
  { name: "Memory Explorer", href: "/memories", icon: BrainCircuit },
  { name: "Learning Lab", href: "/learning-lab", icon: Sparkles },
  { name: "Integrations", href: "/integrations", icon: Layers },
  { name: "Settings", href: "/settings", icon: SlidersHorizontal },
];

const mobileTabs = [
  { name: "Overview", href: "/dashboard", icon: LayoutGrid },
  { name: "Deploys", href: "/deployments", icon: Rocket },
  { name: "Memories", href: "/memories", icon: BrainCircuit },
  { name: "Settings", href: "/settings", icon: SlidersHorizontal },
];

function isRouteActive(pathname: string | null, href: string) {
  return href === "/dashboard"
    ? pathname === "/dashboard" || pathname === "/"
    : Boolean(pathname?.startsWith(href));
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-canvas text-text-primary flex flex-col font-sans selection:bg-signal/20">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-surface-border/60 bg-surface/95 px-4 shadow-[0_1px_4px_rgba(0,0,0,0.03)] backdrop-blur-md lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="rounded-lg p-2 text-text-secondary transition hover:bg-surface-subtle hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-signal/30 lg:hidden"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <Link href="/dashboard" className="group flex shrink-0 items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-signal/10 text-signal shadow-panel-subtle">
                <Network className="h-[18px] w-[18px]" />
              </span>
              <span className="flex flex-col">
                <span className="flex items-center gap-1.5 text-[15px] font-semibold tracking-tight text-text-primary">
                  ReleaseTrace
                  <span className="rounded-full border border-surface-border bg-brand-subtle px-1.5 py-0.5 font-mono text-[9px] font-medium text-signal">
                    v1.0
                  </span>
                </span>
                <span className="hidden font-mono text-[10px] text-text-muted sm:block">
                  Every release leaves a trace.
                </span>
              </span>
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden text-[11px] text-text-muted md:inline">Project-scoped release intelligence</span>
            <Link
              href="/integrations"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-surface-border bg-surface px-3 py-2 text-xs font-semibold text-text-secondary shadow-panel-subtle transition hover:bg-surface-subtle hover:text-signal"
            >
              <Activity className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Integration health</span>
              <span className="sm:hidden">Health</span>
            </Link>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <aside className="hidden w-60 shrink-0 flex-col justify-between border-r border-surface-border bg-surface px-3 py-4 lg:flex">
            <div className="space-y-6">
              <div>
                <p className="mb-2 px-3 font-mono text-[10px] uppercase tracking-wider text-text-muted">
                  Release intelligence
                </p>
                <nav className="space-y-1" aria-label="Main navigation">
                  {navItems.map((item) => {
                    const active = isRouteActive(pathname, item.href);
                    return (
                      <Link key={item.href} href={item.href} className="block">
                        <motion.div
                          whileHover={hoverSubtle}
                          whileTap={tapSubtle}
                          className={`relative flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${active ? "text-signal" : "text-text-secondary hover:bg-surface-subtle hover:text-text-primary"}`}
                        >
                          {active && (
                            <motion.span
                              layoutId="active-nav-indicator"
                              className="absolute inset-0 rounded-lg border border-surface-border bg-brand-subtle"
                              transition={{ type: "spring", stiffness: 350, damping: 30 }}
                            />
                          )}
                          <item.icon className={`relative z-10 h-4 w-4 ${active ? "text-signal" : "text-text-muted"}`} />
                          <span className="relative z-10">{item.name}</span>
                        </motion.div>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <section className="rounded-xl border border-surface-border bg-surface-subtle/70 p-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                  <ShieldCheck className="h-4 w-4 text-signal" />
                  Assessment workflow
                </div>
                <ol className="mt-3 space-y-2.5">
                  <li className="flex gap-2 text-[11px] leading-relaxed text-text-secondary">
                    <span className="font-mono text-text-muted">01</span>
                    <span>Observe current deployment evidence</span>
                  </li>
                  <li className="flex gap-2 text-[11px] leading-relaxed text-text-secondary">
                    <span className="font-mono text-text-muted">02</span>
                    <span>Compare against verified incident memory</span>
                  </li>
                  <li className="flex gap-2 text-[11px] leading-relaxed text-text-secondary">
                    <span className="font-mono text-text-muted">03</span>
                    <span>Engineer verifies the root cause and resolution</span>
                  </li>
                </ol>
              </section>
            </div>

            <div className="space-y-1 border-t border-surface-border px-2 pt-3">
              <p className="text-[11px] font-semibold text-text-secondary">Project-scoped memory</p>
              <p className="text-[10px] leading-relaxed text-text-muted">Vectorize Hindsight · Historical context is not current telemetry.</p>
            </div>
          </aside>

          <AnimatePresence>
            {mobileMenuOpen && (
              <div className="fixed inset-0 z-50 flex lg:hidden">
                <motion.button
                  type="button"
                  aria-label="Close navigation menu"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.16 }}
                  className="fixed inset-0 bg-[#1a1c1c]/40 backdrop-blur-sm"
                  onClick={() => setMobileMenuOpen(false)}
                />
                <motion.aside
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  className="relative z-10 flex w-72 flex-col justify-between border-r border-surface-border bg-surface p-4 shadow-panel-elevated"
                >
                  <div>
                    <div className="mb-4 flex items-center justify-between border-b border-surface-border pb-3">
                      <span className="text-sm font-semibold text-text-primary">ReleaseTrace</span>
                      <button
                        type="button"
                        onClick={() => setMobileMenuOpen(false)}
                        className="rounded-lg p-1 text-text-muted hover:bg-surface-subtle hover:text-text-primary"
                        aria-label="Close menu"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <nav className="space-y-1" aria-label="Mobile navigation">
                      {navItems.map((item) => {
                        const active = isRouteActive(pathname, item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm ${active ? "border border-surface-border bg-brand-subtle font-semibold text-signal" : "text-text-secondary hover:bg-surface-subtle"}`}
                          >
                            <item.icon className="h-4 w-4" />
                            {item.name}
                          </Link>
                        );
                      })}
                    </nav>
                  </div>
                  <p className="border-t border-surface-border pt-4 font-mono text-[10px] text-text-muted">
                    Every release leaves a trace.
                  </p>
                </motion.aside>
              </div>
            )}
          </AnimatePresence>

          <main className="flex min-w-0 flex-1 flex-col overflow-y-auto pb-20 lg:pb-0">
            {children}
          </main>
        </div>

        <nav
          aria-label="Primary mobile navigation"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-surface-border bg-surface/95 shadow-[0_-1px_4px_rgba(0,0,0,0.04)] backdrop-blur-md lg:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div className="grid grid-cols-4">
            {mobileTabs.map((tab) => {
              const active = isRouteActive(pathname, tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-14 flex-col items-center justify-center gap-1 py-2 ${active ? "text-signal" : "text-text-muted"}`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span className="font-mono text-[9px] font-semibold uppercase tracking-wider">{tab.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </ToastProvider>
  );
}
