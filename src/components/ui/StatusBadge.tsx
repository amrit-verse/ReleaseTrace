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
      bg: "bg-red-950/60",
      text: "text-red-400",
      border: "border-red-700/60",
      icon: ShieldAlert,
    },
    HIGH_RISK: {
      label: "HIGH RISK",
      bg: "bg-orange-950/60",
      text: "text-orange-400",
      border: "border-orange-700/60",
      icon: AlertTriangle,
    },
    ELEVATED: {
      label: "ELEVATED",
      bg: "bg-amber-950/50",
      text: "text-amber-400",
      border: "border-amber-700/50",
      icon: AlertTriangle,
    },
    NOMINAL: {
      label: "NOMINAL",
      bg: "bg-emerald-950/50",
      text: "text-emerald-400",
      border: "border-emerald-700/50",
      icon: CheckCircle,
    },
    VERIFIED: {
      label: "VERIFIED SAFE",
      bg: "bg-cyan-950/50",
      text: "text-cyan-400",
      border: "border-cyan-700/50",
      icon: Sparkles,
    },
  };

  const config = configs[classification] || configs.NOMINAL;
  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-[10px] gap-1",
    md: "px-2 py-0.5 text-[11px] gap-1.5",
    lg: "px-3 py-1 text-xs gap-2 font-semibold",
  };

  return (
    <span
      className={`inline-flex items-center font-mono font-medium rounded border ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]}`}
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
      bg: "bg-emerald-950/50",
      text: "text-emerald-400",
      border: "border-emerald-800/50",
      icon: CheckCircle,
    },
    at_risk: {
      label: "AT RISK",
      bg: "bg-orange-950/50",
      text: "text-orange-400",
      border: "border-orange-800/50",
      icon: AlertTriangle,
    },
    blocked: {
      label: "BLOCKED",
      bg: "bg-red-950/60",
      text: "text-red-400",
      border: "border-red-800/60",
      icon: XCircle,
    },
    rolled_back: {
      label: "ROLLED BACK",
      bg: "bg-zinc-800/80",
      text: "text-zinc-300",
      border: "border-zinc-700",
      icon: RotateCcw,
    },
    in_progress: {
      label: "IN PROGRESS",
      bg: "bg-blue-950/50",
      text: "text-blue-400",
      border: "border-blue-800/50",
      icon: Clock,
    },
    evaluating: {
      label: "EVALUATING",
      bg: "bg-purple-950/50",
      text: "text-purple-300",
      border: "border-purple-800/50",
      icon: Clock,
    },
  };

  const config = configs[status] || configs.evaluating;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[11px] font-medium px-2 py-0.5 rounded border ${config.bg} ${config.text} ${config.border}`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5" />}
      <span>{config.label}</span>
    </span>
  );
}

interface SeverityBadgeProps {
  severity: EvidenceSeverity;
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const configs: Record<
    EvidenceSeverity,
    { bg: string; text: string; border: string }
  > = {
    CRITICAL: {
      bg: "bg-red-950/60",
      text: "text-red-400",
      border: "border-red-700/60",
    },
    HIGH: {
      bg: "bg-orange-950/60",
      text: "text-orange-400",
      border: "border-orange-700/60",
    },
    MEDIUM: {
      bg: "bg-amber-950/50",
      text: "text-amber-400",
      border: "border-amber-700/50",
    },
    LOW: {
      bg: "bg-zinc-800/60",
      text: "text-zinc-300",
      border: "border-zinc-700",
    },
  };

  const config = configs[severity] || configs.LOW;

  return (
    <span
      className={`inline-flex items-center font-mono text-[10px] font-medium px-1.5 py-0.5 rounded border ${config.bg} ${config.text} ${config.border}`}
    >
      {severity}
    </span>
  );
}
