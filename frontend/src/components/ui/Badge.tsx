"use client";

import React from "react";
import clsx from "clsx";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "neutral";
  size?: "sm" | "md";
  dot?: boolean;
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700",
    success: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    warning: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    danger: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    info: "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800",
    neutral: "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700",
  };

  const dotColors = {
    default: "bg-slate-500",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
    info: "bg-sky-500",
    neutral: "bg-slate-400",
  };

  const sizeStyles = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center font-medium rounded-full border shadow-2xs select-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0 animate-pulse", dotColors[variant])} />}
      {children}
    </span>
  );
}

export function RiskBadge({ risk, size = "md" }: { risk: "low" | "medium" | "high" | string; size?: "sm" | "md" }) {
  const normRisk = (risk || "low").toLowerCase();
  if (normRisk === "high") {
    return (
      <Badge variant="danger" size={size} dot>
        High Risk
      </Badge>
    );
  }
  if (normRisk === "medium") {
    return (
      <Badge variant="warning" size={size} dot>
        Medium Risk
      </Badge>
    );
  }
  return (
    <Badge variant="success" size={size} dot>
      Low Risk
    </Badge>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const r = (role || "").toLowerCase();
  if (r === "admin") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 uppercase tracking-wider">
        Admin
      </span>
    );
  }
  if (r === "doctor") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 uppercase tracking-wider">
        Doctor
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 uppercase tracking-wider">
      Nurse
    </span>
  );
}

