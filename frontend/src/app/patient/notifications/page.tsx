"use client";

import React, { useEffect, useState } from "react";
import { Bell, Clock, Pill, Calendar, AlertTriangle, MessageSquare, CheckCircle2 } from "lucide-react";
import { patientApi } from "@/lib/patient-api";
import { usePatient } from "../PatientContext";
import { t } from "@/lib/i18n";

export default function PatientNotificationsPage() {
  const { lang } = usePatient();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    patientApi
      .getNotifications()
      .then((res) => setNotifications(res || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "medication_reminder":
        return <Pill className="w-4 h-4 text-blue-600" />;
      case "checkin_reminder":
        return <CheckCircle2 className="w-4 h-4 text-purple-600" />;
      case "appointment_reminder":
        return <Calendar className="w-4 h-4 text-emerald-600" />;
      case "staff_escalation":
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t("notifications", lang)}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Automated clinical reminders, SMS dispatches, and care team alerts.
        </p>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
            No notifications logged yet.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-start gap-3.5"
            >
              <div className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                {getIcon(n.notification_type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 capitalize">
                    {n.notification_type.replace(/_/g, " ")}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {n.sent_at ? new Date(n.sent_at).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  {n.message}
                </p>
                <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                  <span className="uppercase font-semibold">Channel: {n.channel}</span>
                  <span>•</span>
                  <span className="capitalize">{n.status}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
