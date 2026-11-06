"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  LayoutDashboard,
  Users,
  UserPlus,
  AlertTriangle,
  Calendar,
  MessageSquare,
  FileText,
  ShieldCheck,
  Settings,
  ArrowRight,
  X
} from "lucide-react";
import { api, Patient } from "@/lib/api";

export function CommandPalette({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      return;
    }
    const timer = setTimeout(async () => {
      if (query.trim().length > 1) {
        setLoading(true);
        try {
          const res = await api.getPatients({ search: query.trim() });
          setPatients(res.slice(0, 5));
        } catch {
          setPatients([]);
        } finally {
          setLoading(false);
        }
      } else {
        setPatients([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, isOpen]);

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Patients Directory", href: "/patients", icon: Users },
    { label: "Discharge New Patient", href: "/discharges/new", icon: UserPlus },
    { label: "Clinical Alerts", href: "/alerts", icon: AlertTriangle },
    { label: "Appointments Calendar", href: "/appointments", icon: Calendar },
    { label: "Notifications Log", href: "/notifications", icon: MessageSquare },
    { label: "Clinical Reports & Trends", href: "/reports", icon: FileText },
    { label: "Hospital Audit Trail", href: "/audit", icon: ShieldCheck },
    { label: "System & Protocol Settings", href: "/settings", icon: Settings },
  ];

  const filteredNav = navItems.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  const navigateTo = (href: string) => {
    router.push(href);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-10"
        >
          {/* Input Header */}
          <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
            <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Search patients, actions, pages... (Ctrl+K)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 border border-slate-200 dark:border-slate-700 rounded ml-2">
              ESC
            </kbd>
          </div>

          <div className="max-h-96 overflow-y-auto p-2 space-y-4">
            {/* Live Patients Results */}
            {patients.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Patients ({patients.length})
                </div>
                <div className="space-y-1">
                  {patients.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => navigateTo(`/patients/${p.id}`)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-semibold text-xs flex items-center justify-center">
                          {p.full_name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400">
                            {p.full_name}
                          </div>
                          <div className="text-xs text-slate-400">
                            MRN: {p.mrn || "N/A"} • {p.phone}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Options */}
            <div>
              <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Navigation & Commands
              </div>
              <div className="space-y-1">
                {filteredNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      onClick={() => navigateTo(item.href)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-teal-600 dark:group-hover:text-teal-400">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">
                          {item.label}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">Jump</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

