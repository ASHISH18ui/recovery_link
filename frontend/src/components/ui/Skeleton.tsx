"use client";

import React from "react";
import clsx from "clsx";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "animate-pulse rounded-lg bg-slate-200/80 dark:bg-slate-800",
        className
      )}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-card space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-7 w-20" />
      <Skeleton className="h-3.5 w-36" />
    </div>
  );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-slate-100 dark:border-slate-800">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

