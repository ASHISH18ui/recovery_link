"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Camera,
  Heart,
  Sparkles,
  Info,
  Calendar,
  Check
} from "lucide-react";
import { patientApi, PatientCheckinPayload } from "@/lib/patient-api";
import { usePatient } from "../PatientContext";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

const MOODS = [
  { val: "great", label: "Great", emoji: "😄" },
  { val: "good", label: "Good", emoji: "🙂" },
  { val: "ok", label: "Okay", emoji: "😐" },
  { val: "low", label: "Low energy", emoji: "😔" },
  { val: "bad", label: "In distress", emoji: "😫" },
];

const WOUND_OPTIONS = [
  { val: "healing_well", label: "Clean, dry, and healing well" },
  { val: "mild_redness", label: "Mild redness around incision" },
  { val: "warmth_swelling", label: "Warm to touch or noticeable swelling" },
  { val: "drainage", label: "Fluid leakage or yellow drainage" },
];

export default function PatientCheckInWizardPage() {
  const router = useRouter();
  const { lang } = usePatient();

  const [checkingToday, setCheckingToday] = useState(true);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [todayData, setTodayData] = useState<any>(null);

  // Wizard state: 1 to 11
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 11;

  // Form State
  const [painLevel, setPainLevel] = useState(2);
  const [hasFever, setHasFever] = useState(false);
  const [temperature, setTemperature] = useState<number | undefined>(undefined);
  const [hasSwelling, setHasSwelling] = useState(false);
  const [swellingDetails, setSwellingDetails] = useState("");
  const [woundStatus, setWoundStatus] = useState("healing_well");
  const [breathingDifficulty, setBreathingDifficulty] = useState(false);
  const [eatingNormally, setEatingNormally] = useState(true);
  const [sleepingNormally, setSleepingNormally] = useState(true);
  const [movingNormally, setMovingNormally] = useState(true);
  const [newSymptoms, setNewSymptoms] = useState("");
  const [mood, setMood] = useState("good");
  const [medicationTaken, setMedicationTaken] = useState(true);
  const [missedReason, setMissedReason] = useState("");

  // Optional Vitals
  const [vitalTemp, setVitalTemp] = useState<number | undefined>(undefined);
  const [vitalSys, setVitalSys] = useState<number | undefined>(undefined);
  const [vitalDia, setVitalDia] = useState<number | undefined>(undefined);
  const [vitalPulse, setVitalPulse] = useState<number | undefined>(undefined);
  const [vitalSpo2, setVitalSpo2] = useState<number | undefined>(undefined);
  const [vitalWeight, setVitalWeight] = useState<number | undefined>(undefined);
  const [vitalSugar, setVitalSugar] = useState<number | undefined>(undefined);

  // Photo
  const [photoB64, setPhotoB64] = useState<string | undefined>(undefined);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    patientApi
      .getTodayCheckin()
      .then((res) => {
        if (res.checked_in) {
          setAlreadyDone(true);
          setTodayData(res.checkin);
        }
      })
      .catch(() => {})
      .finally(() => setCheckingToday(false));
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      alert("Please select an image smaller than 1MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoB64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    const payload: PatientCheckinPayload = {
      pain_level: painLevel,
      has_fever: hasFever,
      temperature: temperature || vitalTemp,
      has_swelling: hasSwelling,
      swelling_details: swellingDetails,
      wound_status: woundStatus,
      breathing_difficulty: breathingDifficulty,
      eating_normally: eatingNormally,
      sleeping_normally: sleepingNormally,
      moving_normally: movingNormally,
      new_symptoms: newSymptoms,
      mood: mood,
      medication_taken: medicationTaken,
      missed_medication_reason: missedReason,
      vital_temperature: vitalTemp,
      vital_systolic_bp: vitalSys,
      vital_diastolic_bp: vitalDia,
      vital_pulse: vitalPulse,
      vital_spo2: vitalSpo2,
      vital_weight_kg: vitalWeight,
      vital_blood_sugar: vitalSugar,
      site_photo_b64: photoB64,
    };

    try {
      const res = await patientApi.submitCheckin(payload);
      setSubmissionResult(res);
      setAlreadyDone(true);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit check-in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingToday) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-6 w-48 rounded-full" />
        <Skeleton className="h-3 w-full rounded-full" />
        <div className="p-8 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse h-96" />
      </div>
    );
  }

  // If already done today and not currently showing fresh submission result
  if (alreadyDone && !submissionResult) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {t("checkinDone", lang)}!
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              You have already logged your recovery report for today. Your care team can see your progress.
            </p>
          </div>

          {todayData && (
            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-left space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300">
                  AI Summary of Your Status
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 font-bold capitalize text-slate-700 dark:text-slate-300">
                  Risk: {todayData.ai_risk_level}
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                {todayData.ai_summary}
              </p>
              <div className="text-[10px] text-slate-400 italic pt-1 border-t border-purple-200/50">
                {todayData.disclaimer || "AI-generated summary. Clinician review required."}
              </div>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setAlreadyDone(false);
                setCurrentStep(1);
              }}
            >
              {t("editCheckin", lang)}
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => router.push("/patient/home")}
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Submission Success Screen
  if (submissionResult) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Thank You! Check-in Received
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Your recovery responses have been recorded and evaluated by our clinical monitoring system.
            </p>
          </div>

          {/* AI Summary Banner */}
          <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-left space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wide">
                Evaluation Summary
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
              {submissionResult.ai_summary}
            </p>
            <p className="text-[10px] text-slate-400 italic pt-1 border-t border-purple-100 dark:border-purple-900">
              AI-generated summary. Clinician review required.
            </p>
          </div>

          {/* Warning Banner if care team was notified */}
          {submissionResult.care_team_notified && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-left flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                  Your care team has been notified
                </span>
                <span className="text-[11px] text-amber-700 dark:text-amber-300">
                  Based on your responses, an alert has been flagged for your attending surgical nurse or doctor to review. If your symptoms worsen, call hospital helpline immediately.
                </span>
              </div>
            </div>
          )}

          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push("/patient/home")}
              className="w-full sm:w-auto"
            >
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getPainEmoji = (level: number) => {
    if (level === 0) return "😄 Zero Pain";
    if (level <= 2) return "🙂 Mild Discomfort";
    if (level <= 4) return "😐 Moderate Ache";
    if (level <= 6) return "😣 Distracting Pain";
    if (level <= 8) return "😫 Severe Pain";
    return "🚨 Extreme / Unbearable";
  };

  const getPainColor = (level: number) => {
    if (level <= 3) return "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200";
    if (level <= 6) return "text-amber-600 bg-amber-50 dark:bg-amber-950/50 border-amber-200";
    return "text-rose-600 bg-rose-50 dark:bg-rose-950/50 border-rose-200";
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header & Step progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>{t("dailyCheckin", lang)}</span>
          <span>
            Question {currentStep} of {totalSteps}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {submitError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 text-xs">
          {submitError}
        </div>
      )}

      {/* Screen Container with big touch targets */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm min-h-[400px] flex flex-col justify-between">
        {/* Step 1: Pain Level */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
                Step 1: Pain Assessment
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {t("painLevel", lang)} (0 to 10)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Where 0 is completely pain-free and 10 is unbearable pain.
              </p>
            </div>

            <div className="space-y-6 py-4">
              <div
                className={`p-5 rounded-2xl border text-center font-bold text-lg ${getPainColor(
                  painLevel
                )}`}
              >
                <div className="text-4xl font-extrabold mb-1">{painLevel} / 10</div>
                <div className="text-sm font-semibold">{getPainEmoji(painLevel)}</div>
              </div>

              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={painLevel}
                onChange={(e) => setPainLevel(parseInt(e.target.value))}
                className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />

              <div className="flex justify-between text-xs text-slate-400 font-medium px-1">
                <span>0 (No Pain)</span>
                <span>5 (Moderate)</span>
                <span>10 (Severe)</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Fever & Temperature */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
                Step 2: Temperature
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {t("doYouHaveFever", lang)}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                A body temperature above 38.0°C (100.4°F) is considered a fever.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4">
              <button
                type="button"
                onClick={() => setHasFever(false)}
                className={`p-5 rounded-2xl border text-center font-bold text-sm sm:text-base transition-all ${
                  !hasFever
                    ? "bg-purple-600 text-white shadow-md scale-102"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200"
                }`}
              >
                No Fever
              </button>
              <button
                type="button"
                onClick={() => setHasFever(true)}
                className={`p-5 rounded-2xl border text-center font-bold text-sm sm:text-base transition-all ${
                  hasFever
                    ? "bg-rose-600 text-white shadow-md scale-102"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200"
                }`}
              >
                Yes, I have a fever
              </button>
            </div>

            {hasFever && (
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("temperature", lang)}
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="38.2"
                  value={temperature || ""}
                  onChange={(e) => setTemperature(parseFloat(e.target.value) || undefined)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 3: Swelling */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
                Step 3: Swelling
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {t("swelling", lang)}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Check for puffiness, tightness, or fluid buildup near the incision.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4">
              <button
                type="button"
                onClick={() => setHasSwelling(false)}
                className={`p-5 rounded-2xl border text-center font-bold text-sm sm:text-base transition-all ${
                  !hasSwelling
                    ? "bg-purple-600 text-white shadow-md scale-102"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200"
                }`}
              >
                No Swelling
              </button>
              <button
                type="button"
                onClick={() => setHasSwelling(true)}
                className={`p-5 rounded-2xl border text-center font-bold text-sm sm:text-base transition-all ${
                  hasSwelling
                    ? "bg-amber-600 text-white shadow-md scale-102"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200"
                }`}
              >
                Yes, noticeable swelling
              </button>
            </div>

            {hasSwelling && (
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Where is the swelling located?
                </label>
                <input
                  type="text"
                  placeholder="e.g. Around the lower calf and ankle"
                  value={swellingDetails}
                  onChange={(e) => setSwellingDetails(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 4: Wound / Surgical Site */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
                Step 4: Surgical Site
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {t("woundStatus", lang)}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Select the description that best fits the appearance of your incision.
              </p>
            </div>

            <div className="space-y-3 py-2">
              {WOUND_OPTIONS.map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setWoundStatus(opt.val)}
                  className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm font-semibold flex items-center justify-between transition-all ${
                    woundStatus === opt.val
                      ? "border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 shadow-xs"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                  }`}
                >
                  <span>{opt.label}</span>
                  {woundStatus === opt.val && <Check className="w-4 h-4 text-purple-600" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Breathing Difficulty */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
                Step 5: Respiratory
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {t("breathingDifficulty", lang)}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Shortness of breath or chest discomfort while resting or walking.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 py-6">
              <button
                type="button"
                onClick={() => setBreathingDifficulty(false)}
                className={`p-6 rounded-2xl border text-center font-bold text-sm sm:text-base transition-all ${
                  !breathingDifficulty
                    ? "bg-purple-600 text-white shadow-md scale-102"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200"
                }`}
              >
                No, breathing easily
              </button>
              <button
                type="button"
                onClick={() => setBreathingDifficulty(true)}
                className={`p-6 rounded-2xl border text-center font-bold text-sm sm:text-base transition-all ${
                  breathingDifficulty
                    ? "bg-rose-600 text-white shadow-md scale-102"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200"
                }`}
              >
                Yes, shortness of breath
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Daily Function (Eating, Sleeping, Mobility) */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
                Step 6: Daily Activities
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                Eating, Sleeping & Mobility
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Confirm your baseline functions today.
              </p>
            </div>

            <div className="space-y-3.5 py-2">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                  {t("eating", lang)}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEatingNormally(true)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      eatingNormally ? "bg-emerald-600 text-white" : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEatingNormally(false)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      !eatingNormally ? "bg-amber-600 text-white" : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                  {t("sleeping", lang)}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSleepingNormally(true)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      sleepingNormally ? "bg-emerald-600 text-white" : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setSleepingNormally(false)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      !sleepingNormally ? "bg-amber-600 text-white" : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                  {t("mobility", lang)}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMovingNormally(true)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      movingNormally ? "bg-emerald-600 text-white" : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovingNormally(false)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      !movingNormally ? "bg-amber-600 text-white" : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 7: New or Worsening Symptoms */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
                Step 7: Other Symptoms
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {t("newSymptoms", lang)}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Optional: note any nausea, dizziness, calf cramps, or changes in how you feel.
              </p>
            </div>

            <div className="py-2">
              <textarea
                rows={5}
                value={newSymptoms}
                onChange={(e) => setNewSymptoms(e.target.value)}
                placeholder="Type here if you noticed any unusual symptoms..."
                className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
              />
            </div>
          </div>
        )}

        {/* Step 8: Mood */}
        {currentStep === 8 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
                Step 8: Emotional Wellbeing
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {t("mood", lang)}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Recovery affects the mind as much as the body. Let us know how you are holding up.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 py-4">
              {MOODS.map((m) => (
                <button
                  key={m.val}
                  type="button"
                  onClick={() => setMood(m.val)}
                  className={`p-5 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                    mood === m.val
                      ? "border-purple-600 bg-purple-50 dark:bg-purple-950/40 shadow-xs scale-102"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-3xl sm:text-4xl">{m.emoji}</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    {m.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 9: Medications Taken */}
        {currentStep === 9 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
                Step 9: Medications
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {t("medicationTaken", lang)}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Adherence to your prescribed antibiotics, pain relievers, and blood thinners is critical.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4">
              <button
                type="button"
                onClick={() => setMedicationTaken(true)}
                className={`p-6 rounded-2xl border text-center font-bold text-sm sm:text-base transition-all ${
                  medicationTaken
                    ? "bg-purple-600 text-white shadow-md scale-102"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200"
                }`}
              >
                Yes, took all meds
              </button>
              <button
                type="button"
                onClick={() => setMedicationTaken(false)}
                className={`p-6 rounded-2xl border text-center font-bold text-sm sm:text-base transition-all ${
                  !medicationTaken
                    ? "bg-amber-600 text-white shadow-md scale-102"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200"
                }`}
              >
                Missed some medications
              </button>
            </div>

            {!medicationTaken && (
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Reason for missed medication
                </label>
                <input
                  type="text"
                  placeholder="e.g. Caused stomach nausea / ran out of pills"
                  value={missedReason}
                  onChange={(e) => setMissedReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 10: Optional Vitals Readings */}
        {currentStep === 10 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
                Step 10: Optional Vitals
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {t("optionalVitals", lang)}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                If you have home monitoring devices, enter your readings below. Otherwise, feel free to skip.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Temp (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="36.8"
                  value={vitalTemp || ""}
                  onChange={(e) => setVitalTemp(parseFloat(e.target.value) || undefined)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Blood Pressure (Sys/Dia)
                </label>
                <div className="flex gap-1 items-center">
                  <input
                    type="number"
                    placeholder="120"
                    value={vitalSys || ""}
                    onChange={(e) => setVitalSys(parseInt(e.target.value) || undefined)}
                    className="w-full px-2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-center font-medium"
                  />
                  <span>/</span>
                  <input
                    type="number"
                    placeholder="80"
                    value={vitalDia || ""}
                    onChange={(e) => setVitalDia(parseInt(e.target.value) || undefined)}
                    className="w-full px-2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-center font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Pulse (BPM)
                </label>
                <input
                  type="number"
                  placeholder="72"
                  value={vitalPulse || ""}
                  onChange={(e) => setVitalPulse(parseInt(e.target.value) || undefined)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  SpO2 (%)
                </label>
                <input
                  type="number"
                  placeholder="98"
                  value={vitalSpo2 || ""}
                  onChange={(e) => setVitalSpo2(parseFloat(e.target.value) || undefined)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="70.5"
                  value={vitalWeight || ""}
                  onChange={(e) => setVitalWeight(parseFloat(e.target.value) || undefined)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Blood Sugar (mg/dL)
                </label>
                <input
                  type="number"
                  placeholder="105"
                  value={vitalSugar || ""}
                  onChange={(e) => setVitalSugar(parseFloat(e.target.value) || undefined)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 11: Optional Site Photo Upload */}
        {currentStep === 11 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
                Step 11: Photo (Optional)
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {t("optionalPhoto", lang)}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                A clear photo helps your doctor evaluate incision healing without requiring an in-clinic visit.
              </p>
            </div>

            <div className="py-2 space-y-4">
              <label className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-purple-50/20 transition-all">
                <Camera className="w-10 h-10 text-purple-600 mb-2" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Tap to take or choose surgical site photo
                </span>
                <span className="text-xs text-slate-400 mt-1">PNG, JPG up to 1MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>

              {photoB64 && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={photoB64}
                      alt="Site preview"
                      className="w-14 h-14 object-cover rounded-xl border"
                    />
                    <span className="text-xs font-bold text-emerald-600">Photo ready to upload</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPhotoB64(undefined)}
                    className="text-xs text-rose-500 font-bold hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          {currentStep > 1 ? (
            <Button
              variant="secondary"
              size="md"
              onClick={() => setCurrentStep(currentStep - 1)}
              iconLeft={<ArrowLeft className="w-4 h-4" />}
            >
              {t("back", lang)}
            </Button>
          ) : (
            <div />
          )}

          {currentStep < totalSteps ? (
            <Button
              variant="primary"
              size="md"
              onClick={() => setCurrentStep(currentStep + 1)}
              iconRight={<ArrowRight className="w-4 h-4" />}
            >
              {t("continue", lang)}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              isLoading={submitting}
              onClick={handleSubmit}
              iconRight={<CheckCircle2 className="w-4 h-4" />}
            >
              {t("submitCheckin", lang)}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
