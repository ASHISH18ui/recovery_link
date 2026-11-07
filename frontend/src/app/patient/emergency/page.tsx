"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  PhoneCall,
  AlertTriangle,
  HeartHandshake,
  CheckCircle2,
  Clock,
  ArrowRight,
  Phone
} from "lucide-react";
import { patientApi, PatientMe } from "@/lib/patient-api";
import { usePatient } from "../PatientContext";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";

export default function PatientEmergencyPage() {
  const { lang } = usePatient();
  const [profile, setProfile] = useState<PatientMe | null>(null);
  const [alerting, setAlerting] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState(false);
  const [alertError, setAlertError] = useState<string | null>(null);

  useEffect(() => {
    patientApi
      .getMe()
      .then((res) => setProfile(res))
      .catch(() => {});
  }, []);

  const handleConfirmAlert = async () => {
    setAlerting(true);
    setAlertError(null);
    try {
      await patientApi.triggerEmergency("Patient pressed emergency help button from patient portal.");
      setAlertSuccess(true);
      setConfirmModalOpen(false);
    } catch (err: any) {
      setAlertError(err.message || "Failed to deliver emergency alert");
    } finally {
      setAlerting(false);
    }
  };

  const caregiverInfo = profile?.patient.emergency_contact || "+1 (555) 987-6543 (Spouse)";
  // Extract digits for tel link if possible
  const caregiverPhoneDigits = caregiverInfo.replace(/[^0-9+]/g, "") || "+15559876543";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Red Critical Warning Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-rose-600 text-white shadow-xl space-y-3 border-2 border-rose-500">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 animate-pulse text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Urgent Clinical Emergency
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-rose-50 font-bold leading-relaxed bg-rose-700/50 p-4 rounded-2xl border border-rose-400/40">
          If this is a life-threatening emergency, call your local emergency number immediately.
        </p>
      </div>

      {alertSuccess ? (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-emerald-500 text-center space-y-4 shadow-lg">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Emergency Escalation Dispatched!
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
              A HIGH-priority emergency alert has been sent directly to the on-call surgical nurse and attending physician. Your contact phone and hospital MRN are displayed at the top of their dashboard.
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => setAlertSuccess(false)}
            >
              Close Confirmation
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-950 shadow-sm space-y-6">
          {/* Section 1: Hospital Helpline */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Hospital 24/7 Helpline (One-Tap Call)
            </span>
            <a
              href="tel:+15550198200"
              className="flex items-center justify-between p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 hover:border-rose-500 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    St. Jude Post-Surgical Desk
                  </div>
                  <div className="text-xs text-rose-600 dark:text-rose-400 font-mono font-bold">
                    +1 (555) 019-8200
                  </div>
                </div>
              </div>
              <span className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md">
                Call Now
              </span>
            </a>
          </div>

          {/* Section 2: Caregiver Contact */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Designated Emergency Caregiver
            </span>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {caregiverInfo}
                  </div>
                  <div className="text-xs text-slate-500">Primary Recovery Caregiver</div>
                </div>
              </div>
              <a
                href={`tel:${caregiverPhoneDigits}`}
                className="px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-50"
              >
                Call Caregiver
              </a>
            </div>
          </div>

          {/* Section 3: Alert Care Team Button */}
          <div className="pt-2 space-y-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Clinical Team Escalation
            </span>
            <p className="text-xs text-slate-500 leading-relaxed">
              If you are unable to call or need the hospital team to immediately contact you, press below to flash a critical alert on the staff board.
            </p>

            {alertError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">{alertError}</div>
            )}

            <Button
              variant="danger"
              size="lg"
              onClick={() => setConfirmModalOpen(true)}
              className="w-full shadow-lg shadow-rose-500/25 py-3.5 text-sm"
              iconLeft={<ShieldAlert className="w-5 h-5" />}
            >
              {t("alertCareTeam", lang)}
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-rose-200 dark:border-rose-900 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Confirm Emergency Alert
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              This will immediately notify your surgeon and on-duty recovery nurse with high urgency. Are you sure you want to alert your care team?
            </p>
            <div className="pt-2 flex gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setConfirmModalOpen(false)}
                className="w-1/2"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                isLoading={alerting}
                onClick={handleConfirmAlert}
                className="w-1/2"
              >
                Yes, Alert Team
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
