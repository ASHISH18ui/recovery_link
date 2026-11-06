"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  User as UserIcon,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  Pill,
  Activity,
  Heart,
  FileText,
  Clock,
  Send,
  MessageCircle,
  Thermometer,
  ShieldCheck,
  Plus,
  Stethoscope,
  Info,
  Sparkles,
  ClipboardList
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, RiskBadge, RoleBadge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import {
  api,
  authStorage,
  Checkin,
  Alert,
  Appointment,
  PatientNote,
  Medication
} from "@/lib/api";

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const toast = useToast();

  const [patient, setPatient] = useState<any>(null);
  const [notes, setNotes] = useState<PatientNote[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Fast action states
  const [reminding, setReminding] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteType, setNewNoteType] = useState("clinical");
  const [submittingNote, setSubmittingNote] = useState(false);

  // New Appointment Modal
  const [apptModalOpen, setApptModalOpen] = useState(false);
  const [apptType, setApptType] = useState("Post-Op Surgical Check & Wound Assessment");
  const [apptDate, setApptDate] = useState("");
  const [apptNotes, setApptNotes] = useState("");
  const [submittingAppt, setSubmittingAppt] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const [detailData, notesData, activityData] = await Promise.all([
        api.getPatientDetail(id),
        api.getPatientNotes(id).catch(() => []),
        api.getPatientActivity(id).catch(() => []),
      ]);
      setPatient(detailData);
      setNotes(notesData);
      setActivity(activityData);
    } catch (err: any) {
      toast.error("Failed to load patient record");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  const copyPatientLink = () => {
    if (!patient) return;
    const url = `${window.location.origin}/check-in/${patient.access_token}`;
    navigator.clipboard.writeText(url);
    toast.success("Patient portal link copied to clipboard");
  };

  const handleSendReminder = async () => {
    if (!patient) return;
    setReminding(true);
    try {
      await api.sendReminder(patient.id);
      toast.success(`Check-in reminder sent to ${patient.full_name}`, "Dispatched");
      fetchDetail();
    } catch (err: any) {
      toast.error(err.message || "Failed to dispatch reminder");
    } finally {
      setReminding(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    setSubmittingNote(true);
    try {
      const added = await api.addPatientNote(id, newNoteContent.trim(), newNoteType);
      setNotes((prev) => [added, ...prev]);
      setNewNoteContent("");
      toast.success("Clinical note recorded", "Note Saved");
    } catch (err: any) {
      toast.error("Failed to save note");
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apptDate) {
      toast.error("Please select appointment date and time");
      return;
    }
    setSubmittingAppt(true);
    try {
      await api.createAppointment({
        patient_id: id,
        care_plan_id: patient.current_care_plan?.id || "",
        scheduled_at: new Date(apptDate).toISOString(),
        appointment_type: apptType,
        notes: apptNotes,
      });
      toast.success("Appointment scheduled successfully");
      setApptModalOpen(false);
      setApptDate("");
      setApptNotes("");
      fetchDetail();
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule appointment");
    } finally {
      setSubmittingAppt(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="py-24 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Loading comprehensive clinical record...</p>
        </div>
      </AppLayout>
    );
  }

  if (!patient) {
    return (
      <AppLayout>
        <div className="py-16 text-center">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Patient Record Not Found</h2>
          <p className="text-sm text-slate-500 mt-2">The requested patient MRN or ID does not exist.</p>
          <Link href="/patients">
            <Button variant="secondary" size="sm" className="mt-4">
              Return to Directory
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const latestCheckin: Checkin | undefined = patient.checkins?.[0];
  const medications: Medication[] = patient.current_care_plan?.medications || [];
  const appointments: Appointment[] = patient.appointments || [];
  const openAlerts = (patient.alerts || []).filter((a: Alert) => a.status === "pending");

  const tabList = [
    { id: "overview", label: "Overview", icon: <ClipboardList className="w-4 h-4" /> },
    { id: "checkins", label: "Check-ins", badge: patient.checkins?.length || 0, icon: <Activity className="w-4 h-4" /> },
    { id: "medications", label: "Medications", badge: medications.length, icon: <Pill className="w-4 h-4" /> },
    { id: "appointments", label: "Appointments", badge: appointments.length, icon: <Calendar className="w-4 h-4" /> },
    { id: "notes", label: "Clinical Notes", badge: notes.length, icon: <FileText className="w-4 h-4" /> },
    { id: "activity", label: "Audit & Activity", icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Navigation back */}
        <div className="flex items-center gap-2">
          <Link
            href="/patients"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Patient Directory</span>
          </Link>
        </div>

        {/* Patient Hero Card */}
        <Card className="overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-teal-500/10 via-blue-500/5 to-transparent border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-brand-gradient text-white flex items-center justify-center font-bold text-2xl shadow-md shrink-0">
                  {patient.full_name.charAt(0)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {patient.full_name}
                    </h1>
                    <RiskBadge risk={latestCheckin?.ai_risk_level || "low"} />
                    <Badge variant="neutral" size="sm">
                      {patient.current_care_plan?.status === "active" ? "Active Recovery" : "Discharged"}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
                    <span>MRN: <strong className="text-slate-700 dark:text-slate-200">{patient.mrn || "N/A"}</strong></span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {patient.phone}</span>
                    <span>•</span>
                    <span>DOB: {patient.date_of_birth}</span>
                    <span>•</span>
                    <span>Gender: {patient.gender}</span>
                  </div>

                  {patient.surgical_procedure && (
                    <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200">
                      <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                      <span>{patient.surgical_procedure}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={copyPatientLink}
                  iconLeft={<Copy className="w-3.5 h-3.5" />}
                >
                  Copy Portal Link
                </Button>
                <Link href={`/check-in/${patient.access_token}`} target="_blank">
                  <Button
                    variant="secondary"
                    size="sm"
                    iconLeft={<ExternalLink className="w-3.5 h-3.5" />}
                  >
                    Open Portal
                  </Button>
                </Link>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={reminding}
                  onClick={handleSendReminder}
                  iconLeft={<Send className="w-3.5 h-3.5" />}
                >
                  Send Reminder
                </Button>
              </div>
            </div>
          </div>

          {/* Active Alerts Banner if pending */}
          {openAlerts.length > 0 && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/60 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-xs text-rose-900 dark:text-rose-200 uppercase tracking-wider">
                  {openAlerts.length} Clinical Alert Requiring Review:
                </div>
                <div className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                  {openAlerts[0].summary}
                </div>
              </div>
              <Link href="/alerts">
                <Button variant="danger" size="sm" className="text-xs">
                  Review Alert
                </Button>
              </Link>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="px-6 pt-3">
            <Tabs tabs={tabList} activeTab={activeTab} onChange={setActiveTab} />
          </div>
        </Card>

        {/* Tab 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Surgical & Care Plan Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Clinical Case Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Primary Diagnosis</div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-white mt-1">
                        {patient.diagnosis || "Post-Operative Monitoring"}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Surgical Procedure</div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-white mt-1">
                        {patient.surgical_procedure || "Not Specified"}
                      </div>
                    </div>
                  </div>

                  {patient.discharge_instructions && (
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Discharge Instructions
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {patient.discharge_instructions}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Latest Check-in Snapshot */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle>Latest Recovery Check-in</CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {latestCheckin ? `Submitted on ${latestCheckin.date}` : "No check-ins submitted yet."}
                    </p>
                  </div>
                  {latestCheckin && <RiskBadge risk={latestCheckin.ai_risk_level} size="sm" />}
                </CardHeader>
                <CardContent>
                  {latestCheckin ? (
                    <div className="space-y-4">
                      {/* Metric chips */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center">
                          <div className="text-xs text-slate-400">Pain Level</div>
                          <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                            {latestCheckin.pain_level}/10
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center">
                          <div className="text-xs text-slate-400">Fever / Temp</div>
                          <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                            {latestCheckin.has_fever ? `${latestCheckin.temperature || 38.0}°C` : "Normal"}
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center">
                          <div className="text-xs text-slate-400">Wound Swelling</div>
                          <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                            {latestCheckin.has_swelling ? "Reported" : "None"}
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center">
                          <div className="text-xs text-slate-400">Medication</div>
                          <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                            {latestCheckin.medication_taken ? "Taken" : "Missed"}
                          </div>
                        </div>
                      </div>

                      {/* AI Summary Card with disclaimer */}
                      <div className="p-4 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/60 space-y-2">
                        <div className="flex items-center justify-between text-xs text-teal-800 dark:text-teal-300 font-semibold">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-teal-600" />
                            <span>AI Recovery Summary</span>
                          </div>
                          <span className="text-[11px] font-normal italic opacity-90">
                            AI-generated summary. Clinician review required.
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {latestCheckin.ai_summary || "Patient status normal."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      title="No check-ins logged yet"
                      description="The patient has not submitted their first daily recovery check-in."
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Column: Patient Contacts & Next Appointment */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Contacts & Demographics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Primary Telephone</span>
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">{patient.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Email Address</span>
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">{patient.email || "Not provided"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Emergency Contact</span>
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">{patient.emergency_contact || "None listed"}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 block font-medium">Monitoring Link URL</span>
                    <span className="font-mono text-[11px] text-teal-600 dark:text-teal-400 break-all">
                      {window.location.origin}/check-in/{patient.access_token}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Next Appointment Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-base">Next Follow-Up</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setApptModalOpen(true)}>
                    + Schedule
                  </Button>
                </CardHeader>
                <CardContent>
                  {appointments.length > 0 ? (
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-800 dark:text-white">
                          {appointments[0].appointment_type}
                        </span>
                        <Badge variant="info" size="sm">
                          {appointments[0].status}
                        </Badge>
                      </div>
                      <div className="text-xs font-mono text-slate-500">
                        {new Date(appointments[0].scheduled_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                      </div>
                      {appointments[0].notes && (
                        <div className="text-[11px] text-slate-400 italic">
                          "{appointments[0].notes}"
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-xs text-slate-400">
                      No follow-up visit scheduled.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Tab 2: CHECK-INS TIMELINE */}
        {activeTab === "checkins" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Daily Check-in Trajectory
                </h3>
                <p className="text-xs text-slate-500">
                  Chronological submission timeline with AI summaries and rule-based flags
                </p>
              </div>
              <Badge variant="neutral" size="sm">
                Total Check-ins: {patient.checkins?.length || 0}
              </Badge>
            </div>

            {(!patient.checkins || patient.checkins.length === 0) ? (
              <EmptyState
                icon={Activity}
                title="No check-ins logged"
                description="This patient has not submitted any recovery check-ins yet."
              />
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {patient.checkins.map((chk: Checkin, idx: number) => {
                  const painColor =
                    chk.pain_level >= 7
                      ? "bg-rose-500"
                      : chk.pain_level >= 4
                      ? "bg-amber-500"
                      : "bg-emerald-500";

                  return (
                    <motion.div
                      key={chk.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="relative pl-6"
                    >
                      {/* Timeline dot */}
                      <span
                        className={`absolute -left-[19px] top-4 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${painColor} shadow-xs`}
                      />

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                              {chk.date}
                            </span>
                            <span className="text-xs text-slate-400">
                              {new Date(chk.submitted_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <RiskBadge risk={chk.ai_risk_level} size="sm" />
                        </CardHeader>

                        <CardContent className="space-y-4">
                          {/* Metrics row */}
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-medium">
                              Pain: <strong>{chk.pain_level}/10</strong>
                            </span>
                            <span className={`px-2.5 py-1 rounded-lg font-medium ${chk.has_fever ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200" : "bg-slate-100 dark:bg-slate-800"}`}>
                              Fever: {chk.has_fever ? (chk.temperature ? `${chk.temperature}°C` : "Yes") : "No"}
                            </span>
                            <span className={`px-2.5 py-1 rounded-lg font-medium ${chk.has_swelling ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200" : "bg-slate-100 dark:bg-slate-800"}`}>
                              Swelling: {chk.has_swelling ? (chk.swelling_details || "Yes") : "No"}
                            </span>
                            <span className={`px-2.5 py-1 rounded-lg font-medium ${chk.medication_taken ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200"}`}>
                              Meds: {chk.medication_taken ? "Taken" : `Missed (${chk.missed_medication_reason || "No reason"})`}
                            </span>
                            {chk.callback_requested && (
                              <span className="px-2.5 py-1 rounded-lg bg-rose-500 text-white font-bold animate-pulse">
                                Callback Requested
                              </span>
                            )}
                          </div>

                          {/* AI Summary Box */}
                          {chk.ai_summary && (
                            <div className="p-3.5 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/60 space-y-1.5">
                              <div className="flex items-center justify-between text-xs text-teal-800 dark:text-teal-300 font-semibold">
                                <span className="flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                                  AI Summary
                                </span>
                                <span className="text-[10px] font-normal italic opacity-90">
                                  AI-generated summary. Clinician review required.
                                </span>
                              </div>
                              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                {chk.ai_summary}
                              </p>
                            </div>
                          )}

                          {/* Rule Flags */}
                          {chk.ai_flags && chk.ai_flags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {chk.ai_flags.map((flag: string, fIdx: number) => (
                                <span
                                  key={fIdx}
                                  className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900"
                                >
                                  {flag}
                                </span>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: MEDICATIONS */}
        {activeTab === "medications" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Post-Discharge Medication Regimen
                </h3>
                <p className="text-xs text-slate-500">
                  Prescribed pharmaceuticals and daily patient adherence tracking
                </p>
              </div>
            </div>

            {medications.length === 0 ? (
              <EmptyState
                icon={Pill}
                title="No active medications"
                description="No specific discharge medications assigned to this care plan."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {medications.map((med: Medication) => (
                  <Card key={med.id || med.name} hoverLift>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                          <Pill className="w-5 h-5" />
                        </div>
                        <Badge variant="success" size="sm">
                          Active Regimen
                        </Badge>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {med.name}
                        </h4>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          {med.dosage} • {med.frequency}
                        </div>
                      </div>

                      {med.purpose && (
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300">
                          <strong>Purpose:</strong> {med.purpose}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: APPOINTMENTS */}
        {activeTab === "appointments" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Scheduled Clinical Follow-ups
                </h3>
                <p className="text-xs text-slate-500">
                  Outpatient surgical reviews, imaging visits, and suture removals
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setApptModalOpen(true)}
                iconLeft={<Plus className="w-4 h-4" />}
              >
                Schedule Appointment
              </Button>
            </div>

            {appointments.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No appointments scheduled"
                description="Click schedule appointment above to book an outpatient clinic visit."
              />
            ) : (
              <div className="space-y-3">
                {appointments.map((appt: Appointment) => (
                  <Card key={appt.id}>
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900 dark:text-white">
                            {appt.appointment_type}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="font-mono">
                              {new Date(appt.scheduled_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                            </span>
                            {appt.notes && <span>• "{appt.notes}"</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Badge variant="info" size="sm">
                          {appt.status}
                        </Badge>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            api.remindAppointment(appt.id)
                              .then(() => toast.success("WhatsApp reminder dispatched"))
                              .catch(() => toast.error("Failed to send reminder"));
                          }}
                        >
                          Send WhatsApp Reminder
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: CLINICAL NOTES */}
        {activeTab === "notes" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Staff Clinical Notes
                </h3>
                <p className="text-xs text-slate-500">
                  Multidisciplinary documentation and phone contact logs
                </p>
              </div>
            </div>

            {/* Note input box */}
            <Card>
              <CardContent className="p-4">
                <form onSubmit={handleAddNote} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Note Category:
                    </span>
                    <select
                      value={newNoteType}
                      onChange={(e) => setNewNoteType(e.target.value)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="clinical">Clinical Assessment</option>
                      <option value="phone_call">Phone Consultation Log</option>
                      <option value="follow_up">Follow-Up Note</option>
                      <option value="general">General Administrative</option>
                    </select>
                  </div>

                  <textarea
                    rows={3}
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Document clinical assessment, patient communication, wound instructions..."
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={submittingNote}
                      disabled={!newNoteContent.trim()}
                    >
                      Save Clinical Note
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Existing notes */}
            {notes.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No clinical notes recorded"
                description="Write the first entry above to document care coordination."
              />
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <Card key={note.id}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-800 dark:text-white">
                            {note.author_name}
                          </span>
                          <RoleBadge role={note.author_role} />
                          <Badge variant="neutral" size="sm">
                            {note.note_type}
                          </Badge>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(note.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {note.content}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 6: ACTIVITY & AUDIT */}
        {activeTab === "activity" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Patient Audit History
              </h3>
              <p className="text-xs text-slate-500">
                Staff access log, alert acknowledgements, and notifications dispatched
              </p>
            </div>

            {activity.length === 0 ? (
              <EmptyState
                icon={ShieldCheck}
                title="No audit events found"
                description="Audit logs for this patient will appear as staff interact with the record."
              />
            ) : (
              <div className="space-y-2">
                {activity.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {item.action} • {item.user_name} ({item.user_role})
                      </div>
                      <div className="text-slate-500 mt-0.5">{item.details}</div>
                    </div>
                    <span className="text-slate-400 font-mono shrink-0">
                      {item.created_at ? new Date(item.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Schedule Appointment Modal */}
      <Modal
        isOpen={apptModalOpen}
        onClose={() => setApptModalOpen(false)}
        title="Schedule Follow-up Visit"
        description={`Book an outpatient follow-up appointment for ${patient.full_name}`}
        footer={
          <>
            <Button variant="ghost" size="md" onClick={() => setApptModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={submittingAppt}
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
              Appointment Type
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
              Date & Time
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
              placeholder="e.g. Bring post-op X-rays, fasting not required..."
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
