"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  PhoneCall,
  Calendar,
  Clock,
  RefreshCw,
  Search,
  UserCheck,
  Filter,
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  UserPlus,
  MessageSquare
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, RiskBadge, RoleBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { api, Alert, User } from "@/lib/api";

export default function AlertsQueuePage() {
  const toast = useToast();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [riskFilter, setRiskFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [search, setSearch] = useState("");

  // Triage Action Modal
  const [triageAlert, setTriageAlert] = useState<Alert | null>(null);
  const [actionType, setActionType] = useState("call_patient");
  const [actionNotes, setActionNotes] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  // Assign Modal
  const [assignAlertTarget, setAssignAlertTarget] = useState<Alert | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [assignNotes, setAssignNotes] = useState("");
  const [submittingAssign, setSubmittingAssign] = useState(false);

  const fetchAlertsAndTeam = async () => {
    setLoading(true);
    try {
      const [alertsData, teamData] = await Promise.all([
        api.listAlerts({
          risk_level: riskFilter === "all" ? undefined : riskFilter,
          status: statusFilter === "all" ? undefined : statusFilter,
          search: search.trim() || undefined,
        }),
        api.getTeamMembers().catch(() => []),
      ]);
      setAlerts(alertsData);
      setTeamMembers(teamData);
      if (teamData.length > 0 && !selectedAssignee) {
        const firstNurse = teamData.find((t) => t.role === "nurse") || teamData[0];
        setSelectedAssignee(firstNurse.id);
      }
    } catch (err: any) {
      toast.error("Failed to load alerts queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertsAndTeam();
  }, [riskFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAlertsAndTeam();
  };

  const handleTakeAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!triageAlert) return;
    setSubmittingAction(true);
    try {
      await api.takeAlertAction(triageAlert.id, actionType, actionNotes);
      toast.success(
        `Action recorded for ${triageAlert.patient_name || "patient"}`,
        "Alert Triaged"
      );
      setTriageAlert(null);
      setActionNotes("");
      fetchAlertsAndTeam();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit triage action");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignAlertTarget || !selectedAssignee) return;
    setSubmittingAssign(true);
    try {
      const assigneeObj = teamMembers.find((m) => m.id === selectedAssignee);
      await api.assignAlert(assignAlertTarget.id, selectedAssignee, assignNotes);
      toast.success(
        `Alert assigned to ${assigneeObj ? assigneeObj.full_name : "clinician"}`,
        "Assigned"
      );
      setAssignAlertTarget(null);
      setAssignNotes("");
      fetchAlertsAndTeam();
    } catch (err: any) {
      toast.error(err.message || "Failed to assign alert");
    } finally {
      setSubmittingAssign(false);
    }
  };

  const highRiskCount = alerts.filter((a) => a.risk_level === "high").length;
  const mediumRiskCount = alerts.filter((a) => a.risk_level === "medium").length;
  const pendingCount = alerts.filter((a) => a.status === "pending").length;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <span>Clinical Alerts & Triage Queue</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Active surgical symptom red flags requiring licensed nurse or physician review
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchAlertsAndTeam}
              iconLeft={<RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />}
            >
              Refresh Queue
            </Button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">
                  Open Pending
                </span>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                  {pendingCount}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">
                  High Severity
                </span>
                <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                  {highRiskCount}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">
                  Medium Severity
                </span>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                  {mediumRiskCount}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Bell className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">
                  Response SLA
                </span>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  &lt; 15 min
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter Bar */}
        <Card>
          <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patient name or MRN..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </form>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Risk Filter */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium">
                <span className="px-2 text-slate-400">Risk:</span>
                <button
                  onClick={() => setRiskFilter("all")}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    riskFilter === "all"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setRiskFilter("high")}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    riskFilter === "high"
                      ? "bg-rose-500 text-white font-semibold shadow-xs"
                      : "text-slate-500 hover:text-rose-600"
                  }`}
                >
                  High
                </button>
                <button
                  onClick={() => setRiskFilter("medium")}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    riskFilter === "medium"
                      ? "bg-amber-500 text-white font-semibold shadow-xs"
                      : "text-slate-500 hover:text-amber-600"
                  }`}
                >
                  Medium
                </button>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium">
                <span className="px-2 text-slate-400">Status:</span>
                <button
                  onClick={() => setStatusFilter("pending")}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    statusFilter === "pending"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setStatusFilter("acknowledged")}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    statusFilter === "acknowledged"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Acknowledged
                </button>
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    statusFilter === "all"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  All
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts List */}
        {loading ? (
          <div className="space-y-4">
            <Card className="p-8 text-center text-slate-400 animate-pulse">
              Loading alerts...
            </Card>
          </div>
        ) : alerts.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="All clear! No alerts in queue"
            description="There are currently no patient flags matching your filter criteria."
          />
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <Card key={alert.id} hoverLift>
                <CardContent className="p-6 space-y-4">
                  {/* Top header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-base shrink-0">
                        {alert.patient_name ? alert.patient_name.charAt(0) : "P"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/patients/${alert.patient_id}`}
                            className="font-bold text-base text-slate-900 dark:text-white hover:text-teal-600 transition-colors"
                          >
                            {alert.patient_name || "Unknown Patient"}
                          </Link>
                          <RiskBadge risk={alert.risk_level} size="sm" />
                          <Badge variant={alert.status === "pending" ? "danger" : "default"} size="sm">
                            {alert.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                          <span>Phone: <strong>{alert.patient_phone}</strong></span>
                          <span>•</span>
                          <span>Flagged: {new Date(alert.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setAssignAlertTarget(alert);
                          setAssignNotes("");
                        }}
                        iconLeft={<UserPlus className="w-3.5 h-3.5" />}
                      >
                        Assign
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setTriageAlert(alert);
                          setActionType("call_patient");
                          setActionNotes("");
                        }}
                      >
                        Acknowledge & Triage
                      </Button>
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                    {alert.summary}
                  </div>

                  {/* Flags list */}
                  {alert.flags && alert.flags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {alert.flags.map((flag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900"
                        >
                          {flag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Existing Review / Clinical Notes */}
                  {(alert.acknowledged_by_name || alert.notes) && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
                      <div>
                        {alert.acknowledged_by_name && (
                          <span>
                            Handled by: <strong className="text-slate-700 dark:text-slate-300">{alert.acknowledged_by_name}</strong>
                            {alert.action_taken && ` (${alert.action_taken.replace(/_/g, " ")})`}
                          </span>
                        )}
                        {alert.notes && <div className="text-slate-600 dark:text-slate-400 italic mt-0.5">"{alert.notes}"</div>}
                      </div>

                      {alert.acknowledged_at && (
                        <span className="font-mono text-[11px] text-slate-400 shrink-0">
                          {new Date(alert.acknowledged_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Triage Action Modal */}
      <Modal
        isOpen={!!triageAlert}
        onClose={() => setTriageAlert(null)}
        title="Triage & Record Clinical Action"
        description={`Record intervention for patient: ${triageAlert?.patient_name || ""}`}
        footer={
          <>
            <Button variant="ghost" size="md" onClick={() => setTriageAlert(null)}>
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
        {triageAlert && (
          <form onSubmit={handleTakeAction} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <strong className="block text-slate-700 dark:text-slate-300 mb-1">Alert Summary:</strong>
              <p className="text-slate-600 dark:text-slate-400">{triageAlert.summary}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Action Taken *
              </label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="call_patient">📞 Contacted Patient by Telephone</option>
                <option value="schedule_visit">🏥 Scheduled Early In-Person Clinic Visit</option>
                <option value="escalate_to_doctor">👨‍⚕️ Escalated to Treating Attending Doctor</option>
                <option value="resolved">✅ Resolved Alert (Symptoms Handled / Verified)</option>
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
                placeholder="Document patient advice, vitals verified, medication adjustments, or next steps..."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </form>
        )}
      </Modal>

      {/* Assign Alert Modal */}
      <Modal
        isOpen={!!assignAlertTarget}
        onClose={() => setAssignAlertTarget(null)}
        title="Assign Alert to Staff Member"
        description={`Delegate patient alert for ${assignAlertTarget?.patient_name || ""} to a team member`}
        footer={
          <>
            <Button variant="ghost" size="md" onClick={() => setAssignAlertTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={submittingAssign}
              onClick={handleAssignSubmit}
            >
              Assign Alert
            </Button>
          </>
        }
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Select Clinician / Nurse *
            </label>
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name} ({member.role.toUpperCase()} - {member.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Assignment Instructions / Note
            </label>
            <textarea
              rows={2}
              value={assignNotes}
              onChange={(e) => setAssignNotes(e.target.value)}
              placeholder="e.g. Please call patient to verify calf tenderness before 12:00..."
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
