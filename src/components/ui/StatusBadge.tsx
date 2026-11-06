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
      bg: "bg-risk-critical/15",
      text: "text-risk-critical",
      border: "border-risk-critical/40",
      icon: ShieldAlert,
    },
    HIGH_RISK: {
      label: "HIGH RISK",
      bg: "bg-risk-warning/15",
      text: "text-risk-warning",
      border: "border-risk-warning/40",
      icon: AlertTriangle,
    },
    ELEVATED: {
      label: "ELEVATED",
      bg: "bg-risk-warning/10",
      text: "text-risk-elevated",
      border: "border-risk-warning/30",
      icon: AlertTriangle,
    },
    NOMINAL: {
      label: "NOMINAL",
      bg: "bg-sage/15",
      text: "text-sage",
      border: "border-sage/40",
      icon: CheckCircle,
    },
    VERIFIED: {
      label: "VERIFIED SAFE",
      bg: "bg-signal/15",
      text: "text-signal",
      border: "border-signal/40",
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
      bg: "bg-sage/15",
      text: "text-sage",
      border: "border-sage/40",
      icon: CheckCircle,
    },
    at_risk: {
      label: "AT RISK",
      bg: "bg-risk-warning/15",
      text: "text-risk-warning",
      border: "border-risk-warning/40",
      icon: AlertTriangle,
    },
    blocked: {
      label: "BLOCKED",
      bg: "bg-risk-critical/15",
      text: "text-risk-critical",
      border: "border-risk-critical/40",
      icon: XCircle,
    },
    rolled_back: {
      label: "ROLLED BACK",
      bg: "bg-surface-elevated",
      text: "text-text-secondary",
      border: "border-surface-border",
      icon: RotateCcw,
    },
    in_progress: {
      label: "IN PROGRESS",
      bg: "bg-signal/15",
      text: "text-signal",
      border: "border-signal/40",
      icon: Clock,
    },
    evaluating: {
      label: "EVALUATING",
      bg: "bg-signal/10",
      text: "text-signal",
      border: "border-signal/30",
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
      bg: "bg-risk-critical/15",
      text: "text-risk-critical",
      border: "border-risk-critical/40",
    },
    HIGH: {
      bg: "bg-risk-warning/15",
      text: "text-risk-warning",
      border: "border-risk-warning/40",
    },
    MEDIUM: {
      bg: "bg-risk-warning/10",
      text: "text-risk-elevated",
      border: "border-risk-warning/30",
    },
    LOW: {
      bg: "bg-surface-elevated",
      text: "text-text-muted",
      border: "border-surface-border",
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

