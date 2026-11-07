"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Calendar,
  Pill,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  ShieldAlert,
  Activity,
  Heart
} from "lucide-react";
import { patientApi, PatientMe } from "@/lib/patient-api";
import { usePatient } from "../PatientContext";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";

export default function PatientDashboardPage() {
  const { lang } = usePatient();
  const [data, setData] = useState<PatientMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    patientApi
      .getMe()
      .then((res) => setData(res))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("goodMorning", lang);
    if (hour < 18) return t("goodAfternoon", lang);
    return t("goodEvening", lang);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 text-sm">
        Failed to load patient recovery profile: {error || "Unknown error"}
      </div>
    );
  }

  const patientFirstName = data.patient.full_name.split(" ")[0];
  const progressPercent = data.recovery.progress_percent;
  const isCheckinDone = data.today_tasks.checkin_done;
  const isOnTrack = !error && (!data.today_tasks.has_appointment_today || isCheckinDone);

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-pink-200" />
              <span>{t("recoveryProgress", lang)}: {t("onTrack", lang)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {getGreeting()}, {patientFirstName}!
            </h1>
            <p className="text-sm text-purple-100 opacity-90">
              You are on <span className="font-bold text-white">Day {data.recovery.days_in_recovery + 1}</span> of your {data.recovery.plan_duration_days}-day monitored recovery pathway.
            </p>
          </div>

          {/* Prominent Emergency / Help Button */}
          <Link href="/patient/emergency">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-rose-600 hover:bg-rose-50 font-bold text-sm shadow-md transition-all active:scale-95">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>{t("getHelp", lang)}</span>
            </button>
          </Link>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* Grid: Progress Ring + Today Tasks + Next Appointment */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Recovery Progress Ring */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t("dayOfRecovery", lang)}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                {isOnTrack ? t("onTrack", lang) : t("needsAttention", lang)}
              </span>
            </div>

            <div className="flex items-center justify-center my-4">
              {/* Circular SVG Progress */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-slate-100 dark:text-slate-800"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="url(#progressGradient)"
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - progressPercent / 100)}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#2563EB" />
                      <stop offset="50%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    {progressPercent}%
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Day {data.recovery.days_in_recovery + 1} of {data.recovery.plan_duration_days}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/patient/recovery-plan"
            className="mt-2 text-center text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center justify-center gap-1"
          >
            <span>View Full Recovery Timeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 2: Today's Tasks */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t("todayTasks", lang)}
              </span>
              <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
                {isCheckinDone ? "1 of 2 done" : "Action needed"}
              </span>
            </div>

            <div className="space-y-3">
              {/* Task 1: Checkin */}
              <Link
                href="/patient/checkin"
                className={`block p-3 rounded-2xl border transition-all ${
                  isCheckinDone
                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60"
                    : "bg-purple-50/60 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 hover:shadow-xs"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2
                      className={`w-4 h-4 ${
                        isCheckinDone ? "text-emerald-600" : "text-purple-600"
                      }`}
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {t("dailyCheckin", lang)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {isCheckinDone ? "Submitted for today" : "Takes ~60 seconds"}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isCheckinDone
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                        : "bg-purple-600 text-white"
                    }`}
                  >
                    {isCheckinDone ? "Completed" : "Start"}
                  </span>
                </div>
              </Link>

              {/* Task 2: Medications */}
              <Link
                href="/patient/medications"
                className="block p-3 rounded-2xl border bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:shadow-xs transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Pill className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {t("medicinesDue", lang)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {data.today_tasks.medicines_logged} of {data.today_tasks.medicines_total} logged
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    Review
                  </span>
                </div>
              </Link>
            </div>
          </div>

          <p className="mt-4 text-[11px] text-slate-400 text-center">
            Complete daily tasks before midnight
          </p>
        </div>

        {/* Card 3: Next Appointment */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t("nextAppointment", lang)}
              </span>
              <Calendar className="w-4 h-4 text-purple-600" />
            </div>

            {data.next_appointment ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {data.next_appointment.appointment_type}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-blue-700 dark:text-blue-300 font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {new Date(data.next_appointment.scheduled_at).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {data.next_appointment.notes && (
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {data.next_appointment.notes}
                    </p>
                  )}
                </div>

                <Link
                  href="/patient/appointments"
                  className="block text-center text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Need to reschedule? &rarr;
                </Link>
              </div>
            ) : (
              <div className="text-center py-6 space-y-2">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">No appointments scheduled</p>
                <Link
                  href="/patient/appointments"
                  className="inline-block text-xs font-bold text-purple-600 hover:underline"
                >
                  View past clinic reviews
                </Link>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Location: St. Jude Hospital</span>
            <span>Room 304</span>
          </div>
        </div>
      </div>

      {/* Quick Nav Shortcut Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link
          href="/patient/progress"
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800 transition-all hover:shadow-xs group"
        >
          <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-900 dark:text-white">
            {t("progress", lang)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Pain & vitals trends</p>
        </Link>

        <Link
          href="/patient/messages"
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800 transition-all hover:shadow-xs group"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Activity className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-900 dark:text-white">
            {t("messages", lang)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Ask care team</p>
        </Link>

        <Link
          href="/patient/documents"
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800 transition-all hover:shadow-xs group"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-900 dark:text-white">
            {t("documents", lang)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Discharge instructions</p>
        </Link>

        <Link
          href="/patient/emergency"
          className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100/50 transition-all hover:shadow-xs group"
        >
          <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-rose-700 dark:text-rose-300">
            {t("emergency", lang)}
          </div>
          <p className="text-[11px] text-rose-600/80 mt-0.5">Helpline & Urgent Call</p>
        </Link>
      </div>
    </div>
  );
}
