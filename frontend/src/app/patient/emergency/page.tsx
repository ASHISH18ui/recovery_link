"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  PhoneCall,
  AlertTriangle,
  HeartHandshake,
  CheckCircle2,
  Clock,
  ArrowRight
} from "lucide-react";
import { patientApi, PatientMe } from "@/lib/patient-api";
import { usePatient } from "../PatientContext";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";

export default function PatientEmergencyPage() {
  const { lang } = usePatient();
  const [profile, setProfile] = useState<PatientMe | null>(null);
  const [alerting, setAlerting] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState(false);
  const [alertError, setAlertError] = useState<string | null>(null);

  useEffect(() => {
    patientApi
      .getMe()
      .then((res) => setProfile(res))
      .catch(() => {});
  }, []);

  const handleTriggerEmergency = async () => {
    setAlerting(true);
    setAlertError(null);
    try {
      await patientApi.triggerEmergency("Patient pressed emergency help button from patient portal.");
      setAlertSuccess(true);
    } catch (err: any) {
      setAlertError(err.message || "Failed to deliver emergency alert");
    } finally {
      setAlerting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Red Critical Banner */}
      <div className="p-6 rounded-3xl bg-rose-600 text-white shadow-xl space-y-3">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-6 h-6 shrink-0 animate-bounce" />
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Urgent Clinical Assistance
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-rose-100 font-medium leading-relaxed">
          {t("emergencyNote", lang)}
        </p>
      </div>

      {alertSuccess ? (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Emergency Alert Dispatched
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              A HIGH-priority escalation has been flashed on the on-call surgical nurse & doctor monitoring dashboard. Please keep your phone nearby.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          {/* Option A: One-Tap Hospital Helpline Call */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Option 1: Call Hospital Helpline Directly
            </span>
            <a
              href="tel:+15550198200"
              className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-500 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    St. Jude 24/7 Post-Op Desk
                  </div>
                  <div className="text-xs text-purple-600 dark:text-purple-400 font-mono font-bold">
                    +1 (555) 019-8200
                  </div>
                </div>
              </div>
              <span className="px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-xs">
                Tap to Call
              </span>
            </a>
          </div>

          {/* Option B: Caregiver Contact */}
          {profile?.patient.emergency_contact && (
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Option 2: Contact Your Caregiver
              </span>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {profile.patient.emergency_contact}
                    </div>
                    <div className="text-xs text-slate-500">Designated Emergency Caregiver</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Option C: Alert Care Team Button */}
          <div className="pt-2 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Option 3: Trigger High-Priority Care Team Alert
            </span>
            <p className="text-xs text-slate-500">
              Sends an immediate escalation alert to the attending nurse and physician with your medical record and home address details.
            </p>

            {alertError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">{alertError}</div>
            )}

            <Button
              variant="danger"
              size="lg"
              isLoading={alerting}
              onClick={handleTriggerEmergency}
              className="w-full shadow-lg shadow-rose-500/20"
              iconLeft={<ShieldAlert className="w-4 h-4" />}
            >
              {t("alertCareTeam", lang)}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
