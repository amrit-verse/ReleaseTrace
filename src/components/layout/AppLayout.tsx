"use client";

import React, { useState, useEffect } from "react";
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
  GraduationCap,
  Zap,
  Workflow,
  BookOpen,
} from "lucide-react";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { ThemeSelector } from "@/components/ui/ThemeSelector";
import {
  DevOpsGuideProvider,
  useDevOpsGuide,
} from "@/context/DevOpsGuideContext";
import { DevOpsFlowModal } from "@/components/ui/DevOpsFlowModal";
import { QuickReleaseSimulatorModal } from "@/components/ui/QuickReleaseSimulatorModal";
import { DevOpsGlossaryModal } from "@/components/ui/DevOpsGlossaryModal";
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

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const {
    isGuideMode,
    toggleGuideMode,
    setIsFlowModalOpen,
    setIsSimulatorModalOpen,
    setIsGlossaryModalOpen,
  } = useDevOpsGuide();

  // Keyboard shortcut listener ('?' for glossary)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setIsGlossaryModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setIsGlossaryModalOpen]);

  return (
    <div className="liquid-glass-stage min-h-screen bg-canvas text-text-primary flex flex-col font-sans selection:bg-signal/20">
      <header className="liquid-glass-header sticky top-0 z-40 flex h-16 items-center justify-between border-b border-surface-border/60 bg-surface/95 px-3 lg:px-6 shadow-[0_1px_4px_rgba(0,0,0,0.03)] backdrop-blur-md">
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

        {/* Global Header Actions: Student / Beginner Toolkit & Real Status */}
        <div className="flex shrink-0 items-center gap-2">
          {/* How It Works Button */}
          <button
            type="button"
            onClick={() => setIsFlowModalOpen(true)}
            className="hidden sm:inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-surface-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-text-secondary shadow-panel-subtle transition hover:bg-surface-subtle hover:text-signal"
            title="Inspect 5-Stage Architecture Workflow"
          >
            <Workflow className="h-3.5 w-3.5 text-signal" />
            <span className="hidden md:inline">How It Works</span>
          </button>

          {/* Sandbox Simulator Button */}
          <button
            type="button"
            onClick={() => setIsSimulatorModalOpen(true)}
            className="hidden sm:inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-signal/40 bg-signal/10 px-2.5 py-1.5 text-xs font-semibold text-signal shadow-panel-subtle transition hover:bg-signal/20"
            title="Test a simulated release scenario"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Sandbox</span>
          </button>

          {/* Glossary Button */}
          <button
            type="button"
            onClick={() => setIsGlossaryModalOpen(true)}
            className="hidden sm:inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-surface-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-text-secondary shadow-panel-subtle transition hover:bg-surface-subtle hover:text-text-primary"
            title="DevOps Terms & Concepts Glossary (Press '?')"
          >
            <BookOpen className="h-3.5 w-3.5 text-text-muted" />
            <span className="hidden lg:inline">Glossary</span>
          </button>

          {/* Student Guide Toggle */}
          <button
            type="button"
            onClick={toggleGuideMode}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
              isGuideMode
                ? "border-sage/50 bg-sage/10 text-sage"
                : "border-surface-border bg-surface text-text-muted hover:text-text-secondary"
            }`}
            title="Toggle Beginner Explanatory Mode"
          >
            <GraduationCap className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Guide: {isGuideMode ? "ON" : "OFF"}</span>
          </button>

          <Link
            href="/integrations"
            className="hidden md:inline-flex min-h-9 items-center gap-2 rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary shadow-panel-subtle transition hover:bg-surface-subtle hover:text-signal"
          >
            <Activity className="h-3.5 w-3.5 text-signal" />
            <span>Health</span>
          </Link>
          <ThemeSelector />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="liquid-glass-sidebar hidden w-60 shrink-0 flex-col justify-between border-r border-surface-border bg-surface px-3 py-4 lg:flex">
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

            {/* Beginner Student Toolkit */}
            <section className="rounded-xl border border-surface-border bg-surface-subtle/70 p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-text-primary">
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4 text-signal" />
                  <span>Student Toolkit</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-signal/15 text-signal border border-signal/30">
                  DevOps 101
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <button
                  type="button"
                  onClick={() => setIsFlowModalOpen(true)}
                  className="w-full text-left p-1.5 rounded hover:bg-surface text-text-secondary hover:text-signal transition-colors flex items-center justify-between group"
                >
                  <span className="flex items-center gap-1.5">
                    <Workflow className="w-3.5 h-3.5 text-text-muted group-hover:text-signal" />
                    <span>How It Works</span>
                  </span>
                  <span className="text-[10px] font-mono text-text-muted">5 Steps</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSimulatorModalOpen(true)}
                  className="w-full text-left p-1.5 rounded hover:bg-surface text-text-secondary hover:text-sage transition-colors flex items-center justify-between group"
                >
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-text-muted group-hover:text-sage" />
                    <span>Test Sandbox</span>
                  </span>
                  <span className="text-[10px] font-mono text-sage font-medium">Try Now</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsGlossaryModalOpen(true)}
                  className="w-full text-left p-1.5 rounded hover:bg-surface text-text-secondary hover:text-text-primary transition-colors flex items-center justify-between group"
                >
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-text-muted group-hover:text-text-primary" />
                    <span>DevOps Glossary</span>
                  </span>
                  <span className="text-[10px] font-mono text-text-muted">Terms</span>
                </button>
              </div>
            </section>

            {/* Assessment Workflow Overview */}
            <section className="rounded-xl border border-surface-border bg-surface-subtle/50 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                <ShieldCheck className="h-4 w-4 text-signal" />
                Safety Floors
              </div>
              <ol className="mt-2 space-y-2">
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

          <div className="space-y-1.5 border-t border-surface-border px-2 pt-3 pb-1">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary">
              <span className="h-1.5 w-1.5 rounded-full bg-signal" />
              <span>Project Memory Bank</span>
            </div>
            <p className="text-[10px] leading-relaxed text-text-muted">
              Vectorize Hindsight · Pre-flight incident recall
            </p>
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

                  {/* Mobile Quick Actions */}
                  <div className="mt-4 pt-3 border-t border-surface-border space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setIsFlowModalOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg bg-surface-subtle text-xs font-semibold text-signal flex items-center gap-2"
                    >
                      <Workflow className="w-4 h-4" />
                      <span>How ReleaseTrace Works</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setIsSimulatorModalOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg bg-signal/15 text-xs font-semibold text-signal flex items-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Release Simulator Sandbox</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setIsGlossaryModalOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg bg-surface-subtle text-xs font-semibold text-text-secondary flex items-center gap-2"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>DevOps Glossary</span>
                    </button>
                  </div>
                </div>
                <p className="border-t border-surface-border pt-4 font-mono text-[10px] text-text-muted">
                  Every release leaves a trace.
                </p>
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto pb-28 lg:pb-0">
          {children}
        </main>
      </div>

      <nav
        aria-label="Primary mobile navigation"
        className="liquid-glass-navbar fixed inset-x-0 bottom-0 z-40 border-t border-surface-border bg-surface/95 shadow-[0_-1px_4px_rgba(0,0,0,0.04)] backdrop-blur-md lg:hidden"
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

      {/* Global Student & DevOps Helper Modals */}
      <DevOpsFlowModal />
      <QuickReleaseSimulatorModal />
      <DevOpsGlossaryModal />
    </div>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <DevOpsGuideProvider>
          <AppLayoutContent>{children}</AppLayoutContent>
        </DevOpsGuideProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
