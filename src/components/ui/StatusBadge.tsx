import React from "react";
import { RiskClassification, DeploymentStatus, EvidenceSeverity } from "@/types";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  Sparkles,
} from "lucide-react";

interface RiskBadgeProps {
  classification: RiskClassification;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

export function RiskBadge({ classification, showIcon = true, size = "md" }: RiskBadgeProps) {
  const configs: Record<
    RiskClassification,
    { label: string; bg: string; text: string; border: string; icon: React.ElementType }
  > = {
    CRITICAL: {
      label: "CRITICAL",
      bg: "bg-red-50/80",
      text: "text-red-700",
      border: "border-red-300",
      icon: ShieldAlert,
    },
    HIGH_RISK: {
      label: "HIGH RISK",
      bg: "bg-amber-50/80",
      text: "text-amber-800",
      border: "border-amber-300",
      icon: AlertTriangle,
    },
    ELEVATED: {
      label: "ELEVATED",
      bg: "bg-amber-50/70",
      text: "text-amber-800",
      border: "border-amber-300",
      icon: AlertTriangle,
    },
    NOMINAL: {
      label: "NOMINAL",
      bg: "bg-emerald-50/80",
      text: "text-emerald-700",
      border: "border-emerald-300",
      icon: CheckCircle,
    },
    VERIFIED: {
      label: "VERIFIED SAFE",
      bg: "bg-primary/15",
      text: "text-primary",
      border: "border-primary/30",
      icon: Sparkles,
    },
  };

  const config = configs[classification] || configs.NOMINAL;
  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-2.5 py-0.5 text-[11px] gap-1.5",
    lg: "px-3.5 py-1 text-xs gap-2 font-bold",
  };

  return (
    <span
      className={`inline-flex items-center font-mono font-bold rounded-full border liquid-glass-pill shadow-xs ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]}`}
    >
      {showIcon && <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />}
      <span>{config.label}</span>
    </span>
  );
}

interface StatusBadgeProps {
  status: DeploymentStatus;
  showIcon?: boolean;
}

export function StatusBadge({ status, showIcon = true }: StatusBadgeProps) {
  const configs: Record<
    DeploymentStatus,
    { label: string; bg: string; text: string; border: string; icon: React.ElementType }
  > = {
    passed: {
      label: "PASSED",
      bg: "bg-emerald-50/80",
      text: "text-emerald-700",
      border: "border-emerald-300",
      icon: CheckCircle,
    },
    at_risk: {
      label: "AT RISK",
      bg: "bg-amber-50/80",
      text: "text-amber-800",
      border: "border-amber-300",
      icon: AlertTriangle,
    },
    blocked: {
      label: "BLOCKED",
      bg: "bg-red-50/80",
      text: "text-red-700",
      border: "border-red-300",
      icon: XCircle,
    },
    rolled_back: {
      label: "ROLLED BACK",
      bg: "bg-rose-50/80",
      text: "text-rose-700",
      border: "border-rose-300",
      icon: RotateCcw,
    },
    in_progress: {
      label: "IN PROGRESS",
      bg: "bg-primary/10",
      text: "text-primary",
      border: "border-primary/20",
      icon: Clock,
    },
    evaluating: {
      label: "EVALUATING",
      bg: "bg-primary/10",
      text: "text-primary",
      border: "border-primary/20",
      icon: Clock,
    },
  };

  const config = configs[status] || configs.passed;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase liquid-glass-pill shadow-xs ${config.bg} ${config.text} ${config.border}`}
    >
      {showIcon && <Icon className="w-3 h-3" />}
      <span>{config.label}</span>
    </span>
  );
}

interface EvidenceSeverityBadgeProps {
  severity: EvidenceSeverity;
}

export function EvidenceSeverityBadge({ severity }: EvidenceSeverityBadgeProps) {
  const configs: Record<EvidenceSeverity, { label: string; bg: string; text: string; border: string }> = {
    CRITICAL: {
      label: "CRITICAL",
      bg: "bg-red-50/80",
      text: "text-red-700",
      border: "border-red-300",
    },
    HIGH: {
      label: "HIGH",
      bg: "bg-amber-50/80",
      text: "text-amber-800",
      border: "border-amber-300",
    },
    MEDIUM: {
      label: "MEDIUM",
      bg: "bg-amber-50/70",
      text: "text-amber-800",
      border: "border-amber-200",
    },
    LOW: {
      label: "LOW",
      bg: "bg-slate-100/80",
      text: "text-slate-600",
      border: "border-slate-300",
    },
  };

  const config = configs[severity] || configs.LOW;

  return (
    <span
      className={`inline-flex items-center font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase liquid-glass-pill ${config.bg} ${config.text} ${config.border}`}
    >
      {config.label}
    </span>
  );
}

export const SeverityBadge = EvidenceSeverityBadge;
