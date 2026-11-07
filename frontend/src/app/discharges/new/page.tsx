"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  Plus,
  Trash2,
  CheckCircle2,
  Copy,
  ExternalLink,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Calendar,
  Pill,
  User as UserIcon,
  Stethoscope,
  Clock,
  Check,
  Send,
  ShieldCheck
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { api, User, CarePlanTemplate } from "@/lib/api";

export default function NewDischargePage() {
  const router = useRouter();
  const toast = useToast();
  const [doctors, setDoctors] = useState<User[]>([]);
  const [templates, setTemplates] = useState<CarePlanTemplate[]>([]);
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [loading, setLoading] = useState(false);

  // Form Fields - Step 1: Patient Demographics
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("+1 (555) 789-2345");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("1970-05-15");
  const [gender, setGender] = useState("Male");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [mrn, setMrn] = useState(`MRN-${Math.floor(10000 + Math.random() * 90000)}`);

  // Step 2: Surgery & Diagnosis
  const [diagnosis, setDiagnosis] = useState("Severe Osteoarthritis, Right Knee");
  const [procedure, setProcedure] = useState("Right Total Knee Arthroplasty (TKA)");
  const [treatingDoctorId, setTreatingDoctorId] = useState("");

  // Step 3: Medications
  const [medications, setMedications] = useState([
    { name: "Enoxaparin", dosage: "40mg", frequency: "Daily subcutaneous", purpose: "DVT Prophylaxis" },
    { name: "Acetaminophen / Oxycodone", dosage: "325/5mg", frequency: "q4-6h prn", purpose: "Breakthrough Pain" },
    { name: "Cephalexin", dosage: "500mg", frequency: "q6h for 7 days", purpose: "Infection Prevention" },
  ]);

  // Step 4: Follow-up & Instructions
  const [followUpDate, setFollowUpDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [dailyDueTime, setDailyDueTime] = useState("09:00");
  const [instructions, setInstructions] = useState(
    "Ice knee for 20 minutes every 2 hours. Keep incision dry. Ambulatory with walker. Report fever > 38.0°C or sudden calf pain immediately."
  );

  // Success Modal State
  const [createdResult, setCreatedResult] = useState<any | null>(null);

  useEffect(() => {
    Promise.all([api.getDoctors(), api.getTemplates().catch(() => [])])
      .then(([docs, tmpls]) => {
        setDoctors(docs);
        if (docs.length > 0) setTreatingDoctorId(docs[0].id);
        setTemplates(tmpls);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleApplyTemplate = (tmpl: CarePlanTemplate) => {
    setProcedure(tmpl.name);
    setInstructions(tmpl.default_instructions || "");
    try {
      const parsedMeds = JSON.parse(tmpl.suggested_medications);
      if (Array.isArray(parsedMeds) && parsedMeds.length > 0) {
        setMedications(parsedMeds);
      }
    } catch {}
    toast.success(`Applied protocol: ${tmpl.name}`, "Template Loaded");
  };

  const addMedication = () => {
    setMedications([...medications, { name: "", dosage: "", frequency: "", purpose: "" }]);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const updateMedication = (index: number, field: string, val: string) => {
    const updated = [...medications];
    (updated[index] as any)[field] = val;
    setMedications(updated);
  };

  // Validation
  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      if (!fullName.trim() || !phone.trim() || !dob) {
        toast.error("Please fill in patient name, phone, and date of birth.");
        return false;
      }
    }
    if (currentStep === 2) {
      if (!diagnosis.trim() || !procedure.trim() || !treatingDoctorId) {
        toast.error("Please complete diagnosis, procedure, and assign treating doctor.");
        return false;
      }
    }
    if (currentStep === 3) {
      if (medications.some((m) => !m.name.trim() || !m.dosage.trim())) {
        toast.error("Please provide name and dosage for all listed medications.");
        return false;
      }
    }
    if (currentStep === 4) {
      if (!instructions.trim()) {
        toast.error("Please provide discharge instructions.");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => (prev < 5 ? ((prev + 1) as any) : prev));
    }
  };

  const handlePrev = () => {
    setStep((prev) => (prev > 1 ? ((prev - 1) as any) : prev));
  };

  const handleSubmitDischarge = async () => {
    setLoading(true);
    try {
      const payload = {
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        date_of_birth: dob,
        gender,
        emergency_contact: emergencyContact.trim() || undefined,
        mrn: mrn.trim() || undefined,
        diagnosis,
        surgical_procedure: procedure,
        treating_doctor_id: treatingDoctorId,
        discharge_instructions: instructions,
        follow_up_date: followUpDate ? new Date(followUpDate).toISOString() : undefined,
        medications: medications.filter((m) => m.name.trim().length > 0),
      };

      const result = await api.createDischarge(payload);
      setCreatedResult(result);
      toast.success("Patient discharge care plan activated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to discharge patient");
    } finally {
      setLoading(false);
    }
  };

  const copySimulatedWhatsApp = () => {
    if (!createdResult) return;
    navigator.clipboard.writeText(createdResult.simulated_message);
    toast.success("WhatsApp message copied to clipboard");
  };

  const copyLink = () => {
    if (!createdResult) return;
    const url = `${window.location.origin}/check-in/${createdResult.patient_token}`;
    navigator.clipboard.writeText(url);
    toast.success("Secure check-in link copied");
  };

  const stepsHeader = [
    { num: 1, label: "Patient" },
    { num: 2, label: "Surgery" },
    { num: 3, label: "Medications" },
    { num: 4, label: "Follow-up" },
    { num: 5, label: "Review" },
  ];

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Discharge & Care Plan Enrollment
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Enroll surgical patient into post-discharge daily surveillance
            </p>
          </div>
          <Link href="/patients">
            <Button variant="ghost" size="sm">
              Cancel
            </Button>
          </Link>
        </div>

        {/* Step Indicator Bar */}
        <div className="grid grid-cols-5 gap-2">
          {stepsHeader.map((s) => (
            <div key={s.num} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s.num
                    ? "bg-brand-gradient text-white shadow-md scale-105"
                    : step > s.num
                    ? "bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200"
                    : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                }`}
              >
                {step > s.num ? <Check className="w-4 h-4" /> : s.num}
              </div>
              <span
                className={`text-[11px] font-medium mt-1.5 transition-colors ${
                  step === s.num
                    ? "text-teal-600 dark:text-teal-400 font-bold"
                    : "text-slate-400"
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Form Container */}
        <Card>
          <CardContent className="p-6 sm:p-8">
            {/* STEP 1: PATIENT DEMOGRAPHICS */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Step 1: Patient Demographics & Contact
                  </h3>
                  <p className="text-xs text-slate-500">
                    Patient will receive SMS/WhatsApp recovery invitations at this contact.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Full Legal Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Arthur Conan"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Medical Record Number (MRN) *
                    </label>
                    <input
                      type="text"
                      required
                      value={mrn}
                      onChange={(e) => setMrn(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Mobile / WhatsApp Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Emergency Contact Person & Phone
                    </label>
                    <input
                      type="text"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      placeholder="e.g. Mary Conan (Wife) +1 (555) 123-4567"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: SURGERY & DIAGNOSIS */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Step 2: Surgical Procedure & Care Pathway
                  </h3>
                  <p className="text-xs text-slate-500">
                    Select a hospital care-plan template or customize surgical diagnosis.
                  </p>
                </div>

                {/* Templates preset buttons */}
                {templates.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                      Load Standard Protocol Template:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {templates.map((tmpl) => (
                        <button
                          key={tmpl.id}
                          type="button"
                          onClick={() => handleApplyTemplate(tmpl)}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-teal-500 dark:hover:border-teal-400 transition-colors"
                        >
                          ⚡ {tmpl.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Primary Diagnosis *
                    </label>
                    <input
                      type="text"
                      required
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Surgical Procedure Performed *
                    </label>
                    <input
                      type="text"
                      required
                      value={procedure}
                      onChange={(e) => setProcedure(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Attending Treating Surgeon / Doctor *
                    </label>
                    <select
                      value={treatingDoctorId}
                      onChange={(e) => setTreatingDoctorId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.full_name} ({d.department})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: MEDICATIONS */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      Step 3: Discharge Medication Regimen
                    </h3>
                    <p className="text-xs text-slate-500">
                      The patient will be asked about these medications in their daily check-in.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={addMedication}
                    iconLeft={<Plus className="w-3.5 h-3.5" />}
                  >
                    Add Med
                  </Button>
                </div>

                <div className="space-y-3">
                  {medications.map((med, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-teal-700 dark:text-teal-300">
                          Medication #{idx + 1}
                        </span>
                        {medications.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMedication(idx)}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <input
                          type="text"
                          placeholder="Name (e.g. Enoxaparin)"
                          value={med.name}
                          onChange={(e) => updateMedication(idx, "name", e.target.value)}
                          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                        />
                        <input
                          type="text"
                          placeholder="Dosage (e.g. 40mg)"
                          value={med.dosage}
                          onChange={(e) => updateMedication(idx, "dosage", e.target.value)}
                          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                        />
                        <input
                          type="text"
                          placeholder="Frequency (e.g. Daily morning)"
                          value={med.frequency}
                          onChange={(e) => updateMedication(idx, "frequency", e.target.value)}
                          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                        />
                      </div>

                      <input
                        type="text"
                        placeholder="Purpose (e.g. DVT Prophylaxis, breakthrough analgesia)"
                        value={med.purpose}
                        onChange={(e) => updateMedication(idx, "purpose", e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 4: FOLLOW-UP & INSTRUCTIONS */}
            {step === 4 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Step 4: Follow-up & Clinical Instructions
                  </h3>
                  <p className="text-xs text-slate-500">
                    Set the schedule for clinical follow-up and daily check-in notification time.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      First Follow-up Clinic Date
                    </label>
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Daily Check-in Due Time
                    </label>
                    <input
                      type="time"
                      value={dailyDueTime}
                      onChange={(e) => setDailyDueTime(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Patient Discharge Instructions
                  </label>
                  <textarea
                    rows={4}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed"
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 5: REVIEW & CONFIRM */}
            {step === 5 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Step 5: Review & Activate Monitoring
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verify patient details and surgical protocol before dispatching enrollment.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 block font-medium">Patient</span>
                      <span className="font-semibold text-slate-900 dark:text-white text-sm">{fullName}</span>
                      <div className="text-slate-500">MRN: {mrn} • {phone}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Surgical Procedure</span>
                      <span className="font-semibold text-slate-900 dark:text-white text-sm">{procedure}</span>
                      <div className="text-slate-500">Diagnosis: {diagnosis}</div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block font-medium mb-1.5">
                      Medication Regimen ({medications.length} items):
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300">
                      {medications.map((m, idx) => (
                        <li key={idx}>
                          <strong>{m.name}</strong> - {m.dosage} ({m.frequency})
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block font-medium mb-1">
                      Scheduled Follow-up Date:
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {followUpDate} (Check-ins prompt daily at {dailyDueTime})
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Navigation buttons */}
            <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              {step > 1 ? (
                <Button variant="secondary" size="md" onClick={handlePrev} iconLeft={<ArrowLeft className="w-4 h-4" />}>
                  Previous
                </Button>
              ) : (
                <div />
              )}

              {step < 5 ? (
                <Button variant="primary" size="md" onClick={handleNext} iconRight={<ArrowRight className="w-4 h-4" />}>
                  Next: {stepsHeader[step].label}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  isLoading={loading}
                  onClick={handleSubmitDischarge}
                  iconRight={<CheckCircle2 className="w-4 h-4" />}
                >
                  Activate & Dispatch Enrollment
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Simulated WhatsApp Preview Modal */}
      <Modal
        isOpen={!!createdResult}
        onClose={() => router.push(`/patients/${createdResult?.patient_id}`)}
        title="Discharge Enrolled Successfully!"
        description="Simulated patient onboarding message generated. Preview WhatsApp message below:"
        maxWidth="md"
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={copySimulatedWhatsApp}
              iconLeft={<Copy className="w-4 h-4" />}
            >
              Copy WhatsApp Text
            </Button>
            <Link href={`/check-in/${createdResult?.patient_token}`} target="_blank">
              <Button
                variant="primary"
                size="md"
                iconRight={<ExternalLink className="w-4 h-4" />}
              >
                Test Patient Portal
              </Button>
            </Link>
          </>
        }
      >
        {createdResult && (
          <div className="space-y-4">
            {/* WhatsApp simulated bubble */}
            <div className="p-4 rounded-2xl bg-[#EFEAE2] dark:bg-[#1C2431] border border-slate-200 dark:border-slate-700 shadow-inner">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    AfterCare Navigator
                  </div>
                  <div className="text-[10px] text-slate-500">Official Hospital Outreach • WhatsApp</div>
                </div>
              </div>

              {/* Chat bubble */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#202C33] shadow-xs text-xs text-slate-800 dark:text-slate-100 space-y-2 whitespace-pre-wrap leading-relaxed">
                {createdResult.simulated_message}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <div className="min-w-0">
                <span className="text-slate-400 block font-medium">Access Token:</span>
                <code className="font-mono text-teal-600 dark:text-teal-400 font-bold truncate block">
                  {createdResult.patient_token}
                </code>
              </div>
              <Button variant="ghost" size="sm" onClick={copyLink} iconLeft={<Copy className="w-3.5 h-3.5" />}>
                Copy Link
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
