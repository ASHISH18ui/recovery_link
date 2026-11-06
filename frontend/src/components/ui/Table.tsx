"use client";

import React from "react";
import clsx from "clsx";

export function Table({ className, children, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
      <table className={clsx("w-full text-left text-sm text-slate-600 dark:text-slate-300", className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={clsx(
        "bg-slate-50/80 dark:bg-slate-800/60 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800",
        className
      )}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TableBody({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={clsx("divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900", className)} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={clsx(
        "transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/50 data-[state=selected]:bg-slate-100 dark:data-[state=selected]:bg-slate-800",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({ className, children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={clsx("px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400", className)} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ className, children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={clsx("px-5 py-4 align-middle text-slate-700 dark:text-slate-200", className)} {...props}>
      {children}
    </td>
  );
}

