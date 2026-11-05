"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import clsx from "clsx";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30",
        className
      )}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4 shadow-xs">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200">{title}</h4>
      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-5">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

