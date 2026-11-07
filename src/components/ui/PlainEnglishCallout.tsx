"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  GraduationCap,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Workflow,
  BookOpen,
  Zap,
} from "lucide-react";
import { useDevOpsGuide } from "@/context/DevOpsGuideContext";

interface PlainEnglishCalloutProps {
  title: string;
  analogy: string;
  explanation: string;
  whyItMatters: string;
  keyTerms?: string[];
  suggestedAction?: {
    label: string;
    onClick: () => void;
  };
}

export function PlainEnglishCallout({
  title,
  analogy,
  explanation,
  whyItMatters,
  keyTerms,
  suggestedAction,
}: PlainEnglishCalloutProps) {
  const { isGuideMode, setIsFlowModalOpen, setIsGlossaryModalOpen, setIsSimulatorModalOpen } = useDevOpsGuide();
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  if (!isGuideMode) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="bg-gradient-to-r from-surface-elevated/90 to-surface/90 border border-signal/40 rounded-lg p-4 font-sans text-xs text-text-secondary shadow-panel relative overflow-hidden"
    >
      {/* Decorative subtle glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-signal/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-signal/20 text-signal border border-signal/30 flex items-center justify-center shrink-0">
            <GraduationCap className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-text-primary text-xs tracking-tight">
                DevOps Guide: {title}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-signal/15 text-signal border border-signal/30">
                Beginner Friendly
              </span>
            </div>
            <p className="text-[11px] text-text-muted mt-0.5 font-sans">
              <strong className="text-signal/90 font-medium">Analogy:</strong> {analogy}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-surface-elevated transition-colors"
            title={isExpanded ? "Collapse guide" : "Expand guide"}
            aria-label="Toggle guide details"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-3 pt-3 mt-3 border-t border-surface-border/60"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-wider text-text-muted block font-semibold">
                  What is happening here?
                </span>
                <p className="text-text-primary">{explanation}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-wider text-sage block font-semibold">
                  Why this saves production
                </span>
                <p className="text-text-primary">{whyItMatters}</p>
              </div>
            </div>

            {keyTerms && keyTerms.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-mono text-text-muted">Key Concepts:</span>
                {keyTerms.map((term, i) => (
                  <button
                    key={i}
                    onClick={() => setIsGlossaryModalOpen(true)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-surface-border hover:border-signal/50 text-text-secondary hover:text-signal transition-colors inline-flex items-center gap-1"
                  >
                    <span>{term}</span>
                    <BookOpen className="w-2.5 h-2.5 opacity-60" />
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-surface-border/40 font-mono text-[11px]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFlowModalOpen(true)}
                  className="text-signal hover:underline inline-flex items-center gap-1 font-medium"
                >
                  <Workflow className="w-3.5 h-3.5" />
                  <span>How ReleaseTrace Works (Interactive Diagram)</span>
                </button>
                <span className="text-text-muted">•</span>
                <button
                  onClick={() => setIsSimulatorModalOpen(true)}
                  className="text-sage hover:underline inline-flex items-center gap-1 font-medium"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Test Release in Sandbox</span>
                </button>
              </div>

              {suggestedAction && (
                <button
                  onClick={suggestedAction.onClick}
                  className="px-2.5 py-1 rounded bg-signal/20 hover:bg-signal/30 text-signal border border-signal/40 font-mono font-medium text-[11px] transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{suggestedAction.label}</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
