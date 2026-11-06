"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Clock,
  User as UserIcon,
  Phone,
  Send,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  LayoutList,
  CalendarDays,
  ExternalLink
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { api, Appointment, Patient } from "@/lib/api";

export default function AppointmentsPage() {
  const toast = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Reminding state
  const [remindingId, setRemindingId] = useState<string | null>(null);

  // New Appointment Modal
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [apptType, setApptType] = useState("Post-Op Surgical Check & Wound Assessment");
  const [apptDate, setApptDate] = useState("");
  const [apptNotes, setApptNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const [apptsData, patientsData] = await Promise.all([
        api.getAppointments({
          status: statusFilter === "all" ? undefined : statusFilter,
        }),
        api.getPatients(),
      ]);
      setAppointments(apptsData);
      setPatients(patientsData);
      if (patientsData.length > 0 && !selectedPatientId) {
        setSelectedPatientId(patientsData[0].id);
      }
    } catch (err: any) {
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter]);

  const handleSendReminder = async (appointmentId: string, patientName: string) => {
    setRemindingId(appointmentId);
    try {
      await api.remindAppointment(appointmentId);
      toast.success(`WhatsApp reminder sent to ${patientName}`, "Reminder Dispatched");
    } catch (err: any) {
      toast.error(err.message || "Failed to dispatch reminder");
    } finally {
      setRemindingId(null);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.updateAppointment(id, { status: newStatus });
      toast.success(`Appointment marked as ${newStatus}`);
      fetchAppointments();
    } catch (err: any) {
      toast.error("Failed to update status");
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !apptDate) {
      toast.error("Please select a patient and appointment date/time.");
      return;
    }
    setSubmitting(true);
    try {
      const p = patients.find((pat) => pat.id === selectedPatientId);
      await api.createAppointment({
        patient_id: selectedPatientId,
        care_plan_id: p?.id || "", // backend resolves active plan
        scheduled_at: new Date(apptDate).toISOString(),
        appointment_type: apptType,
        notes: apptNotes,
      });
      toast.success("Appointment scheduled successfully");
      setNewModalOpen(false);
      setApptDate("");
      setApptNotes("");
      fetchAppointments();
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule appointment");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAppointments = appointments.filter((ap) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (ap.patient_name || "").toLowerCase().includes(q) ||
      (ap.appointment_type || "").toLowerCase().includes(q) ||
      (ap.patient_mrn || "").toLowerCase().includes(q)
    );
  });

  const scheduledCount = appointments.filter((a) => a.status === "scheduled").length;
  const completedCount = appointments.filter((a) => a.status === "completed").length;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <span>Appointments & Follow-up Calendar</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Track post-discharge outpatient clinic visits, imaging, and send patient reminders
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchAppointments}
              iconLeft={<RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setNewModalOpen(true)}
              iconLeft={<Plus className="w-4 h-4" />}
            >
              Schedule Visit
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">Scheduled Upcoming</span>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                  {scheduledCount}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                <CalendarIcon className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">Completed Visits</span>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {completedCount}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">Reminder Channel</span>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                  WhatsApp + SMS
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Send className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & View Mode Switcher */}
        <Card>
          <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patient, procedure, MRN..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Status Filter */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium">
                <span className="px-2 text-slate-400">Status:</span>
                {["all", "scheduled", "completed", "cancelled"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg capitalize transition-colors ${
                      statusFilter === st
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-xs"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* View Switcher */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium">
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === "list"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                  title="List View"
                >
                  <LayoutList className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("calendar")}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === "calendar"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                  title="Calendar View"
                >
                  <CalendarDays className="w-4 h-4" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {loading ? (
          <Card className="p-8 text-center text-slate-400 animate-pulse">
            Loading scheduled follow-ups...
          </Card>
        ) : filteredAppointments.length === 0 ? (
          <EmptyState
            icon={CalendarIcon}
            title="No appointments found"
            description="There are no scheduled follow-up visits matching the current filter."
            actionLabel="Schedule Appointment"
            onAction={() => setNewModalOpen(true)}
          />
        ) : viewMode === "list" ? (
          /* List View */
          <div className="space-y-3">
            {filteredAppointments.map((appt) => (
              <Card key={appt.id} hoverLift>
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                      <CalendarIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/patients/${appt.patient_id}`}
                          className="font-bold text-base text-slate-900 dark:text-white hover:text-teal-600 transition-colors"
                        >
                          {appt.patient_name}
                        </Link>
                        <Badge
                          variant={
                            appt.status === "completed"
                              ? "success"
                              : appt.status === "cancelled"
                              ? "danger"
                              : "info"
                          }
                          size="sm"
                        >
                          {appt.status}
                        </Badge>
                      </div>

                      <div className="text-xs font-semibold text-teal-700 dark:text-teal-300 mt-0.5">
                        {appt.appointment_type}
                      </div>

                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-y-1 gap-x-3 mt-1.5">
                        <span className="flex items-center gap-1 font-mono font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(appt.scheduled_at).toLocaleString([], {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                        <span>•</span>
                        <span>Clinician: {appt.doctor_name || "Outpatient Clinic Staff"}</span>
                        <span>•</span>
                        <span>Phone: {appt.patient_phone}</span>
                      </div>

                      {appt.notes && (
                        <div className="text-xs text-slate-600 dark:text-slate-400 italic mt-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                          "{appt.notes}"
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-center">
                    {appt.status === "scheduled" && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          isLoading={remindingId === appt.id}
                          onClick={() => handleSendReminder(appt.id, appt.patient_name || "")}
                          iconLeft={<Send className="w-3.5 h-3.5" />}
                        >
                          Remind
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpdateStatus(appt.id, "completed")}
                          iconLeft={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        >
                          Complete
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpdateStatus(appt.id, "cancelled")}
                          className="text-rose-600"
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Calendar Grid / Grouped View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAppointments.map((appt) => (
              <Card key={appt.id} hoverLift>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="font-mono text-xs font-bold text-teal-600 dark:text-teal-400">
                    {new Date(appt.scheduled_at).toLocaleDateString([], {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <Badge variant={appt.status === "completed" ? "success" : "info"} size="sm">
                    {appt.status}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Link
                      href={`/patients/${appt.patient_id}`}
                      className="font-bold text-sm text-slate-900 dark:text-white hover:text-teal-600 transition-colors"
                    >
                      {appt.patient_name}
                    </Link>
                    <div className="text-xs text-slate-500 font-medium">
                      {appt.appointment_type}
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {new Date(appt.scheduled_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {appt.status === "scheduled" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full text-xs"
                      isLoading={remindingId === appt.id}
                      onClick={() => handleSendReminder(appt.id, appt.patient_name || "")}
                    >
                      Send WhatsApp Reminder
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      <Modal
        isOpen={newModalOpen}
        onClose={() => setNewModalOpen(false)}
        title="Schedule Follow-up Visit"
        description="Book a post-operative clinic visit or assessment"
        footer={
          <>
            <Button variant="ghost" size="md" onClick={() => setNewModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={submitting}
              onClick={handleCreateAppointment}
            >
              Confirm Appointment
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateAppointment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Select Patient *
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} (MRN: {p.mrn || "N/A"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Appointment Type *
            </label>
            <input
              type="text"
              required
              value={apptType}
              onChange={(e) => setApptType(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Scheduled Date & Time *
            </label>
            <input
              type="datetime-local"
              required
              value={apptDate}
              onChange={(e) => setApptDate(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Clinical Instructions / Notes
            </label>
            <textarea
              rows={2}
              value={apptNotes}
              onChange={(e) => setApptNotes(e.target.value)}
              placeholder="e.g. Suture removal, check mobility range..."
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}

