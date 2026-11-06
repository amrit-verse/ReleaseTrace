"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  GitCommit,
  BrainCircuit,
  SlidersHorizontal,
  Layers,
  Terminal,
  Activity,
  Menu,
  X,
  Search,
  CheckCircle2,
  Sparkles,
  Database,
  ShieldCheck,
} from "lucide-react";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { hoverSubtle, tapSubtle } from "@/lib/motion";

interface AppLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Activity,
    badge: null,
  },
  {
    name: "Deployments",
    href: "/deployments",
    icon: GitCommit,
    badge: "Active",
  },
  {
    name: "Memory Explorer",
    href: "/memories",
    icon: BrainCircuit,
    badge: "Hindsight",
  },
  {
    name: "Learning Lab",
    href: "/learning-lab",
    icon: Sparkles,
    badge: "Interactive",
  },
  {
    name: "Integrations",
    href: "/integrations",
    icon: Layers,
    badge: "Connected",
  },
  {
    name: "Settings",
    href: "/settings",
    icon: SlidersHorizontal,
    badge: null,
  },
];

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState("releasetrace-web (Production)");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <ToastProvider>
      <div className="min-h-screen bg-canvas text-canvas-text flex flex-col font-sans selection:bg-signal/20 selection:text-white">
        {/* Top Engineering System Status Bar */}
        <header className="border-b border-surface-border bg-surface/95 backdrop-blur-md sticky top-0 z-40 h-14 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-text-secondary hover:text-text-primary p-1 rounded focus:outline-none focus:ring-1 focus:ring-surface-border"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/dashboard" className="flex items-center space-x-2.5 group">
              <div className="w-8 h-8 rounded bg-surface-elevated border border-surface-border flex items-center justify-center text-signal font-mono font-bold text-sm shadow-panel">
                <Terminal className="w-4 h-4 text-signal" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm tracking-tight text-text-primary flex items-center space-x-1.5">
                  <span>ReleaseTrace</span>
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-surface-elevated text-signal border border-surface-border">
                    v1.0
                  </span>
                </span>
                <span className="text-[10px] font-mono text-text-muted">
                  Every release leaves a trace.
                </span>
              </div>
            </Link>

            <div className="hidden md:flex items-center pl-4 border-l border-surface-border space-x-2">
              <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">PROJECT:</span>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="bg-surface-elevated text-xs font-mono text-text-secondary border border-surface-border rounded px-2.5 py-1 focus:outline-none focus:border-signal/60"
              >
                <option value="releasetrace-web (Production)">releasetrace-web (Production / Vercel)</option>
                <option value="releasetrace-web (Preview)">releasetrace-web (Preview / Vercel)</option>
                <option value="releasetrace-api (Production)">releasetrace-api (Production / Neon)</option>
              </select>
            </div>
          </div>

          {/* Global Search and Engine Status */}
          <div className="flex items-center space-x-3">
            <div className="relative hidden sm:block w-48 lg:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search commit SHA, PR, drift..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-elevated border border-surface-border text-xs rounded pl-8 pr-3 py-1.5 text-text-primary placeholder-text-muted focus:outline-none focus:border-signal/60 focus:ring-1 focus:ring-signal/20 font-mono"
              />
            </div>

            {/* Hindsight Memory Status Indicator */}
            <div className="flex items-center space-x-2 bg-surface-elevated border border-surface-border px-2.5 py-1 rounded text-xs font-mono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sage opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sage"></span>
              </span>
              <span className="text-text-muted hidden xl:inline">HINDSIGHT:</span>
              <span className="text-sage font-medium">RETAINED</span>
            </div>

            {/* Neon Connection Status */}
            <div className="hidden md:flex items-center space-x-1.5 bg-surface-elevated border border-surface-border px-2.5 py-1 rounded text-xs font-mono text-text-muted">
              <Database className="w-3 h-3 text-signal" />
              <span>NEON: POOLED</span>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Desktop Sidebar Navigation */}
          <aside className="hidden lg:flex w-60 flex-col border-r border-surface-border bg-surface shrink-0 py-4 px-3 justify-between">
            <div className="space-y-6">
              <div>
                <p className="px-3 text-[10px] font-mono uppercase tracking-wider text-text-muted mb-2">
                  Release Intelligence
                </p>
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const isActive =
                      item.href === "/dashboard"
                        ? pathname === "/dashboard" || pathname === "/"
                        : pathname?.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="relative block"
                      >
                        <motion.div
                          whileHover={hoverSubtle}
                          whileTap={tapSubtle}
                          className={`relative flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-colors ${
                            isActive
                              ? "text-text-primary font-semibold"
                              : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated/40"
                          }`}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="active-nav-indicator"
                              className="absolute inset-0 bg-surface-elevated border-l-2 border-signal rounded"
                              transition={{ type: "spring", stiffness: 350, damping: 30 }}
                            />
                          )}
                          <div className="relative z-10 flex items-center space-x-2.5">
                            <item.icon
                              className={`w-4 h-4 ${
                                isActive ? "text-signal" : "text-text-muted"
                              }`}
                            />
                            <span>{item.name}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={`relative z-10 text-[10px] font-mono px-1.5 py-0.2 rounded ${
                                isActive
                                  ? "bg-signal/15 text-signal border border-signal/30"
                                  : "bg-surface-elevated text-text-muted border border-surface-border"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </motion.div>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Deterministic Gating Rules Overview */}
              <div className="border border-surface-border bg-surface-elevated/60 rounded p-3 text-xs space-y-2">
                <div className="flex items-center justify-between text-text-secondary font-mono text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-sage" />
                    <span>RELEASE GATES</span>
                  </span>
                  <span className="text-sage font-semibold">ACTIVE</span>
                </div>
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-text-secondary">
                    <span className="text-text-muted">Auto-block critical:</span>
                    <span className="text-text-primary">ENFORCED</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span className="text-text-muted">Prisma migration:</span>
                    <span className="text-signal font-medium">VERIFIED</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span className="text-text-muted">Drift comparison:</span>
                    <span className="text-sage font-medium">STRICT</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Footer */}
            <div className="border-t border-surface-border pt-3 px-2 text-[11px] font-mono text-text-muted space-y-1">
              <div className="flex items-center justify-between">
                <span>Hindsight Bank</span>
                <span className="text-sage flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Isolated</span>
                </span>
              </div>
              <p className="text-[10px] text-text-muted">
                Vectorize Memory Engine Cloud
              </p>
            </div>
          </aside>

          {/* Mobile Navigation Drawer with AnimatePresence */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <div className="lg:hidden fixed inset-0 z-50 flex">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.16 }}
                  className="fixed inset-0 bg-black/70 backdrop-blur-sm"
                  onClick={() => setMobileMenuOpen(false)}
                />
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  className="relative z-10 w-72 bg-surface border-r border-surface-border p-4 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                      <span className="font-semibold text-sm text-text-primary">ReleaseTrace</span>
                      <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-text-muted hover:text-text-primary"
                        aria-label="Close menu"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <nav className="space-y-1">
                      {navItems.map((item) => {
                        const isActive =
                          item.href === "/dashboard"
                            ? pathname === "/dashboard" || pathname === "/"
                            : pathname?.startsWith(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center justify-between px-3 py-2.5 rounded text-sm ${
                              isActive
                                ? "bg-surface-elevated text-text-primary font-medium border-l-2 border-signal"
                                : "text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <item.icon className="w-4 h-4 text-text-muted" />
                              <span>{item.name}</span>
                            </div>
                            {item.badge && (
                              <span className="text-[10px] font-mono bg-surface-elevated px-1.5 py-0.5 rounded text-text-muted border border-surface-border">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </nav>
                  </div>
                  <div className="pt-4 border-t border-surface-border text-xs text-text-muted font-mono">
                    Every release leaves a trace.
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Main Application Content */}
          <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}

