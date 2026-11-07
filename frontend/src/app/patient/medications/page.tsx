"use client";

import React, { useEffect, useState } from "react";
import { Pill, CheckCircle2, XCircle, Clock, ShieldCheck, Flame, Check } from "lucide-react";
import { patientApi, PatientMedication } from "@/lib/patient-api";
import { usePatient } from "../PatientContext";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";

export default function PatientMedicationsPage() {
  const { lang } = usePatient();
  const [meds, setMeds] = useState<PatientMedication[]>([]);
  const [adherence, setAdherence] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchMeds = () => {
    patientApi
      .getMedications()
      .then((res) => {
        setMeds(res.medications || []);
        setAdherence(res.adherence_percent || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMeds();
  }, []);

  const handleLog = async (id: string, status: "taken" | "skipped") => {
    setUpdatingId(id);
    try {
      await patientApi.logMedication(id, status);
      fetchMeds();
    } catch (err: any) {
      alert(err.message || "Failed to log medication");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t("medicines", lang)}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Record your doses daily to help your care team monitor adherence and therapeutic efficacy.
        </p>
      </div>

      {/* Adherence & Streak Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300 flex items-center justify-center font-extrabold text-xl border border-purple-200 dark:border-purple-800">
            {adherence}%
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              7-Day Adherence Score
            </div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
              {adherence >= 80 ? "Excellent Compliance" : "Needs Consistent Dosing"}
            </div>
          </div>
        </div>

        {/* Weekly Streak Visualization */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800">
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
            <span>Weekly Streak: 5 Days</span>
          </div>
        </div>
      </div>

      {/* Medication List */}
      <div className="space-y-3">
        {meds.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500 text-sm">
            No active medications listed in your care plan.
          </div>
        ) : (
          meds.map((m) => {
            const isTaken = m.today_status === "taken";
            const isSkipped = m.today_status === "skipped";
            return (
              <div
                key={m.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {m.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                      <span className="font-semibold text-purple-600 dark:text-purple-400">
                        {m.dosage}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {m.frequency}
                      </span>
                      {m.purpose && (
                        <>
                          <span>•</span>
                          <span className="italic">{m.purpose}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Taken / Skipped Action Buttons */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    disabled={updatingId === m.id}
                    onClick={() => handleLog(m.id, "taken")}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isTaken
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isTaken ? "Taken Today" : t("markTaken", lang)}</span>
                  </button>

                  <button
                    type="button"
                    disabled={updatingId === m.id}
                    onClick={() => handleLog(m.id, "skipped")}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isSkipped
                        ? "bg-amber-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600"
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>{isSkipped ? "Skipped" : t("markSkipped", lang)}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
