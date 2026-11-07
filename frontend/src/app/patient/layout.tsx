"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Home,
  CheckCircle2,
  Pill,
  Calendar,
  TrendingUp,
  MessageSquare,
  AlertTriangle,
  FileText,
  Bell,
  User,
  LogOut,
  Languages,
  Menu,
  X,
  PhoneCall,
  ShieldAlert
} from "lucide-react";
import { PatientProvider, usePatient } from "./PatientContext";
import { patientAuthStorage, patientApi } from "@/lib/patient-api";
import { t } from "@/lib/i18n";
import { ThemeToggle } from "@/components/ThemeToggle";

function PatientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, lang, setLang } = usePatient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // If we're on the login page, render children directly without patient shell
  const isLoginPage = pathname === "/patient/login";

  useEffect(() => {
    if (isLoginPage) {
      setAuthChecked(true);
      return;
    }
    const token = patientAuthStorage.getToken();
    if (!token) {
      router.replace("/patient/login");
    } else {
      setAuthChecked(true);
    }
  }, [pathname, isLoginPage, router]);

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F8FB] dark:bg-[#090D16]">
        <div className="w-8 h-8 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  const navItems = [
    { href: "/patient/dashboard", label: t("home", lang), icon: Home },
    { href: "/patient/checkin", label: t("checkin", lang), icon: CheckCircle2, badge: "Daily" },
    { href: "/patient/recovery-plan", label: t("recoveryPlan", lang), icon: Calendar },
    { href: "/patient/medications", label: t("medicines", lang), icon: Pill },
    { href: "/patient/appointments", label: t("appointments", lang), icon: Calendar },
    { href: "/patient/progress", label: t("progress", lang), icon: TrendingUp },
    { href: "/patient/messages", label: t("messages", lang), icon: MessageSquare },
    { href: "/patient/documents", label: t("documents", lang), icon: FileText },
    { href: "/patient/notifications", label: t("notifications", lang), icon: Bell },
    { href: "/patient/profile", label: t("profile", lang), icon: User },
  ];

  const mobileBottomItems = [
    { href: "/patient/dashboard", label: t("home", lang), icon: Home },
    { href: "/patient/checkin", label: t("checkin", lang), icon: CheckCircle2 },
    { href: "/patient/medications", label: t("medicines", lang), icon: Pill },
    { href: "/patient/progress", label: t("progress", lang), icon: TrendingUp },
    { href: "/patient/messages", label: t("messages", lang), icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8FB] dark:bg-[#090D16] text-slate-900 dark:text-slate-100">
      {/* Top Banner / Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/patient/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-gradient p-1 flex items-center justify-center shadow-md">
                <Image
                  src="/logo.png"
                  alt="AfterCare Logo"
                  width={36}
                  height={36}
                  className="w-full h-full object-contain rounded-lg"
                  priority
                />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                  AfterCare
                </span>
                <span className="hidden sm:inline-block ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Patient Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Action cluster: Emergency button + Lang toggle + Theme + User */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Red Emergency Button */}
            <Link
              href="/patient/emergency"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/25 transition-all transform active:scale-95 animate-pulse"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{t("emergency", lang)}</span>
            </Link>

            {/* Language Toggle (EN / हिन्दी) */}
            <button
              onClick={() => setLang(lang === "en" ? "hi" : "en")}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Toggle language / भाषा बदलें"
            >
              <Languages className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>{lang === "en" ? "हिन्दी" : "EN"}</span>
            </button>

            <ThemeToggle />

            {/* Logout button */}
            <button
              onClick={() => patientApi.logout()}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t("logout", lang)}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-6">
          {/* Patient Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center text-sm border border-purple-200 dark:border-purple-800">
                {session?.patient_name ? session.patient_name.charAt(0) : "P"}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {session?.patient_name || "Patient"}
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Active Care Plan
                </div>
              </div>
            </div>
          </div>

          {/* Nav List */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Quick Help Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-900 dark:to-slate-800/80 border border-purple-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <PhoneCall className="w-4 h-4 text-purple-600" />
              <span>Need Immediate Assistance?</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Hospital helpline is available 24/7 for urgent post-discharge guidance.
            </p>
            <Link
              href="/patient/emergency"
              className="inline-block text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
            >
              Open Helpline &rarr;
            </Link>
          </div>
        </aside>

        {/* Mobile Slide-over Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between shadow-2xl z-10">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Image src="/logo.png" alt="Logo" width={28} height={28} />
                    <span className="font-extrabold text-base">AfterCare</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {session?.patient_name || "Patient"}
                  </div>
                  <div className="text-[11px] text-purple-700 dark:text-purple-300">
                    Post-Discharge Recovery
                  </div>
                </div>

                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const active = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold ${
                          active
                            ? "bg-purple-600 text-white"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{item.label}</span>
                        </div>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <button
                onClick={() => patientApi.logout()}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <LogOut className="w-4 h-4" />
                <span>{t("logout", lang)}</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Body */}
        <main className="flex-1 min-w-0 pb-20 lg:pb-8">{children}</main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 shadow-lg">
        <div className="grid grid-cols-5 gap-1">
          {mobileBottomItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-colors ${
                  active
                    ? "text-purple-600 dark:text-purple-400 font-bold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "scale-110" : ""}`} />
                <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[60px]">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer Disclaimer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-4 px-4 text-center text-[11px] text-slate-500 dark:text-slate-400">
        <p className="max-w-3xl mx-auto">{t("footer", lang)}</p>
      </footer>
    </div>
  );
}

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <PatientProvider>
      <PatientShell>{children}</PatientShell>
    </PatientProvider>
  );
}
