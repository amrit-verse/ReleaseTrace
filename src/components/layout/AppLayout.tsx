"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldAlert,
  GitCommit,
  BrainCircuit,
  SlidersHorizontal,
  Layers,
  Terminal,
  Activity,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";

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
    badge: "6 live",
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
    badge: "7 synced",
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
  const [cluster, setCluster] = useState("k8s-us-east-prod-01");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-brand-hindsight/20 selection:text-white">
      {/* Top Engineering System Status Bar */}
      <header className="border-b border-surface-border bg-surface/90 backdrop-blur-md sticky top-0 z-50 h-14 flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-zinc-400 hover:text-white p-1 rounded focus:outline-none focus:ring-1 focus:ring-zinc-600"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/dashboard" className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white font-mono font-bold text-sm shadow-technical-sm">
              <Terminal className="w-4 h-4 text-zinc-100" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-tight text-white flex items-center space-x-1.5">
                <span>ReleaseTrace</span>
                <span className="text-[10px] font-mono font-normal px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  v2.4
                </span>
              </span>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                Release Risk Intelligence
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center pl-4 border-l border-zinc-800 space-x-2">
            <span className="text-[11px] font-mono text-zinc-500">CLUSTER:</span>
            <select
              value={cluster}
              onChange={(e) => setCluster(e.target.value)}
              className="bg-surface-subtle text-xs font-mono text-zinc-300 border border-zinc-800 rounded px-2 py-1 focus:outline-none focus:border-zinc-600"
            >
              <option value="k8s-us-east-prod-01">k8s-us-east-prod-01 (Primary Multi-AZ)</option>
              <option value="k8s-eu-central-prod">k8s-eu-central-prod (Frankfurt Cluster)</option>
              <option value="k8s-apac-south-01">k8s-apac-south-01 (Mumbai Cluster)</option>
            </select>
          </div>
        </div>

        {/* Global Search and Engine Status */}
        <div className="flex items-center space-x-3">
          <div className="relative hidden sm:block w-48 lg:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search commits, incidents, diffs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-subtle border border-surface-border text-xs rounded pl-8 pr-3 py-1.5 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-brand-hindsight/50 focus:ring-1 focus:ring-brand-hindsight/20"
            />
          </div>

          {/* Hindsight Engine Telemetry Pill */}
          <div className="flex items-center space-x-2 bg-surface-subtle/80 border border-surface-border px-2.5 py-1 rounded text-xs font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-zinc-400 hidden xl:inline">HINDSIGHT:</span>
            <span className="text-zinc-200 font-medium">READY</span>
            <span className="text-zinc-500 text-[10px] hidden sm:inline">42ms</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:flex w-60 flex-col border-r border-surface-border bg-surface shrink-0 py-4 px-3 justify-between">
          <div className="space-y-6">
            <div>
              <p className="px-3 text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-2">
                Navigation
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
                      className={`flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-colors ${
                        isActive
                          ? "bg-zinc-800/80 text-white border-l-2 border-brand-hindsight pl-[10px]"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-surface-subtle"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <item.icon
                          className={`w-4 h-4 ${
                            isActive ? "text-brand-hindsight" : "text-zinc-500"
                          }`}
                        />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            isActive
                              ? "bg-purple-950/80 text-purple-300 border border-purple-800/40"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Quick Gating Metrics Widget */}
            <div className="border border-surface-border bg-surface-subtle rounded p-3 text-xs space-y-2">
              <div className="flex items-center justify-between text-zinc-400 font-mono text-[11px]">
                <span>RELEASE GATES</span>
                <span className="text-emerald-400 font-semibold">ENFORCED</span>
              </div>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between text-zinc-300">
                  <span className="text-zinc-500">Auto-block critical:</span>
                  <span className="text-zinc-200">YES</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span className="text-zinc-500">Max risk score:</span>
                  <span className="text-zinc-200">70 / 100</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span className="text-zinc-500">Drift tolerance:</span>
                  <span className="text-amber-400 font-medium">STRICT</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="border-t border-surface-border pt-3 px-2 text-[11px] font-mono text-zinc-500 space-y-1">
            <div className="flex items-center justify-between">
              <span>Hindsight v2.4</span>
              <span className="text-emerald-500 flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Synced</span>
              </span>
            </div>
            <p className="text-[10px] text-zinc-600">
              Powered by Vectorize Memory Engine
            </p>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex">
            <div className="w-72 bg-surface border-r border-surface-border p-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                  <span className="font-semibold text-sm text-white">ReleaseTrace Menu</span>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-zinc-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = pathname?.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded text-sm ${
                          isActive
                            ? "bg-zinc-800 text-white font-medium"
                            : "text-zinc-400 hover:bg-surface-subtle hover:text-white"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <item.icon className="w-4 h-4 text-zinc-400" />
                          <span>{item.name}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[10px] font-mono bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
              <div className="pt-4 border-t border-surface-border text-xs text-zinc-500 font-mono">
                ReleaseTrace Engineering System
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Main Application Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
