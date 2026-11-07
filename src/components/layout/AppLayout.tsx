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
    <ToastProvider>
      <div className="min-h-screen bg-surface text-on-surface flex flex-col font-sans selection:bg-primary-container/20 selection:text-primary">
        {/* Top App Header */}
        <header className="fixed top-0 w-full z-50 pt-safe bg-surface/90 backdrop-blur-md border-b border-surface-container-highest/60 shadow-[0_1px_4px_rgba(0,0,0,0.03)] h-16">
          <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-3">
            {/* Left: Brand & Project Selector */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden text-slate-600 hover:text-slate-900 p-1.5 rounded-lg border border-slate-200 focus:outline-none"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <Link href="/dashboard" className="flex items-center gap-2 group flex-shrink-0">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">hub</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-900 tracking-tight text-[15px] hidden xs:inline">
                    ReleaseTrace
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 hidden sm:inline -mt-0.5">
                    Release Intelligence
                  </span>
                </div>
              </Link>

              {/* Project Dropdown Pill */}
              <div className="relative">
                <button
                  onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-low border border-slate-200 hover:bg-surface-container text-slate-700 min-h-[34px] transition-colors shadow-sm"
                >
                  <span className="font-mono text-[11px] font-medium text-primary truncate max-w-[130px] sm:max-w-[200px]">
                    {selectedProject}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {projectDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-50">
                    <div className="px-3 py-1 text-[10px] font-mono uppercase text-slate-400 tracking-wider">
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
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-slate-700 hover:bg-slate-50"
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
              {/* Search Bar (Desktop) */}
              <div className="relative hidden md:block w-48 xl:w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search commits, PRs, drift..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 font-mono shadow-sm"
                />
              </div>

              {/* Retained Memory Pulse Badge */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                <span className="font-mono text-[10px] font-semibold text-emerald-800 tracking-wide">
                  RETAINED
                </span>
              </div>

              {/* Notifications Button */}
              <button
                aria-label="Notifications"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-container-lowest border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors relative shadow-sm"
              >
                <span className="material-symbols-outlined text-[19px]">notifications</span>
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500"></span>
              </button>

              {/* User Avatar */}
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-sm text-white">
                <span className="material-symbols-outlined text-white text-[18px]">person</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Layout Body */}
        <div className="flex-1 flex overflow-hidden pt-16 pb-16 lg:pb-0">
          {/* Desktop Left Sidebar */}
          <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200 bg-surface shrink-0 py-5 px-3 justify-between">
            <div className="space-y-6">
              <div>
                <p className="px-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">
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
                          className={`relative flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            isActive
                              ? "bg-white text-slate-900 font-semibold border border-slate-200 shadow-sm"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                          }`}
                        >
                          <div className="relative z-10 flex items-center gap-2.5">
                            <span
                              className={`material-symbols-outlined text-[18px] ${
                                isActive ? "text-primary" : "text-slate-400"
                              }`}
                            >
                              {item.iconName}
                            </span>
                            <span>{item.name}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={`relative z-10 text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                isActive
                                  ? "bg-primary/10 text-primary font-semibold"
                                  : "bg-slate-100 text-slate-500"
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

              {/* Deterministic Release Gates Box */}
              <div className="border border-slate-200 bg-white rounded-lg p-3 text-xs space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-slate-700 font-mono text-[11px]">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>RELEASE GATES</span>
                  </span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 text-[10px]">
                    ACTIVE
                  </span>
                </div>
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-400">Auto-block critical:</span>
                    <span className="text-slate-900 font-medium">ENFORCED</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-400">Prisma migration:</span>
                    <span className="text-primary font-medium">VERIFIED</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-400">Drift comparison:</span>
                    <span className="text-emerald-700 font-medium">STRICT</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Footer */}
            <div className="border-t border-slate-200 pt-3 px-2 text-[11px] font-mono text-slate-500 space-y-1">
              <div className="flex items-center justify-between">
                <span>Hindsight Bank</span>
                <span className="text-emerald-700 flex items-center space-x-1 font-semibold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Isolated</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Vectorize Memory Engine Cloud
              </p>
            </div>
          </aside>

          {/* Mobile Drawer */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <div className="lg:hidden fixed inset-0 z-50 flex">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.16 }}
                  className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                  onClick={() => setMobileMenuOpen(false)}
                />
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  className="relative z-10 w-72 bg-white border-r border-slate-200 p-4 flex flex-col justify-between shadow-xl"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-[18px]">hub</span>
                        </div>
                        <span className="font-semibold text-sm text-slate-900">ReleaseTrace</span>
                      </div>
                      <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-slate-400 hover:text-slate-800 p-1"
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
                            className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                              isActive
                                ? "bg-primary/10 text-primary font-semibold"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-[18px]">
                                {item.iconName}
                              </span>
                              <span>{item.name}</span>
                            </div>
                            {item.badge && (
                              <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </nav>
                  </div>

                  <div className="pt-4 border-t border-slate-200 text-xs text-slate-400 font-mono">
                    Every release leaves a trace.
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Main Application Content Body */}
          <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
            {children}
          </main>
        </div>

        {/* Bottom Mobile Navigation Bar */}
        <nav
          className="fixed bottom-0 w-full z-50 pb-safe bg-surface/90 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-2px_10px_rgba(0,0,0,0.03)] lg:hidden"
          aria-label="Mobile Navigation"
        >
          <div className="flex justify-around items-center h-16 px-2">
            {mobileNavItems.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard" || pathname === "/"
                  : pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[44px] transition-colors ${
                    isActive
                      ? "text-primary font-semibold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.iconName}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wider">
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </ToastProvider>
  );
}
