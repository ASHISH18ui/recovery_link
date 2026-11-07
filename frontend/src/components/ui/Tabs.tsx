"use client";

import React from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

export interface TabItem {
  id: string;
  label: string;
  badge?: number | string;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: "underline" | "pill";
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  className,
  variant = "underline",
}: TabsProps) {
  if (variant === "pill") {
    return (
      <div
        className={clsx(
          "inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-medium",
          className
        )}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={clsx(
                "relative px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2",
                isActive
                  ? "text-slate-900 dark:text-white font-semibold"
                  : "hover:text-slate-900 dark:hover:text-white"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activePillTab"
                  className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {tab.icon && <span>{tab.icon}</span>}
                {tab.label}
                {tab.badge !== undefined && (
                  <span
                    className={clsx(
                      "px-1.5 py-0.5 rounded-full text-xs font-bold",
                      isActive
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={clsx("border-b border-slate-200 dark:border-slate-800 flex gap-6 overflow-x-auto", className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={clsx(
              "relative pb-3 text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap focus:outline-none",
              isActive
                ? "text-purple-600 dark:text-purple-400 font-semibold"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={clsx(
                  "px-2 py-0.5 rounded-full text-xs font-semibold",
                  isActive
                    ? "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                )}
              >
                {tab.badge}
              </span>
            )}
            {isActive && (
              <motion.div
                layoutId="activeUnderlineTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#1E7BFF] via-[#8B5CF6] to-[#EC4899] rounded-full"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

