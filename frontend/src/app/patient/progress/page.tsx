"use client";

import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  Activity,
  Heart,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
  ShieldCheck
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import { patientApi, PatientCheckin } from "@/lib/patient-api";
import { usePatient } from "../PatientContext";
import { t } from "@/lib/i18n";

export default function PatientProgressPage() {
  const { lang } = usePatient();
  const [checkins, setCheckins] = useState<PatientCheckin[]>([]);
  const [vitalsData, setVitalsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([patientApi.getCheckins(), patientApi.getVitals()])
      .then(([chkRes, vitRes]) => {
        setCheckins(chkRes || []);
        setVitalsData(vitRes?.vitals || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    );
  }

  // Reverse checkins so chronological for chart
  const chartData = [...checkins].reverse().map((c) => ({
    date: c.date.slice(5), // MM-DD
    pain: c.pain_level,
    temp: c.temperature || 37.0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t("progress", lang)}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review your recovery trajectory, symptom evolution, and historical clinical evaluations.
        </p>
      </div>

      {/* Pain Trend Chart */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pain Level Trend (0 - 10)
            </span>
          </div>
          <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
            Downward trend expected
          </span>
        </div>

        <div className="h-56 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[0, 10]} stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="pain"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#8B5CF6" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No check-in history to chart yet.
            </div>
          )}
        </div>
      </div>

      {/* Historical Check-in Accordion */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Check-in History & AI Summaries
        </h2>

        {checkins.length === 0 ? (
          <div className="p-6 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
            No check-ins submitted yet.
          </div>
        ) : (
          checkins.map((c) => {
            const isExpanded = expandedId === c.id;
            return (
              <div
                key={c.id}
                className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-all"
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                  className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-bold ${
                        c.ai_risk_level === "high"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                          : c.ai_risk_level === "medium"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      }`}
                    >
                      {c.pain_level}/10
                    </div>

                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Check-in: {c.date}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {c.ai_risk_level} risk
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {c.ai_summary || "Routine daily check-in logged."}
                      </p>
                    </div>
                  </div>

                  <div className="p-2 text-slate-400">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
                    {/* AI Summary Box */}
                    <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 mt-3 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-purple-900 dark:text-purple-300 font-bold">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Summary</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                        {c.ai_summary}
                      </p>
                      <p className="text-[10px] text-slate-400 italic pt-1 border-t border-purple-200/50">
                        {c.disclaimer || t("disclaimer", lang)}
                      </p>
                    </div>

                    {/* Checkin specifics grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                        <span className="text-[10px] text-slate-400 block">Pain Level</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {c.pain_level} / 10
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                        <span className="text-[10px] text-slate-400 block">Fever Reported</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {c.has_fever ? `Yes (${c.temperature || "elevated"}°C)` : "No"}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                        <span className="text-[10px] text-slate-400 block">Swelling</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {c.has_swelling ? "Present" : "None"}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                        <span className="text-[10px] text-slate-400 block">Medication</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {c.medication_taken ? "All taken" : "Missed doses"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
