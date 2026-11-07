"use client";

import React, { useState } from "react";
import {
  Sparkles,
  ShieldAlert,
  Database,
  KeyRound,
  RotateCcw,
  Zap,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Lightbulb,
  Layers,
  Copy,
  Check,
} from "lucide-react";
import { useDevOpsGuide } from "@/context/DevOpsGuideContext";

interface ProjectImprovementTip {
  id: string;
  category: "Database" | "Environment" | "Architecture" | "Rollback";
  title: string;
  problem: string;
  solution: string;
  codeSnippet?: string;
  impact: string;
}

const IMPROVEMENT_TIPS: ProjectImprovementTip[] = [
  {
    id: "lock-timeout",
    category: "Database",
    title: "Add bounded lock timeouts to Postgres migrations",
    problem:
      "When adding a column or modifying a table, Postgres can wait indefinitely for active queries to finish. If queries keep coming, your whole website freezes (database lock deadlock).",
    solution:
      "Add a 3-second lock timeout in your migration. If Postgres can't get the lock in 3 seconds, it safely aborts instead of taking down your live site.",
    codeSnippet: `// In your Prisma migration SQL or script:
SET lock_timeout = '3s';
ALTER TABLE "users" ADD COLUMN "role" TEXT DEFAULT 'user';`,
    impact: "Prevents 90% of database-induced site downtime during deployments.",
  },
  {
    id: "connection-pooling",
    category: "Database",
    title: "Use connection pooling on Neon & Serverless",
    problem:
      "Every serverless function (Vercel API route) opens a new database connection. Under sudden traffic, your database hits max connections (Postgres error P2024: connection pool timeout).",
    solution:
      "Use Neon's connection pooler URL (PgBouncer) in your production DATABASE_URL. It shares connections among hundreds of serverless requests.",
    codeSnippet: `// In .env.production on Vercel:
DATABASE_URL="postgresql://user:pass@ep-xyz-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"`,
    impact: "Allows your site to handle 10x traffic spikes without running out of database connections.",
  },
  {
    id: "preview-deployments",
    category: "Architecture",
    title: "Test preview deployments before merging to main",
    problem:
      "Deploying directly to main means any broken button or missing environment variable hits 100% of your real users instantly.",
    solution:
      "Open a Pull Request on GitHub. Vercel automatically generates a temporary Preview URL where you can click around and verify everything works before touching production.",
    codeSnippet: `# Workflow recommendation:
git checkout -b feat/my-new-feature
git commit -m "add new feature"
git push origin feat/my-new-feature
# -> Open PR on GitHub -> Test the Vercel Preview URL!`,
    impact: "Catches layout bugs and broken APIs in a private testing sandbox.",
  },
  {
    id: "instant-rollback",
    category: "Rollback",
    title: "Always know your 10-second rollback strategy",
    problem:
      "If a release crashes at 9 PM, panicking to write a code fix takes 30-60 minutes while users see 500 errors.",
    solution:
      "Use Vercel Instant Rollback: Go to Deployments -> find the previous working version -> click 'Promote to Production'. It takes 5 seconds and requires zero code rebuilds.",
    codeSnippet: `// Vercel CLI instant rollback shortcut:
vercel rollback`,
    impact: "Reduces critical downtime from 45 minutes to under 15 seconds.",
  },
];

interface QuickScenario {
  id: string;
  name: string;
  description: string;
  verdict: "SAFE" | "NEEDS_ATTENTION" | "HIGH_RISK";
  score: number;
  plainEnglishExplanation: string;
  whatYouShouldDo: string;
  recommendedCheck: string;
}

const FIRST_TIME_SCENARIOS: QuickScenario[] = [
  {
    id: "frontend-only",
    name: "I changed colors, text, or a button (Frontend only)",
    description: "No database changes, no new environment variables.",
    verdict: "SAFE",
    score: 12,
    plainEnglishExplanation:
      "Great news! Modifying pure UI components cannot lock databases or break backend APIs. This is a very safe release.",
    whatYouShouldDo: "Verify your design in dark and light mode, run automated tests, and ship with confidence.",
    recommendedCheck: "npm test && npm run build",
  },
  {
    id: "new-env-var",
    name: "I added a new API key or Environment Variable",
    description: "Code uses a new process.env.MY_SECRET_KEY.",
    verdict: "NEEDS_ATTENTION",
    score: 45,
    plainEnglishExplanation:
      "Common beginner trap: Your code works on localhost because you set .env.local, but when deployed to Vercel, the site crashes with 'undefined key'.",
    whatYouShouldDo:
      "Go to your Vercel Project Settings -> Environment Variables -> add MY_SECRET_KEY to Production & Preview before deploying.",
    recommendedCheck: "Verify Vercel Project Settings -> Environment Variables",
  },
  {
    id: "database-schema-change",
    name: "I changed my database schema (added columns or tables)",
    description: "Modified prisma/schema.prisma or generated a new migration.",
    verdict: "HIGH_RISK",
    score: 82,
    plainEnglishExplanation:
      "Database changes are permanent. If you add a column without a default value or alter a busy table, live user queries can get locked, causing 504 timeouts.",
    whatYouShouldDo:
      "Ensure new columns have default values or are optional. Add `SET lock_timeout = '3s';` to the migration script so queries don't hang.",
    recommendedCheck: "npx prisma migrate status && verify migration lock timeout",
  },
];

export function FirstTimeDeployerGuide() {
  const { isGuideMode, setIsFlowModalOpen, setIsSimulatorModalOpen, setIsGlossaryModalOpen } = useDevOpsGuide();
  const [selectedScenario, setSelectedScenario] = useState<QuickScenario>(FIRST_TIME_SCENARIOS[0]);
  const [copiedTipId, setCopiedTipId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"checklist" | "simulator" | "tips">("checklist");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleCopy = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedTipId(id);
    setTimeout(() => setCopiedTipId(null), 2000);
  };

  if (!isGuideMode) return null;

  return (
    <section className="rounded-xl border border-surface-border bg-surface p-5 shadow-sm space-y-5 transition-all">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-signal/10 border border-signal/20 text-signal flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-text-primary">
                First-Time Deployer Assistant & Project Optimizer
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-signal/10 text-signal border border-signal/20 font-semibold">
                Beginner Friendly
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Deploying your project for the first time? Follow these plain-English checks to ship safely without downtime.
            </p>
          </div>
        </div>

        {/* Tab switcher + Collapse toggle */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <div className="inline-flex rounded-lg border border-surface-border bg-surface-subtle p-0.5 text-xs font-medium">
            <button
              onClick={() => setActiveTab("checklist")}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeTab === "checklist"
                  ? "bg-surface text-text-primary shadow-xs font-semibold"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              3-Step Checklist
            </button>
            <button
              onClick={() => setActiveTab("simulator")}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeTab === "simulator"
                  ? "bg-surface text-text-primary shadow-xs font-semibold"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              Pre-Flight Check
            </button>
            <button
              onClick={() => setActiveTab("tips")}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeTab === "tips"
                  ? "bg-surface text-text-primary shadow-xs font-semibold"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              Improve My Project
            </button>
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg border border-surface-border bg-surface text-text-muted hover:text-text-primary transition-colors"
            title={isCollapsed ? "Expand assistant" : "Minimize assistant"}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="space-y-4">
          {/* TAB 1: 3-Step First-Time Checklist */}
          {activeTab === "checklist" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Step 1 */}
              <div className="rounded-lg border border-surface-border bg-surface-subtle/50 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-signal font-bold">
                    Step 1 · Secrets
                  </span>
                  <KeyRound className="w-4 h-4 text-signal" />
                </div>
                <h3 className="text-xs font-bold text-text-primary">Environment Variables</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Never commit passwords, database URLs, or secret API keys to GitHub.
                </p>
                <div className="text-[11px] text-text-muted bg-surface rounded p-2.5 border border-surface-border space-y-1 font-mono">
                  <p className="text-signal font-sans font-semibold">How to do it:</p>
                  <p>1. Keep secrets in <code className="text-text-primary">.env.local</code></p>
                  <p>2. Add them to Vercel Settings → Environment Variables</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="rounded-lg border border-surface-border bg-surface-subtle/50 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-sage font-bold">
                    Step 2 · Database
                  </span>
                  <Database className="w-4 h-4 text-sage" />
                </div>
                <h3 className="text-xs font-bold text-text-primary">Schema & Migrations</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  If you changed your database, verify migrations don&apos;t freeze live traffic.
                </p>
                <div className="text-[11px] text-text-muted bg-surface rounded p-2.5 border border-surface-border space-y-1 font-mono">
                  <p className="text-sage font-sans font-semibold">Safety Rule:</p>
                  <p>• Avoid adding <code className="text-text-primary">NOT NULL</code> without a default</p>
                  <p>• Enable Neon pooler connection limit = 10</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="rounded-lg border border-surface-border bg-surface-subtle/50 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-500 font-bold">
                    Step 3 · Safety Net
                  </span>
                  <RotateCcw className="w-4 h-4 text-amber-500" />
                </div>
                <h3 className="text-xs font-bold text-text-primary">Instant Rollback Ready</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  If anything goes wrong after shipping, know how to roll back in 5 seconds.
                </p>
                <div className="text-[11px] text-text-muted bg-surface rounded p-2.5 border border-surface-border space-y-1 font-mono">
                  <p className="text-amber-500 font-sans font-semibold">Emergency Rollback:</p>
                  <p>• Vercel Dashboard → Deployments</p>
                  <p>• Pick previous version → Promote to Prod</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Pre-Flight Scenario Checker */}
          {activeTab === "simulator" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-primary block">
                  Select what you are about to ship:
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {FIRST_TIME_SCENARIOS.map((sc) => (
                    <button
                      key={sc.id}
                      onClick={() => setSelectedScenario(sc)}
                      className={`text-left p-3 rounded-lg border transition-all text-xs ${
                        selectedScenario.id === sc.id
                          ? "border-signal bg-signal/5 text-text-primary shadow-xs"
                          : "border-surface-border bg-surface-subtle/40 text-text-secondary hover:border-surface-border hover:bg-surface-subtle"
                      }`}
                    >
                      <p className="font-semibold text-text-primary">{sc.name}</p>
                      <p className="text-[11px] text-text-muted mt-1">{sc.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Verdict Box */}
              <div className="rounded-lg border border-surface-border bg-surface-subtle/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {selectedScenario.verdict === "SAFE" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-500">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Safe Release · Score {selectedScenario.score}/100
                      </span>
                    ) : selectedScenario.verdict === "NEEDS_ATTENTION" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-500">
                        <Lightbulb className="w-3.5 h-3.5" />
                        Review Required · Score {selectedScenario.score}/100
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-500">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        High Risk · Score {selectedScenario.score}/100
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-text-muted">
                      ReleaseTrace Pre-Flight Analysis
                    </span>
                  </div>

                  <button
                    onClick={() => setIsSimulatorModalOpen(true)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-signal hover:underline"
                  >
                    Open Full Simulator <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-xs leading-relaxed text-text-primary">
                  <p className="font-semibold text-text-primary mb-1">Plain English Explanation:</p>
                  <p className="text-text-secondary">{selectedScenario.plainEnglishExplanation}</p>
                </div>

                <div className="rounded bg-surface p-3 border border-surface-border text-xs space-y-1">
                  <span className="font-semibold text-text-primary block">What You Should Do Next:</span>
                  <p className="text-text-secondary">{selectedScenario.whatYouShouldDo}</p>
                  <div className="mt-2 pt-2 border-t border-surface-border/60 flex items-center justify-between text-[11px] font-mono text-text-muted">
                    <span>Terminal check: <code className="text-signal">{selectedScenario.recommendedCheck}</code></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Improve My Project SRE Tips */}
          {activeTab === "tips" && (
            <div className="space-y-3">
              <p className="text-xs text-text-muted">
                These are professional Site Reliability Engineering (SRE) patterns simplified for any developer. Applying even one will make your project significantly more resilient:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {IMPROVEMENT_TIPS.map((tip) => (
                  <div key={tip.id} className="rounded-lg border border-surface-border bg-surface-subtle/40 p-4 space-y-2.5 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-signal font-bold">
                          {tip.category}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {tip.impact}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-text-primary">{tip.title}</h4>
                      <p className="text-[11px] text-text-secondary leading-relaxed">
                        <strong className="text-text-primary font-medium">Why it matters:</strong> {tip.problem}
                      </p>
                      <p className="text-[11px] text-text-muted leading-relaxed">
                        <strong className="text-signal font-medium">Fix:</strong> {tip.solution}
                      </p>
                    </div>

                    {tip.codeSnippet && (
                      <div className="relative mt-2">
                        <pre className="text-[10px] font-mono bg-canvas text-text-primary p-2.5 rounded border border-surface-border overflow-x-auto leading-relaxed">
                          {tip.codeSnippet}
                        </pre>
                        <button
                          onClick={() => handleCopy(tip.id, tip.codeSnippet!)}
                          className="absolute right-2 top-2 p-1 rounded bg-surface hover:bg-surface-subtle border border-surface-border text-text-muted hover:text-text-primary transition-colors"
                          title="Copy code snippet"
                        >
                          {copiedTipId === tip.id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick links footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-surface-border text-xs text-text-muted">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsFlowModalOpen(true)}
                className="inline-flex items-center gap-1.5 hover:text-signal transition-colors font-medium"
              >
                <Layers className="w-3.5 h-3.5 text-signal" />
                <span>How ReleaseTrace Works</span>
              </button>
              <span>·</span>
              <button
                onClick={() => setIsSimulatorModalOpen(true)}
                className="inline-flex items-center gap-1.5 hover:text-signal transition-colors font-medium"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Sandbox Simulator</span>
              </button>
              <span>·</span>
              <button
                onClick={() => setIsGlossaryModalOpen(true)}
                className="inline-flex items-center gap-1.5 hover:text-signal transition-colors font-medium"
              >
                <HelpCircle className="w-3.5 h-3.5 text-sage" />
                <span>DevOps Terms Glossary</span>
              </button>
            </div>

            <span className="text-[10px] font-mono text-text-muted">
              Press <kbd className="px-1.5 py-0.5 rounded bg-surface-subtle border border-surface-border font-bold">?</kbd> anywhere for the Glossary
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
