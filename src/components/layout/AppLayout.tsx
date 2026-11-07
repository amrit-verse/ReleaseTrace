"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Menu,
  X,
  Search,
  CheckCircle2,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { ThemeSelector } from "@/components/ui/ThemeSelector";

interface AppLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  {
    name: "Overview",
    href: "/dashboard",
    iconName: "space_dashboard",
    badge: null,
  },
  {
    name: "Deployments",
    href: "/deployments",
    iconName: "rocket_launch",
    badge: "Active",
  },
  {
    name: "Memory Bank",
    href: "/memories",
    iconName: "psychology",
    badge: "Hindsight",
  },
  {
    name: "Learning Lab",
    href: "/learning-lab",
    iconName: "auto_awesome",
    badge: "Interactive",
  },
  {
    name: "Integrations",
    href: "/integrations",
    iconName: "layers",
    badge: "Connected",
  },
  {
    name: "Settings",
    href: "/settings",
    iconName: "tune",
    badge: null,
  },
];

const mobileNavItems = [
  {
    name: "Overview",
    href: "/dashboard",
    iconName: "space_dashboard",
  },
  {
    name: "Deploys",
    href: "/deployments",
    iconName: "rocket_launch",
  },
  {
    name: "Memories",
    href: "/memories",
    iconName: "psychology",
  },
  {
    name: "Lab",
    href: "/learning-lab",
    iconName: "auto_awesome",
  },
  {
    name: "Settings",
    href: "/settings",
    iconName: "tune",
  },
];

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState("releasetrace-web (Production)");
  const [searchQuery, setSearchQuery] = useState("");
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);

  const projects = [
    "releasetrace-web (Production)",
    "releasetrace-web (Preview)",
    "releasetrace-api (Production)",
  ];

  return (
    <ThemeProvider>
      <ToastProvider>
        <div className="h-screen overflow-hidden liquid-glass-stage text-on-surface flex flex-col font-sans selection:bg-primary-container/20 selection:text-primary">
          {/* Top App Header with Liquid Glass Blur & Specular Rim */}
          <header className="h-16 shrink-0 z-50 pt-safe liquid-glass-header flex items-center">
            <div className="w-full px-4 lg:px-6 flex items-center justify-between gap-3">
              {/* Left: Brand & Liquid Glass Project Selector */}
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-1.5 rounded-lg liquid-glass-pill focus:outline-none"
                  aria-label="Toggle navigation menu"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                <Link href="/dashboard" className="flex items-center gap-2.5 group flex-shrink-0">
                  <div className="w-8 h-8 rounded-lg liquid-glass-pill flex items-center justify-center text-primary group-hover:scale-105 transition-transform shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">hub</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold tracking-tight text-[15px] hidden xs:inline">
                      ReleaseTrace
                    </span>
                    <span className="text-[10px] font-mono opacity-70 hidden sm:inline -mt-0.5">
                      Liquid Glass Engine
                    </span>
                  </div>
                </Link>

                {/* Liquid Glass Project Dropdown Pill */}
                <div className="relative">
                  <button
                    onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full liquid-glass-pill min-h-[34px] transition-all shadow-sm"
                  >
                    <span className="font-mono text-[11px] font-semibold truncate max-w-[130px] sm:max-w-[200px]">
                      {selectedProject}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  </button>

                  {projectDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1.5 w-64 liquid-glass-card rounded-xl py-2 z-50 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider font-semibold opacity-60">
                        Switch Environment
                      </div>
                      {projects.map((proj) => (
                        <button
                          key={proj}
                          onClick={() => {
                            setSelectedProject(proj);
                            setProjectDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs font-mono transition-colors ${
                            selectedProject === proj
                              ? "project-option-selected font-bold"
                              : "project-option-default"
                          }`}
                        >
                          {proj}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Actions, Retained indicator, Avatar */}
              <div className="flex items-center gap-2.5 flex-shrink-0">
                {/* Search Bar (Liquid Glass on Desktop) */}
                <div className="relative hidden md:block w-48 xl:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 opacity-50" />
                  <input
                    type="text"
                    placeholder="Search commits, PRs, drift..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs rounded-full pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono shadow-xs"
                  />
                </div>

                {/* Retained Memory Pulse Glass Pill */}
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full liquid-glass-pill shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wide">
                    RETAINED
                  </span>
                </div>

                {/* Theme Picker & Light/Dark Mode Controls */}
                <ThemeSelector />

                {/* Notifications Glass Button */}
                <button
                  aria-label="Notifications"
                  className="w-9 h-9 flex items-center justify-center rounded-full liquid-glass-pill transition-colors relative shadow-sm"
                >
                  <span className="material-symbols-outlined text-[19px]">notifications</span>
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white/80"></span>
                </button>

                {/* User Avatar Glass Button */}
                <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-sky-500 text-white flex items-center justify-center shadow-md border border-white/40">
                  <span className="material-symbols-outlined text-[18px]">person</span>
                </div>
              </div>
            </div>
          </header>

          {/* Content Layout Body */}
          <div className="flex-1 flex overflow-hidden">
            {/* Desktop Left Sidebar (Liquid Glass Dock) */}
            <aside className="hidden lg:flex w-64 flex-col liquid-glass-sidebar shrink-0 py-5 px-3 justify-between overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <p className="px-3 text-[10px] font-mono uppercase tracking-wider opacity-60 font-semibold mb-2">
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
                          <div
                            className={`relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                              isActive ? "nav-item-active" : "nav-item-inactive"
                            }`}
                          >
                            <div className="relative z-10 flex items-center gap-2.5">
                              <span
                                className={`material-symbols-outlined text-[18px] ${
                                  isActive ? "text-amber-400 font-bold" : "opacity-60"
                                }`}
                              >
                                {item.iconName}
                              </span>
                              <span>{item.name}</span>
                            </div>
                            {item.badge && (
                              <span
                                className={`relative z-10 text-[10px] font-mono px-2 py-0.5 rounded-full ${
                                  isActive
                                    ? "bg-white/20 text-white font-bold"
                                    : "opacity-75 bg-black/5 dark:bg-white/10"
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                {/* Deterministic Release Gates Glass Box */}
                <div className="liquid-glass-card rounded-xl p-3 text-xs space-y-2 shadow-xs">
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="flex items-center gap-1.5 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>RELEASE GATES</span>
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30 text-[10px]">
                      ACTIVE
                    </span>
                  </div>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between opacity-80">
                      <span className="opacity-70">Auto-block critical:</span>
                      <span className="font-semibold">ENFORCED</span>
                    </div>
                    <div className="flex justify-between opacity-80">
                      <span className="opacity-70">Prisma migration:</span>
                      <span className="font-semibold text-emerald-500">VERIFIED</span>
                    </div>
                    <div className="flex justify-between opacity-80">
                      <span className="opacity-70">Drift comparison:</span>
                      <span className="font-semibold text-emerald-500">STRICT</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Footer */}
              <div className="border-t border-slate-200/60 dark:border-white/10 pt-3 px-2 text-[11px] font-mono opacity-70 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Hindsight Bank</span>
                  <span className="text-emerald-500 flex items-center space-x-1 font-bold">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Isolated</span>
                  </span>
                </div>
                <p className="text-[10px] opacity-60">
                  Vectorize Memory Engine Cloud
                </p>
              </div>
            </aside>

            {/* Mobile Drawer (Liquid Glass) */}
            <AnimatePresence>
              {mobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.16 }}
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-md"
                    onClick={() => setMobileMenuOpen(false)}
                  />
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "-100%" }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    className="relative z-10 w-72 liquid-glass-card rounded-r-2xl border-l-0 p-5 flex flex-col justify-between shadow-2xl h-full overflow-y-auto"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/10">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg liquid-glass-pill flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-[18px]">hub</span>
                          </div>
                          <span className="font-semibold text-sm">ReleaseTrace</span>
                        </div>
                        <button
                          onClick={() => setMobileMenuOpen(false)}
                          className="opacity-70 hover:opacity-100 p-1"
                          aria-label="Close menu"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <nav className="space-y-1.5">
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
                              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all ${
                                isActive ? "nav-item-active" : "nav-item-inactive"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[18px]">
                                  {item.iconName}
                                </span>
                                <span>{item.name}</span>
                              </div>
                              {item.badge && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full opacity-80 bg-black/5 dark:bg-white/10">
                                  {item.badge}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </nav>
                    </div>

                    <div className="pt-4 border-t border-slate-200/60 dark:border-white/10 text-xs font-mono opacity-60">
                      Every release leaves a trace.
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Main Application Content Body */}
            <main className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-24 lg:pb-8">
              {children}
            </main>
          </div>

          {/* Bottom Mobile Floating Liquid Glass Navigation Bar */}
          <nav
            className="fixed bottom-3 left-4 right-4 z-50 pb-safe liquid-glass-navbar rounded-2xl shadow-2xl lg:hidden"
            aria-label="Mobile Navigation"
          >
            <div className="flex justify-around items-center h-14 px-2">
              {mobileNavItems.map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard" || pathname === "/"
                    : pathname?.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex flex-col items-center justify-center gap-0.5 min-w-[50px] min-h-[40px] rounded-xl transition-all ${
                      isActive
                        ? "text-primary font-bold scale-105"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{item.iconName}</span>
                    <span className="font-mono text-[9px] uppercase tracking-wider">
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
}
