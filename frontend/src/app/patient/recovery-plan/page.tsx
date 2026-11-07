"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Utensils,
  Footprints,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Target,
  RefreshCw,
  Clock,
  FileQuestion
} from "lucide-react";
import { patientApi, RecoveryPlanDay } from "@/lib/patient-api";
import { usePatient } from "../PatientContext";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

// Helper to safely ensure arrays even if backend sends JSON string or undefined
function safeArray(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.map(String);
      return [String(parsed)];
    } catch {
      return [val];
    }
  }
  return [];
}

export default function PatientRecoveryPlanPage() {
  const { lang } = usePatient();
  const [days, setDays] = useState<RecoveryPlanDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const fetchPlan = useCallback(() => {
    setLoading(true);
    setError(null);
    patientApi
      .getRecoveryPlan()
      .then((res) => {
        const rawDays: RecoveryPlanDay[] = Array.isArray(res?.days) ? res.days : [];
        setDays(rawDays);
        if (rawDays.length > 0) {
          const active = rawDays.find((d) => !d?.is_completed);
          setExpandedDay(active?.day_number ?? rawDays[0]?.day_number ?? null);
        } else {
          setExpandedDay(null);
        }
      })
      .catch((err: any) => {
        setError(err?.message || "Unable to load recovery plan. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  // 1. Loading Skeleton State
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-2xl" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-5 w-40 rounded-lg" />
                    <Skeleton className="h-3 w-64 rounded-md" />
                  </div>
                </div>
                <Skeleton className="w-6 h-6 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. Error State with Retry Button
  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Could Not Load Recovery Plan
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          {error}
        </p>
        <div className="pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={fetchPlan}
            iconLeft={<RefreshCw className="w-4 h-4" />}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // 3. Friendly Empty State
  if (!days || days.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300 flex items-center justify-center mx-auto shadow-xs">
          <Clock className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            Your care team is preparing your recovery plan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Your attending surgeon and nurse are finalizing your personalized day-by-day protocol. Instructions, milestones, and diet guidance will appear here soon.
          </p>
        </div>
        <div className="pt-3">
          <Button
            variant="secondary"
            size="md"
            onClick={fetchPlan}
            iconLeft={<RefreshCw className="w-4 h-4" />}
          >
            Check Again
          </Button>
        </div>
      </div>
    );
  }

  // 4. Active Recovery Plan Timeline
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t("recoveryPlan", lang)}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Your physician-approved day-by-day protocol with milestones, do&apos;s &amp; don&apos;ts, diet, and warning indicators.
        </p>
      </div>

      <div className="space-y-4">
        {days.map((d) => {
          const isExpanded = expandedDay === d.day_number;
          const milestones = safeArray(d?.milestones);
          const warningSigns = safeArray(d?.warning_signs);

          return (
            <div
              key={d.day_number}
              className={`rounded-3xl border transition-all ${
                d.is_completed
                  ? "bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800"
                  : "bg-white dark:bg-slate-900 border-purple-200 dark:border-purple-800 shadow-xs"
              }`}
            >
              {/* Day Header Bar */}
              <div
                onClick={() => setExpandedDay(isExpanded ? null : d.day_number)}
                className="p-5 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-bold ${
                      d.is_completed
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-brand-gradient text-white shadow-xs"
                    }`}
                  >
                    {d.is_completed ? <CheckCircle2 className="w-5 h-5" /> : d.day_number}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{d?.title || `Day ${d.day_number}`}</span>
                      {d.is_completed && (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Completed
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {d?.instructions || "Daily monitoring instructions"}
                    </p>
                  </div>
                </div>

                <div className="p-2 text-slate-400">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {/* Day Details Accordion */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4 text-xs">
                  {/* Instructions */}
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Clinical Instructions:
                    </span>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                      {d?.instructions || "Follow your discharge instructions and take prescribed medications."}
                    </p>
                  </div>

                  {/* Milestones Card */}
                  <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-purple-900 dark:text-purple-300">
                      <Target className="w-4 h-4 text-purple-600" />
                      <span>Target Milestone for Day {d.day_number}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">
                      {milestones.length > 0
                        ? milestones.join(", ")
                        : `Achieve assisted ambulation of at least ${d.day_number * 15} steps; keep pain score under 4/10.`}
                    </p>
                  </div>

                  {/* Do's and Don'ts */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Do&apos;s</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                        <li>Elevate surgical extremity when resting</li>
                        <li>Take prescribed blood thinners and analgesics with food</li>
                        <li>Keep dressing clean, dry, and intact</li>
                      </ul>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-rose-800 dark:text-rose-300">
                        <X className="w-4 h-4 text-rose-600" />
                        <span>Don&apos;ts</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                        <li>Do not submerge incision in bath or swimming pool</li>
                        <li>Do not lift objects heavier than 5 lbs</li>
                        <li>Do not skip prescribed antibiotic doses</li>
                      </ul>
                    </div>
                  </div>

                  {/* Grid of Diet & Exercise */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Diet */}
                    <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                      <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-300 mb-1">
                        <Utensils className="w-3.5 h-3.5" />
                        <span>Diet &amp; Nutrition</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">
                        {d?.diet_notes || "High-protein recovery diet with plenty of water and fiber."}
                      </p>
                    </div>

                    {/* Exercise */}
                    <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40">
                      <div className="flex items-center gap-2 font-bold text-purple-900 dark:text-purple-300 mb-1">
                        <Footprints className="w-3.5 h-3.5" />
                        <span>Mobility &amp; Exercises</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">
                        {d?.exercise_notes || "Gentle ambulation and prescribed physical therapy stretches 3 times daily."}
                      </p>
                    </div>
                  </div>

                  {/* Warning Signs */}
                  <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
                    <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200 mb-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Warning Signs to Watch For</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                      {warningSigns.length > 0 ? (
                        warningSigns.map((sign, idx) => <li key={idx}>{sign}</li>)
                      ) : (
                        <>
                          <li>Temperature &gt; 38.0°C (100.4°F) or shaking chills</li>
                          <li>Spreading redness or cloudy drainage from incision site</li>
                          <li>Sudden onset shortness of breath or persistent calf tenderness</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
