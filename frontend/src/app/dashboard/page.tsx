"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  PhoneCall,
  UserPlus,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Bell,
  Stethoscope,
  ChevronRight,
  Sparkles,
  FileSpreadsheet
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, RiskBadge, RoleBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  api,
  authStorage,
  DashboardStats,
  DashboardChartsData,
  Alert,
  User
} from "@/lib/api";

export default function DashboardPage() {
  const toast = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartsData, setChartsData] = useState<DashboardChartsData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertFilter, setAlertFilter] = useState<"all" | "high" | "medium">("all");

  // Triage modal state
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [actionType, setActionType] = useState<string>("call_patient");
  const [actionNotes, setActionNotes] = useState<string>("");
  const [submittingAction, setSubmittingAction] = useState(false);

  // Reminding state for appointments
  const [remindingId, setRemindingId] = useState<string | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const user = authStorage.getUser();
      if (user) setCurrentUser(user);

      const [statsRes, chartsRes, alertsRes] = await Promise.all([
        api.getStats(),
        api.getDashboardCharts(),
        api.getAlerts("pending"),
      ]);
      setStats(statsRes);
      setChartsData(chartsRes);
      setAlerts(alertsRes);
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      toast.error("Failed to load live dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleTakeAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert) return;
    setSubmittingAction(true);
    try {
      await api.takeAlertAction(selectedAlert.id, actionType, actionNotes);
      toast.success(
        `Action recorded for patient ${selectedAlert.patient_name || ""}`,
        "Alert Triaged"
      );
      setSelectedAlert(null);
      setActionNotes("");
      loadDashboard();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit triage action");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSendReminder = async (appointmentId: string, patientName: string) => {
    setRemindingId(appointmentId);
    try {
      await api.remindAppointment(appointmentId);
      toast.success(`WhatsApp reminder sent to ${patientName}`, "Reminder Dispatched");
    } catch (err: any) {
      toast.error("Failed to dispatch appointment reminder");
    } finally {
      setRemindingId(null);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (alertFilter === "all") return true;
    return a.risk_level === alertFilter;
  });

  const currentDateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Hero Greeting Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              <span>{currentDateStr}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Good morning, {currentUser ? currentUser.full_name : "Doctor"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {stats?.requiring_review
                ? `${stats.requiring_review} patients require clinical triage attention today.`
                : "All post-discharge patients are currently monitored and stable."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={loadDashboard}
              iconLeft={<RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />}
            >
              Refresh Live Data
            </Button>
            <Link href="/discharges/new">
              <Button
                variant="primary"
                size="sm"
                iconLeft={<UserPlus className="w-4 h-4" />}
              >
                Discharge Patient
              </Button>
            </Link>
          </div>
        </div>

        {/* 4 Stat Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat 1 */}
            <Card hoverLift>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Monitored Patients
                  </span>
                  <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">
                    {stats?.total_discharged_patients ?? 15}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{chartsData?.stat_trends.discharged_trend ?? "+12% this month"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stat 2 */}
            <Card hoverLift>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Check-ins Completed
                  </span>
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">
                    {stats?.completed_today ?? 0}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{chartsData?.stat_trends.completion_trend ?? "+6% vs yesterday"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stat 3 */}
            <Card hoverLift>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Missed Today
                  </span>
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">
                    {stats?.missed_checkins ?? 0}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <span>{chartsData?.stat_trends.missed_trend ?? "-8% vs last week"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stat 4 */}
            <Card hoverLift>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Requiring Review
                  </span>
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-bold text-rose-600 dark:text-rose-400">
                    {stats?.requiring_review ?? 0}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">
                    <span>High priority triage queue</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gradient Area Chart: 7-Day Completion Rate */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Daily Recovery Check-in Completion</CardTitle>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Post-discharge submissions over past 7 calendar days
                  </p>
                </div>
                <Badge variant="success" size="sm">
                  Active Surveillance
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                {chartsData && chartsData.completion_history.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartsData.completion_history}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0EA5A4" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="day"
                        stroke="#94A3B8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#94A3B8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0F172A",
                          borderRadius: "12px",
                          border: "none",
                          color: "#fff",
                          fontSize: "12px",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="completed"
                        name="Check-ins Completed"
                        stroke="#0EA5A4"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorCompleted)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    Loading trend analytics...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Donut Chart: Risk Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Cohort Risk Distribution</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AI + clinical triage risk segmentation
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-48 relative flex items-center justify-center">
                {chartsData && chartsData.risk_distribution ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartsData.risk_distribution}
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartsData.risk_distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0F172A",
                          borderRadius: "8px",
                          border: "none",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-slate-400">Loading risk data...</div>
                )}
                {/* Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-extrabold text-slate-800 dark:text-white">
                    {stats?.total_discharged_patients ?? 15}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    Patients
                  </span>
                </div>
              </div>

              {/* Legend */}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                {chartsData?.risk_distribution.map((r) => (
                  <div key={r.name} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <div className="flex items-center justify-center gap-1.5 mb-0.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {r.value}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 truncate block">{r.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Priority Alerts Queue & Appointments Workflow */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Alerts Queue (2 Columns) */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Clinical Alerts Queue</CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Actionable flags requiring clinician review & response
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium">
                <button
                  onClick={() => setAlertFilter("all")}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    alertFilter === "all"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  All ({alerts.length})
                </button>
                <button
                  onClick={() => setAlertFilter("high")}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    alertFilter === "high"
                      ? "bg-rose-500 text-white font-semibold shadow-xs"
                      : "text-slate-500 hover:text-rose-600"
                  }`}
                >
                  High ({alerts.filter((a) => a.risk_level === "high").length})
                </button>
                <button
                  onClick={() => setAlertFilter("medium")}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    alertFilter === "medium"
                      ? "bg-amber-500 text-white font-semibold shadow-xs"
                      : "text-slate-500 hover:text-amber-600"
                  }`}
                >
                  Medium ({alerts.filter((a) => a.risk_level === "medium").length})
                </button>
              </div>
            </CardHeader>

            <CardContent>
              {filteredAlerts.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="Queue is all clear"
                  description="No pending alerts matching current filter. All patient check-ins are reviewed."
                  className="my-4"
                />
              ) : (
                <div className="space-y-3">
                  {filteredAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-2xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 shrink-0">
                            {alert.patient_name ? alert.patient_name.charAt(0) : "P"}
                          </div>
                          <div>
                            <Link
                              href={`/patients/${alert.patient_id}`}
                              className="font-semibold text-sm text-slate-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                            >
                              {alert.patient_name || "Unknown Patient"}
                            </Link>
                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>{alert.patient_phone}</span>
                              <span>•</span>
                              <span>{new Date(alert.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <RiskBadge risk={alert.risk_level} size="sm" />
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setSelectedAlert(alert);
                              setActionType("call_patient");
                              setActionNotes("");
                            }}
                          >
                            Triage
                          </Button>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {alert.summary}
                      </div>

                      {alert.flags && alert.flags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {alert.flags.map((flag, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900"
                            >
                              {flag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Column: Upcoming Appointments + Fast Actions */}
          <div className="space-y-6">
            {/* Appointments Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Upcoming Appointments</CardTitle>
                <Link
                  href="/appointments"
                  className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                >
                  View All
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {chartsData?.upcoming_appointments && chartsData.upcoming_appointments.length > 0 ? (
                  chartsData.upcoming_appointments.map((appt) => (
                    <div
                      key={appt.id}
                      className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/patients/${appt.patient_id}`}
                          className="font-semibold text-xs text-slate-900 dark:text-white hover:text-teal-600"
                        >
                          {appt.patient_name}
                        </Link>
                        <span className="text-[11px] font-mono text-slate-500">
                          {new Date(appt.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {appt.appointment_type}
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-[10px] text-slate-400">{appt.doctor_name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[11px] h-6 px-2 text-teal-600 dark:text-teal-400"
                          isLoading={remindingId === appt.id}
                          onClick={() => handleSendReminder(appt.id, appt.patient_name)}
                        >
                          Remind
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No scheduled follow-ups today.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Link Card */}
            <Card className="bg-gradient-to-br from-teal-500/10 to-blue-500/10 border-teal-200 dark:border-teal-900/40">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300 font-semibold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Clinical Governance Note</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  "AI-generated summary. Clinician review required." All alerts and patient check-ins are evaluated for safety; final clinical decisions rest strictly with licensed staff.
                </p>
                <div className="pt-2 flex items-center gap-2">
                  <Link href="/reports" className="w-full">
                    <Button variant="secondary" size="sm" className="w-full text-xs" iconLeft={<FileSpreadsheet className="w-3.5 h-3.5" />}>
                      Export Trends
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Clinical Triage Modal */}
      <Modal
        isOpen={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
        title="Clinical Triage & Action"
        description={`Record clinician intervention for patient: ${selectedAlert?.patient_name || ""}`}
        maxWidth="lg"
        footer={
          <>
            <Button
              variant="ghost"
              size="md"
              onClick={() => setSelectedAlert(null)}
              disabled={submittingAction}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={submittingAction}
              onClick={handleTakeAction}
            >
              Confirm Triage Action
            </Button>
          </>
        }
      >
        {selectedAlert && (
          <form onSubmit={handleTakeAction} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                Alert Summary:
              </div>
              <div className="text-slate-600 dark:text-slate-300">{selectedAlert.summary}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Action Taken
              </label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="call_patient">📞 Contacted Patient by Telephone</option>
                <option value="schedule_visit">🏥 Scheduled Early Clinic Re-Evaluation</option>
                <option value="escalate_to_doctor">👨‍⚕️ Escalated to Treating Attending Doctor</option>
                <option value="resolved">✅ Resolved Alert (Symptoms Addressed)</option>
                <option value="no_action_needed">ℹ️ Clinician Reviewed (No Action Needed)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Clinical Notes / Findings
              </label>
              <textarea
                rows={3}
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Document patient advice, vital measurements verified, or scheduled clinic slot..."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </form>
        )}
      </Modal>
    </AppLayout>
  );
}
