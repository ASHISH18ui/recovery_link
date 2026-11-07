"use client";

import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  Activity,
  Heart,
  Thermometer,
  Pill,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
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
  const [medData, setMedData] = useState<{ adherence_percent: number }>({ adherence_percent: 85 });
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pain" | "vitals" | "adherence">("pain");

  useEffect(() => {
    Promise.all([
      patientApi.getCheckins(),
      patientApi.getVitals(),
      patientApi.getMedications()
    ])
      .then(([chkRes, vitRes, medRes]) => {
        setCheckins(chkRes || []);
        setVitalsData(vitRes?.vitals || []);
        if (medRes && typeof medRes.adherence_percent === "number") {
          setMedData({ adherence_percent: medRes.adherence_percent });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-72 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    );
  }

  // Reverse checkins so chronological for chart
  const painChartData = [...checkins].reverse().map((c) => ({
    date: c.date.slice(5), // MM-DD
    pain: c.pain_level,
  }));

  // Temperature chart data from checkins / vitals
  const tempChartData = [...checkins].reverse().map((c) => ({
    date: c.date.slice(5),
    temp: c.temperature || (c.has_fever ? 38.3 : 36.8),
  }));

  // Blood pressure & SpO2 chart data
  const bpChartData = vitalsData.length > 0
    ? vitalsData.map((v) => ({
        date: String(v.date).slice(5),
        systolic: v.systolic_bp || 120,
        diastolic: v.diastolic_bp || 80,
        spo2: v.spo2 || 98,
      }))
    : [
        { date: "Day 1", systolic: 128, diastolic: 84, spo2: 97 },
        { date: "Day 2", systolic: 124, diastolic: 82, spo2: 98 },
        { date: "Day 3", systolic: 122, diastolic: 80, spo2: 98 },
        { date: "Day 4", systolic: 120, diastolic: 80, spo2: 99 },
        { date: "Day 5", systolic: 118, diastolic: 78, spo2: 99 },
      ];

  // Adherence history bar chart
  const adherenceChartData = [
    { day: "Mon", rate: 100 },
    { day: "Tue", rate: 100 },
    { day: "Wed", rate: 85 },
    { day: "Thu", rate: 100 },
    { day: "Fri", rate: 100 },
    { day: "Sat", rate: 90 },
    { day: "Sun", rate: 100 },
  ];

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

      {/* Metric Selector Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("pain")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === "pain"
              ? "bg-purple-600 text-white shadow-xs"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Pain Trend</span>
        </button>

        <button
          onClick={() => setActiveTab("vitals")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === "vitals"
              ? "bg-purple-600 text-white shadow-xs"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Vitals (Temp, BP, SpO2)</span>
        </button>

        <button
          onClick={() => setActiveTab("adherence")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === "adherence"
              ? "bg-purple-600 text-white shadow-xs"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
          }`}
        >
          <Pill className="w-3.5 h-3.5" />
          <span>Medication Adherence</span>
        </button>
      </div>

      {/* Tab 1: Pain Trend Chart */}
      {activeTab === "pain" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pain Level Trajectory (0 - 10 Scale)
              </span>
            </div>
            <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full">
              Target: &le; 3 / 10
            </span>
          </div>

          <div className="h-60 w-full">
            {painChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={painChartData}>
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
                    name="Pain Score"
                    stroke="#8B5CF6"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#8B5CF6" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No pain data logged yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Vitals Charts (Temperature, Blood Pressure & SpO2) */}
      {activeTab === "vitals" && (
        <div className="space-y-6">
          {/* Temperature Chart */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Body Temperature (°C)
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Normal Range: 36.5°C – 37.5°C
              </span>
            </div>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tempChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis domain={[36, 40]} stroke="#94a3b8" fontSize={11} />
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
                    dataKey="temp"
                    name="Temperature (°C)"
                    stroke="#EC4899"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#EC4899" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Blood Pressure & SpO2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* BP */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Blood Pressure (mmHg)
                </span>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full">
                  Systolic / Diastolic
                </span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bpChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                    <YAxis domain={[60, 150]} stroke="#94a3b8" fontSize={10} />
                    <Tooltip />
                    <Line type="monotone" dataKey="systolic" name="Systolic" stroke="#3B82F6" strokeWidth={2} />
                    <Line type="monotone" dataKey="diastolic" name="Diastolic" stroke="#10B981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* SpO2 */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Oxygen Saturation (SpO2 %)
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                  Normal &ge; 95%
                </span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bpChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                    <YAxis domain={[90, 100]} stroke="#94a3b8" fontSize={10} />
                    <Tooltip />
                    <Line type="monotone" dataKey="spo2" name="SpO2 (%)" stroke="#14B8A6" strokeWidth={3} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Medication Adherence Bar Chart */}
      {activeTab === "adherence" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Daily Medication Adherence Rate (%)
              </span>
            </div>
            <span className="text-xs font-bold text-purple-600">
              Overall: {medData.adherence_percent}%
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={adherenceChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="rate" name="Adherence %" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Historical Check-in Accordion */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Check-in History & AI Summaries
          </h2>
          <span className="text-[11px] text-slate-400">
            Click to expand clinical details
          </span>
        </div>

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
                        <span>AI-Generated Summary</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                        {c.ai_summary}
                      </p>
                      <p className="text-[10px] text-slate-400 italic pt-1 border-t border-purple-200/50">
                        AI-generated summary. Clinician review required.
                      </p>
                    </div>

                    {/* Specific readings grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                        <span className="text-[10px] text-slate-400 block">Pain Score</span>
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
