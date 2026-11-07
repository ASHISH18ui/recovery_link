"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  AlertTriangle,
  Calendar,
  MessageSquare,
  FileText,
  ShieldCheck,
  Settings,
  Search,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Activity,
  HeartPulse
} from "lucide-react";
import { authStorage, User, api } from "@/lib/api";
import { ThemeToggle } from "./ThemeToggle";
import { CommandPalette } from "./CommandPalette";
import { RoleBadge } from "./ui/Badge";
import clsx from "clsx";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [pendingAlertsCount, setPendingAlertsCount] = useState(0);

  useEffect(() => {
    // Check auth
    const storedUser = authStorage.getUser();
    const token = authStorage.getToken();

    if (!token && !pathname.startsWith("/login") && !pathname.startsWith("/recovery") && !pathname.startsWith("/check-in")) {
      router.replace("/login");
      return;
    }

    if (storedUser) {
      setUser(storedUser);
    }

    // Fetch alerts count for bell badge
    if (token) {
      api.getAlerts("pending")
        .then((alerts) => setPendingAlertsCount(alerts.length))
        .catch(() => {});
    }
  }, [pathname, router]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = () => {
    api.logout();
  };

  const navGroups = [
    {
      group: "Clinical Care",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "Patients", href: "/patients", icon: Users },
        { label: "Discharge Patient", href: "/discharges/new", icon: UserPlus },
        {
          label: "Alerts Queue",
          href: "/alerts",
          icon: AlertTriangle,
          badge: pendingAlertsCount > 0 ? pendingAlertsCount : undefined,
          badgeVariant: "rose"
        },
        { label: "Appointments", href: "/appointments", icon: Calendar },
      ],
    },
    {
      group: "Operations & Governance",
      items: [
        { label: "Notifications Log", href: "/notifications", icon: MessageSquare },
        { label: "Clinical Reports", href: "/reports", icon: FileText },
        { label: "Audit Trail", href: "/audit", icon: ShieldCheck },
        { label: "Protocol & Settings", href: "/settings", icon: Settings },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8FB] dark:bg-[#090D16] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top hospital regulatory banner */}
      <header className="bg-amber-500/10 border-b border-amber-200/50 dark:border-amber-900/30 text-amber-900 dark:text-amber-300 text-xs py-1.5 px-4 text-center font-medium">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          Illustrative workflow; clinical instructions must be customised and approved by the hospital.
        </span>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside
          className={clsx(
            "fixed inset-y-0 left-0 z-40 lg:static flex flex-col border-r border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 transition-all duration-300 ease-in-out shadow-xs",
            isCollapsed ? "w-20" : "w-64",
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          {/* Logo Brand */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800">
            <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
              <div className="relative w-9 h-9 shrink-0 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="AfterCare Logo"
                  width={36}
                  height={36}
                  className="w-9 h-9 object-contain rounded-lg shadow-xs"
                  priority
                />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white leading-none">
                    After<span className="text-[#8B5CF6] dark:text-[#A78BFA]">Care</span>
                  </span>
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 mt-1">
                    Clinical SaaS
                  </span>
                </div>
              )}
            </Link>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
            {navGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                {!isCollapsed && (
                  <div className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {group.group}
                  </div>
                )}
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={clsx(
                        "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                        isActive
                          ? "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-semibold"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
                      )}
                    >
                      <Icon
                        className={clsx(
                          "w-5 h-5 shrink-0 transition-transform group-hover:scale-105",
                          isActive
                            ? "text-purple-600 dark:text-purple-400"
                            : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                        )}
                      />
                      {!isCollapsed && (
                        <span className="flex-1 truncate">{item.label}</span>
                      )}
                      {!isCollapsed && item.badge !== undefined && (
                        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500 text-white shrink-0 animate-pulse">
                          {item.badge}
                        </span>
                      )}
                      {isActive && (
                        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-gradient-to-b from-[#1E7BFF] to-[#8B5CF6]" />
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>

          {/* User Card at Bottom */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800">
            <div
              className={clsx(
                "p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center gap-3",
                isCollapsed ? "justify-center" : "justify-between"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1E7BFF] via-[#8B5CF6] to-[#EC4899] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  {user ? user.full_name.charAt(0) : "U"}
                </div>
                {!isCollapsed && (
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {user ? user.full_name : "Clinical Staff"}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <RoleBadge role={user?.role || "nurse"} />
                    </div>
                  </div>
                )}
              </div>

              {!isCollapsed && (
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Bar */}
          <header className="h-16 px-4 lg:px-8 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Global Search Button / Trigger */}
              <button
                onClick={() => setCmdOpen(true)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-400 text-xs sm:text-sm hover:border-slate-300 dark:hover:border-slate-600 transition-colors w-48 sm:w-64"
              >
                <Search className="w-4 h-4 text-slate-400" />
                <span className="truncate">Search patients, alerts...</span>
                <kbd className="hidden sm:inline-block ml-auto px-1.5 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-200 dark:border-slate-700 rounded">
                  Ctrl+K
                </kbd>
              </button>
            </div>

            {/* Top Right Controls */}
            <div className="flex items-center gap-2">
              <ThemeToggle />

              {/* Notifications / Alerts Bell */}
              <Link
                href="/alerts"
                className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Clinical Alerts"
              >
                <Bell className="w-5 h-5" />
                {pendingAlertsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
                )}
              </Link>

              {/* Discharge Patient Fast Button */}
              <Link
                href="/discharges/new"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-brand-gradient text-white shadow-xs hover:opacity-95 transition-opacity ml-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Discharge Patient</span>
              </Link>
            </div>
          </header>

          {/* Page View Body */}
          <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Command Palette Modal */}
      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}

