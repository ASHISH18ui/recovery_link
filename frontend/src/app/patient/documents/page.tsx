"use client";

import React, { useEffect, useState } from "react";
import { FileText, Download, Calendar, CheckCircle2, Pill, Activity, ShieldCheck } from "lucide-react";
import { patientApi } from "@/lib/patient-api";
import { usePatient } from "../PatientContext";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";

export default function PatientDocumentsPage() {
  const { lang } = usePatient();
  const [docs, setDocs] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    patientApi
      .getDocuments()
      .then((res) => setDocs(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t("documents", lang)}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Official hospital discharge summary, wound instructions, and operative records.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => window.print()}
          iconLeft={<Download className="w-3.5 h-3.5" />}
        >
          Print / PDF
        </Button>
      </div>

      {/* Document Paper Container */}
      <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-xs sm:text-sm">
        {/* Document Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-lg font-extrabold text-slate-900 dark:text-white">
              Official Hospital Discharge Summary
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              St. Jude Orthopedic & Surgical Centre • Department of Surgery
            </div>
          </div>
          <span className="px-3 py-1 rounded-full font-bold text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
            Certified Clinical Record
          </span>
        </div>

        {/* Surgical Procedure */}
        <div className="space-y-1.5">
          <span className="font-bold text-xs uppercase tracking-wider text-slate-400">
            Surgical Procedure Performed
          </span>
          <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 font-bold text-slate-900 dark:text-white">
            {docs?.surgical_procedure || "Unilateral Total Knee Arthroplasty (TKA)"}
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-1.5">
          <span className="font-bold text-xs uppercase tracking-wider text-slate-400">
            Post-Op Recovery & Wound Care Instructions
          </span>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
            {docs?.discharge_instructions ||
              "Keep incision clean and completely dry. Showering permitted with waterproof cover only. Perform ankle pumps 10x every hour. Take prescribed analgesics prior to physical therapy. Report temperature >38.0°C or calf tenderness immediately."}
          </div>
        </div>

        {/* Prescribed Medications Summary */}
        {docs?.medications && docs.medications.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-400">
              Discharge Medication Orders
            </span>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              {docs.medications.map((m: any, idx: number) => (
                <div key={idx} className="p-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{m.name}</span>
                    <span className="text-slate-500 ml-2 font-medium">({m.dosage})</span>
                    <span className="text-slate-400 block text-[11px]">{m.purpose}</span>
                  </div>
                  <span className="font-mono text-slate-600 dark:text-slate-400 font-semibold">
                    {m.frequency}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Care Plan Dates */}
        {docs?.care_plan && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              <span>Enrolled Start Date: </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {docs.care_plan.start_date ? new Date(docs.care_plan.start_date).toLocaleDateString() : "—"}
              </span>
            </div>
            <div>
              <span>Surveillance Status: </span>
              <span className="font-bold capitalize text-emerald-600 dark:text-emerald-400">
                {docs.care_plan.status}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
