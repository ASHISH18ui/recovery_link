"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle2,
  CalendarX,
  Send,
  Check
} from "lucide-react";
import { patientApi, PatientAppointment } from "@/lib/patient-api";
import { usePatient } from "../PatientContext";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";

export default function PatientAppointmentsPage() {
  const { lang } = usePatient();
  const [appts, setAppts] = useState<PatientAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Reschedule Modal
  const [selectedAppt, setSelectedAppt] = useState<PatientAppointment | null>(null);
  const [reason, setReason] = useState("");
  const [dates, setDates] = useState("");
  const [submittingReschedule, setSubmittingReschedule] = useState(false);
  const [rescheduleSuccess, setRescheduleSuccess] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  const fetchAppts = () => {
    patientApi
      .getAppointments()
      .then((res) => setAppts(res || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAppts();
  }, []);

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppt) return;
    setSubmittingReschedule(true);
    setRescheduleError(null);
    try {
      await patientApi.rescheduleAppointment(selectedAppt.id, reason, dates);
      setRescheduleSuccess(true);
      fetchAppts();
    } catch (err: any) {
      setRescheduleError(err.message || "Failed to submit request");
    } finally {
      setSubmittingReschedule(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  const upcoming = appts.filter((a) => a.is_upcoming);
  const past = appts.filter((a) => !a.is_upcoming);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t("appointments", lang)}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review your post-surgical clinic visits and request rescheduling if required.
        </p>
      </div>

      {/* Upcoming Section */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Upcoming Follow-up Visits
        </h2>

        {upcoming.length === 0 ? (
          <div className="p-6 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
            No upcoming clinic appointments scheduled at this time.
          </div>
        ) : (
          upcoming.map((a) => (
            <div
              key={a.id}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {a.appointment_type}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Confirmed
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-semibold text-purple-600 dark:text-purple-400">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(a.scheduled_at).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      Outpatient Clinic, Room 304
                    </span>
                  </div>

                  {a.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl">
                      {a.notes}
                    </p>
                  )}
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedAppt(a);
                  setReason("");
                  setDates("");
                  setRescheduleSuccess(false);
                  setRescheduleError(null);
                }}
              >
                {t("requestReschedule", lang)}
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Past Appointments Section */}
      {past.length > 0 && (
        <div className="space-y-3 pt-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Past Clinic Reviews
          </h2>
          <div className="space-y-2">
            {past.map((a) => (
              <div
                key={a.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {a.appointment_type}
                    </span>
                    <span className="text-slate-400 block text-[11px]">
                      {new Date(a.scheduled_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase">
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Request Rescheduling
              </h3>
              <button
                onClick={() => setSelectedAppt(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {rescheduleSuccess ? (
              <div className="py-6 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Reschedule Request Sent!
                </h4>
                <p className="text-xs text-slate-500">
                  Your care navigation team has received your request and will call you with updated appointment slots.
                </p>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setSelectedAppt(null)}
                  className="w-full"
                >
                  Done
                </Button>
              </div>
            ) : (
              <form onSubmit={handleRescheduleSubmit} className="space-y-3 text-xs">
                {rescheduleError && (
                  <div className="p-3 rounded-xl bg-rose-50 text-rose-700">{rescheduleError}</div>
                )}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Reason for Reschedule
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. Transportation conflict, fever, etc."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Preferred Alternative Dates / Times
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Next Tuesday morning or Thursday afternoon"
                    value={dates}
                    onChange={(e) => setDates(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
                <div className="pt-2 flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => setSelectedAppt(null)}
                    className="w-1/2"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={submittingReschedule}
                    className="w-1/2"
                  >
                    Send Request
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
