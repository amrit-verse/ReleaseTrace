"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  X,
  Search,
  GraduationCap,
} from "lucide-react";
import { useDevOpsGuide } from "@/context/DevOpsGuideContext";

interface GlossaryTerm {
  term: string;
  category: "CI/CD & Gates" | "Database & Prisma" | "AI & Memory" | "Reliability & Ops";
  shortDefinition: string;
  analogy: string;
  whyItMatters: string;
}

const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    term: "Pre-Flight CI Gate",
    category: "CI/CD & Gates",
    shortDefinition: "An automated safety checkpoint that tests and evaluates code before allowing it to deploy to production servers.",
    analogy: "Like an airline pre-flight checklist where pilots inspect engines, flaps, and fuel before the plane takes off with passengers.",
    whyItMatters: "Halts faulty code automatically in the pipeline before live end-users experience an outage.",
  },
  {
    term: "Hindsight Memory Bank",
    category: "AI & Memory",
    shortDefinition: "A persistent, vector-indexed retrospective intelligence store (powered by Vectorize Cloud) that preserves engineering post-mortems and resolutions.",
    analogy: "Like a hospital's central clinical database that remembers every rare disease case so doctors don't repeat past misdiagnoses.",
    whyItMatters: "Ensures the team never repeats the same costly deployment failure twice.",
  },
  {
    term: "Prisma Migration & Schema Lock",
    category: "Database & Prisma",
    shortDefinition: "A database change script (e.g. adding columns, altering tables) that may acquire an exclusive access lock on PostgreSQL tables.",
    analogy: "Like closing all lanes of a busy highway during rush hour to paint a lane line. All incoming cars (user queries) get stuck waiting.",
    whyItMatters: "Exclusive locks cause queries to queue up, quickly overwhelming connection pools and taking down the app.",
  },
  {
    term: "Connection Pool Saturation",
    category: "Database & Prisma",
    shortDefinition: "When all available database client connections are occupied by long-running or locked queries, rejecting new user requests.",
    analogy: "A bank with only 10 teller windows. If 10 customers are stuck in 30-minute paperwork, the line outside the door backs up endlessly.",
    whyItMatters: "Causes 'P2024 Connection Pool Timeout' errors where users see blank pages and 504 Gateway Timeouts.",
  },
  {
    term: "Blast Radius",
    category: "Reliability & Ops",
    shortDefinition: "The scope and severity of damage if a particular deployment fails or triggers an incident.",
    analogy: "If a light bulb in the kitchen blows, that's low blast radius. If the neighborhood transformer explodes, that's high blast radius.",
    whyItMatters: "High blast radius releases (like payment processing or authentication) require stricter pre-flight verification.",
  },
  {
    term: "Idempotent Webhook Outbox",
    category: "CI/CD & Gates",
    shortDefinition: "A reliable message-handling pattern that guarantees each event is processed exactly once, even if networks drop or retry.",
    analogy: "Like an elevator button that lights up on the first press. Pressing it 5 more times won't call 5 separate elevators.",
    whyItMatters: "Prevents accidental duplicate deployments or duplicated database migrations when network connections glitch.",
  },
  {
    term: "Environment Drift & Parity",
    category: "Reliability & Ops",
    shortDefinition: "Differences between staging and production environments (e.g. Postgres version, pool size, CPU replicas, environment variables).",
    analogy: "Practicing a speech in an empty quiet room (staging) vs delivering it in a noisy stadium with 50,000 cheering fans (production).",
    whyItMatters: "Code that 'works on staging' often crashes production if connection limits or server sizes differ.",
  },
  {
    term: "Deterministic Safety Rules",
    category: "CI/CD & Gates",
    shortDefinition: "Hardcoded, mathematical boolean rules that guarantee baseline safety invariants regardless of AI models.",
    analogy: "The physical safety rails on a roller coaster. You don't ask AI if the passenger should wear a seatbelt—it's mandatory.",
    whyItMatters: "Guarantees 100% predictable enforcement for destructive operations like DROP TABLE or missing index locks.",
  },
  {
    term: "MTTR (Mean Time to Recovery)",
    category: "Reliability & Ops",
    shortDefinition: "The average number of minutes it takes an engineering team to detect, diagnose, and fix a production outage.",
    analogy: "The time from when a fire alarm rings to when the fire is completely extinguished and building re-entered.",
    whyItMatters: "ReleaseTrace slashes MTTR by providing the exact proven mitigation runbook within 3 seconds of failure detection.",
  },
  {
    term: "Human-in-the-Loop Sign-off",
    category: "Reliability & Ops",
    shortDefinition: "A governance principle where AI evaluates evidence and suggests actions, but only an authorized engineer can approve high-risk changes.",
    analogy: "The AI is the aircraft flight computer giving radar warnings; the senior captain makes the final landing decision.",
    whyItMatters: "Ensures legal, audited accountability and prevents autonomous AI from making unverified destructive choices.",
  },
];

export function DevOpsGlossaryModal() {
  const {
    isGlossaryModalOpen,
    setIsGlossaryModalOpen,
    activeGlossaryTerm,
    setActiveGlossaryTerm,
  } = useDevOpsGuide();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  useEffect(() => {
    if (activeGlossaryTerm) {
      setSearch(activeGlossaryTerm.replaceAll("-", " "));
    }
  }, [activeGlossaryTerm]);

  const handleClose = () => {
    setActiveGlossaryTerm(null);
    setIsGlossaryModalOpen(false);
  };

  if (!isGlossaryModalOpen) return null;

  const categories = ["ALL", "CI/CD & Gates", "Database & Prisma", "AI & Memory", "Reliability & Ops"];

  const filtered = GLOSSARY_TERMS.filter((item) => {
    const matchesSearch =
      item.term.toLowerCase().includes(search.toLowerCase()) ||
      item.shortDefinition.toLowerCase().includes(search.toLowerCase()) ||
      item.analogy.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative z-10 w-full max-w-4xl bg-surface border border-surface-border rounded-xl shadow-2xl overflow-hidden font-sans flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-border bg-surface-elevated">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-signal/20 text-signal border border-signal/30 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-primary">
                DevOps & Release Intelligence Glossary (Beginner Friendly)
              </h2>
              <p className="text-xs text-text-muted font-mono">
                Clear definitions and real-world analogies for every DevOps and ReleaseTrace concept.
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-surface transition-colors"
            aria-label="Close glossary modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 bg-canvas/40 border-b border-surface-border space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search concepts (e.g., Prisma, Connection Pool, Pre-flight, Blast Radius)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-elevated border border-surface-border text-xs rounded-lg pl-9 pr-3 py-2 text-text-primary placeholder-text-muted focus:outline-none focus:border-signal/60 font-mono"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
            <span className="text-[11px] text-text-muted">Filter by topic:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded text-[11px] transition-colors border ${
                  selectedCategory === cat
                    ? "bg-signal/20 text-signal border-signal/40 font-semibold"
                    : "bg-surface text-text-secondary border-surface-border hover:bg-surface-elevated"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Term Cards List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-xs font-mono text-text-muted">
              No matching terms found. Try a different keyword.
            </div>
          ) : (
            filtered.map((item, i) => (
              <div
                key={i}
                className="bg-surface-elevated rounded-lg p-4 border border-surface-border space-y-2 hover:border-surface-border/80 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-text-primary">{item.term}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface text-signal border border-surface-border">
                      {item.category}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed">
                  {item.shortDefinition}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-surface-border/60 text-xs">
                  <div className="bg-canvas/50 p-2.5 rounded border border-surface-border/40 space-y-0.5">
                    <span className="text-[10px] font-mono uppercase text-signal font-semibold block">
                      💡 Real-World Analogy:
                    </span>
                    <p className="text-text-primary text-[11px] font-sans">{item.analogy}</p>
                  </div>
                  <div className="bg-canvas/50 p-2.5 rounded border border-surface-border/40 space-y-0.5">
                    <span className="text-[10px] font-mono uppercase text-sage font-semibold block">
                      🛡️ Why It Saves Production:
                    </span>
                    <p className="text-text-primary text-[11px] font-sans">{item.whyItMatters}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-surface-border bg-surface-elevated flex items-center justify-between font-mono text-xs text-text-muted">
          <span>{filtered.length} terms cataloged</span>
          <button
            onClick={() => setIsGlossaryModalOpen(false)}
            className="px-3 py-1.5 rounded bg-surface hover:bg-surface-elevated text-text-secondary border border-surface-border transition-colors"
          >
            Close Glossary
          </button>
        </div>
      </motion.div>
    </div>
  );
}
