"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartPulse,
  CheckCircle2,
  Check,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Thermometer,
  Pill,
  PhoneCall,
  Activity,
  Smile,
  Meh,
  Frown,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  Calendar,
  Clock
} from "lucide-react";
import { api, Checkin } from "@/lib/api";

export function PatientPortalView({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [portalInfo, setPortalInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Question Step: 1 to 6, then 7 = thank you
  const [step, setStep] = useState<number>(1);

  // Form answers
  const [painLevel, setPainLevel] = useState<number>(3);
  const [hasFever, setHasFever] = useState<boolean>(false);
  const [temperature, setTemperature] = useState<string>("");
  const [hasSwelling, setHasSwelling] = useState<boolean>(false);
  const [swellingDetails, setSwellingDetails] = useState<string>("");

  const [eatingNormally, setEatingNormally] = useState<boolean>(true);
  const [sleepingNormally, setSleepingNormally] = useState<boolean>(true);
  const [movingNormally, setMovingNormally] = useState<boolean>(true);

  const [medicationTaken, setMedicationTaken] = useState<boolean>(true);
  const [missedMedReason, setMissedMedReason] = useState<string>("");

  const [newSymptoms, setNewSymptoms] = useState<string>("");
  const [callbackRequested, setCallbackRequested] = useState<boolean>(false);
  const [callbackReason, setCallbackReason] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<any | null>(null);

  const loadPortal = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPortalInfo(token);
      setPortalInfo(data);
      if (data.already_submitted_today) {
        setStep(7); // Show today's status
      }
    } catch (err: any) {
      setError(err.message || "Invalid or expired recovery link");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadPortal();
    }
  }, [token]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        pain_level: Number(painLevel),
        has_fever: hasFever,
        temperature: hasFever && temperature ? parseFloat(temperature) : null,
        has_swelling: hasSwelling,
        swelling_details: hasSwelling ? swellingDetails : null,
        eating_normally: eatingNormally,
        sleeping_normally: sleepingNormally,
        moving_normally: movingNormally,
        medication_taken: medicationTaken,
        missed_medication_reason: !medicationTaken ? missedMedReason : null,
        new_symptoms: newSymptoms.trim() || null,
        callback_requested: callbackRequested,
        callback_reason: callbackRequested ? callbackReason : null,
      };

      const result = await api.submitCheckin(token, payload);
      setSubmittedResult(result);
      setStep(7); // Jump to Thank you screen
    } catch (err: any) {
      alert(err.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0FDFA] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-teal-800">Loading your recovery check-in...</p>
        </div>
      </div>
    );
  }

  if (error || !portalInfo) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Check-in Link Error</h2>
          <p className="text-sm text-slate-500">{error || "Unable to find patient check-in session."}</p>
        </div>
      </div>
    );
  }

  const patient = portalInfo.patient;
  const hospital = portalInfo.hospital;
  const totalQuestions = 6;
  const progressPercent = Math.min(100, Math.round(((step - 1) / totalQuestions) * 100));

  const painEmoji = () => {
    if (painLevel === 0) return { emoji: "😃", label: "No pain", color: "text-emerald-500" };
    if (painLevel <= 3) return { emoji: "🙂", label: "Mild discomfort", color: "text-teal-600" };
    if (painLevel <= 6) return { emoji: "😐", label: "Moderate pain", color: "text-amber-500" };
    if (painLevel <= 8) return { emoji: "😣", label: "Severe pain", color: "text-orange-500" };
    return { emoji: "😫", label: "Worst pain imaginable", color: "text-rose-600" };
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] flex flex-col justify-between items-center py-6 px-4 font-sans text-slate-900">
      {/* Top hospital regulatory banner & AfterCare brand */}
      <div className="w-full max-w-md flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 shadow-xs">
            <Image
              src="/logo.png"
              alt="AfterCare Logo"
              width={32}
              height={32}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-slate-900 leading-tight">
              After<span className="text-[#8B5CF6]">Care</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Patient Recovery Portal</span>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200/80 text-[11px] font-semibold text-purple-900">
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          <span className="truncate max-w-[160px]">{hospital?.name || "AfterCare Network"}</span>
        </div>
      </div>

      {/* Main Mobile App Card */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden flex flex-col min-h-[580px] relative">
        {/* Top Header & Progress */}
        {step <= totalQuestions && (
          <div className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
              <span>Daily Recovery Check-in</span>
              <span>Question {step} of {totalQuestions}</span>
            </div>
            {/* Animated Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
              <motion.div
                className="h-full bg-brand-gradient rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* Step Container with AnimatePresence */}
        <div className="p-6 flex-1 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {/* SCREEN 1: PAIN LEVEL */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    Hi {patient.full_name.split(" ")[0]}, how is your pain today?
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Rate the pain level at or near your surgical site right now.
                  </p>
                </div>

                {/* Big Visual Pain Score Display */}
                <div className="py-6 text-center rounded-2xl bg-teal-50/50 border border-teal-100 flex flex-col items-center justify-center space-y-2">
                  <div className="text-5xl animate-bounce">{painEmoji().emoji}</div>
                  <div className="text-4xl font-extrabold text-slate-900">{painLevel} / 10</div>
                  <div className={`text-sm font-bold ${painEmoji().color}`}>
                    {painEmoji().label}
                  </div>
                </div>

                {/* Slider */}
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={painLevel}
                    onChange={(e) => setPainLevel(Number(e.target.value))}
                    className="w-full h-3 bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 rounded-lg appearance-none cursor-pointer accent-teal-700"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 font-bold px-1">
                    <span>0 (None)</span>
                    <span>5 (Moderate)</span>
                    <span>10 (Severe)</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SCREEN 2: FEVER & TEMPERATURE */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    Do you have a fever or chills?
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    A fever can be an early sign of surgical site inflammation or infection.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setHasFever(false)}
                    className={`p-6 rounded-2xl border-2 text-center transition-all ${
                      !hasFever
                        ? "border-teal-600 bg-teal-50/60 shadow-md font-bold text-teal-900"
                        : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <div className="text-3xl mb-2">❄️</div>
                    <div className="text-base font-bold">No Fever</div>
                    <div className="text-xs text-slate-500 mt-1">Temperature feels normal</div>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setHasFever(true)}
                    className={`p-6 rounded-2xl border-2 text-center transition-all ${
                      hasFever
                        ? "border-rose-500 bg-rose-50/60 shadow-md font-bold text-rose-900"
                        : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <div className="text-3xl mb-2">🌡️</div>
                    <div className="text-base font-bold">Yes, Feverish</div>
                    <div className="text-xs text-slate-500 mt-1">Warm skin or shivering</div>
                  </motion.button>
                </div>

                {hasFever && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                    <label className="block text-xs font-bold text-amber-900">
                      Thermometer Reading (°C or °F, optional):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 38.3"
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                      className="w-full p-3 rounded-xl border border-amber-300 bg-white text-base font-bold text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}
              </motion.div>
            )}

            {/* SCREEN 3: SWELLING & WOUND */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    Any unusual swelling or redness?
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Check your incision dressing or surgical limb.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setHasSwelling(false)}
                    className={`p-6 rounded-2xl border-2 text-center transition-all ${
                      !hasSwelling
                        ? "border-teal-600 bg-teal-50/60 shadow-md font-bold text-teal-900"
                        : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <div className="text-3xl mb-2">🩹</div>
                    <div className="text-base font-bold">Looks Normal</div>
                    <div className="text-xs text-slate-500 mt-1">Expected healing</div>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setHasSwelling(true)}
                    className={`p-6 rounded-2xl border-2 text-center transition-all ${
                      hasSwelling
                        ? "border-rose-500 bg-rose-50/60 shadow-md font-bold text-rose-900"
                        : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <div className="text-3xl mb-2">⚠️</div>
                    <div className="text-base font-bold">Swollen / Warm</div>
                    <div className="text-xs text-slate-500 mt-1">Tense, hot or red</div>
                  </motion.button>
                </div>

                {hasSwelling && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Describe the swelling or discharge (optional):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Calf is tight, knee feels hot..."
                      value={swellingDetails}
                      onChange={(e) => setSwellingDetails(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                )}
              </motion.div>
            )}

            {/* SCREEN 4: DAILY ACTIVITIES */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    How are your daily activities?
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Tap to toggle anything you are having trouble with today.
                  </p>
                </div>

                <div className="space-y-3">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setMovingNormally(!movingNormally)}
                    className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between text-left transition-all ${
                      movingNormally
                        ? "border-teal-600 bg-teal-50/40 text-teal-900"
                        : "border-amber-400 bg-amber-50/50 text-amber-900"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm">🚶 Moving & Walking</div>
                      <div className="text-xs text-slate-500">
                        {movingNormally ? "Mobilizing as instructed" : "Difficulty moving / limited mobility"}
                      </div>
                    </div>
                    <span className="text-xl">{movingNormally ? "✅" : "⚠️"}</span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setSleepingNormally(!sleepingNormally)}
                    className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between text-left transition-all ${
                      sleepingNormally
                        ? "border-teal-600 bg-teal-50/40 text-teal-900"
                        : "border-amber-400 bg-amber-50/50 text-amber-900"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm">😴 Sleep Quality</div>
                      <div className="text-xs text-slate-500">
                        {sleepingNormally ? "Rested normally" : "Sleep interrupted by pain / discomfort"}
                      </div>
                    </div>
                    <span className="text-xl">{sleepingNormally ? "✅" : "⚠️"}</span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setEatingNormally(!eatingNormally)}
                    className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between text-left transition-all ${
                      eatingNormally
                        ? "border-teal-600 bg-teal-50/40 text-teal-900"
                        : "border-amber-400 bg-amber-50/50 text-amber-900"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm">🥣 Eating & Hydration</div>
                      <div className="text-xs text-slate-500">
                        {eatingNormally ? "Eating and drinking liquids well" : "Nausea or poor appetite"}
                      </div>
                    </div>
                    <span className="text-xl">{eatingNormally ? "✅" : "⚠️"}</span>
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* SCREEN 5: MEDICATIONS */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    Did you take your prescribed medications?
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Taking antibiotics, pain relievers, and blood thinners on time is vital for safe healing.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setMedicationTaken(true)}
                    className={`p-6 rounded-2xl border-2 text-center transition-all ${
                      medicationTaken
                        ? "border-teal-600 bg-teal-50/60 shadow-md font-bold text-teal-900"
                        : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <div className="text-3xl mb-2">💊</div>
                    <div className="text-base font-bold">All Taken</div>
                    <div className="text-xs text-slate-500 mt-1">As prescribed</div>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setMedicationTaken(false)}
                    className={`p-6 rounded-2xl border-2 text-center transition-all ${
                      !medicationTaken
                        ? "border-amber-500 bg-amber-50/60 shadow-md font-bold text-amber-900"
                        : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <div className="text-3xl mb-2">⏰</div>
                    <div className="text-base font-bold">Missed a Dose</div>
                    <div className="text-xs text-slate-500 mt-1">Skipped or delayed</div>
                  </motion.button>
                </div>

                {!medicationTaken && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                    <label className="block text-xs font-bold text-amber-900">
                      Why did you miss your medication?
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {["Felt nauseous", "Pain was gone", "Forgot dose", "Ran out"].map((reason) => (
                        <button
                          key={reason}
                          type="button"
                          onClick={() => setMissedMedReason(reason)}
                          className={`p-2 rounded-xl border text-center transition-all ${
                            missedMedReason === reason
                              ? "bg-amber-600 text-white font-bold border-amber-600 shadow-xs"
                              : "bg-white border-amber-200 text-amber-900 hover:border-amber-300"
                          }`}
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* SCREEN 6: NURSE CALLBACK & REVIEW */}
            {step === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    Would you like a nurse to call you?
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Your care team can answer medication questions or address any concerns.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setCallbackRequested(false)}
                    className={`p-4 rounded-2xl border-2 text-center transition-all ${
                      !callbackRequested
                        ? "border-teal-600 bg-teal-50/60 shadow-md font-bold text-teal-900"
                        : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <div className="text-2xl mb-1">👍</div>
                    <div className="text-sm font-bold">No, I'm Good</div>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setCallbackRequested(true)}
                    className={`p-4 rounded-2xl border-2 text-center transition-all ${
                      callbackRequested
                        ? "border-teal-600 bg-teal-50/60 shadow-md font-bold text-teal-900"
                        : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <div className="text-2xl mb-1">📞</div>
                    <div className="text-sm font-bold">Yes, Please Call</div>
                  </motion.button>
                </div>

                {callbackRequested && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      What would you like to discuss with the nurse?
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Pain medication timing, bandage question..."
                      value={callbackReason}
                      onChange={(e) => setCallbackReason(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Any new or unusual symptoms today? (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe any new changes..."
                    value={newSymptoms}
                    onChange={(e) => setNewSymptoms(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </motion.div>
            )}

            {/* SCREEN 7: THANK YOU & AI SUMMARY */}
            {step === 7 && (
              <motion.div
                key="step7"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 text-center py-4"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Check-in Completed!
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Thank you {patient.full_name.split(" ")[0]}. Your clinical care team at {hospital?.name || "the hospital"} has received your update.
                  </p>
                </div>

                {/* AI Summary Card */}
                {submittedResult?.ai_summary && (
                  <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-left space-y-2">
                    <div className="flex items-center justify-between text-xs text-teal-800 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-teal-600" />
                        AI Recovery Summary
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {submittedResult.ai_summary}
                    </p>
                    <div className="pt-2 border-t border-teal-200/80 text-[10px] text-teal-800 font-medium italic">
                      "AI-generated summary. Clinician review required. The AI summarises and flags; the clinician decides. No medical advice."
                    </div>
                  </div>
                )}

                {/* Immediate Red Flag Emergency Guidance */}
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-left text-xs text-rose-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-700">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Emergency Warning Signs:</span>
                  </div>
                  <p className="text-[11px] text-rose-800 leading-relaxed">
                    If you experience sudden shortness of breath, chest pain, uncontrollable bleeding, or severe fainting, call 911 or go to the nearest emergency department immediately.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Navigation Buttons */}
          {step <= totalQuestions && (
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              ) : (
                <div />
              )}

              {step < totalQuestions ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  className="px-6 py-2.5 rounded-xl bg-brand-gradient text-white text-xs font-bold hover:opacity-95 transition-opacity shadow-md flex items-center gap-1.5 ml-auto"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSubmit}
                  className="px-6 py-2.5 rounded-xl bg-brand-gradient text-white text-xs font-bold hover:opacity-95 transition-opacity shadow-md flex items-center gap-1.5 ml-auto disabled:opacity-50"
                >
                  {submitting ? "Sending to Clinician..." : "Submit Daily Check-in"}
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Disclaimer */}
      <footer className="w-full max-w-md text-center text-[10px] text-slate-400 mt-4 leading-normal">
        Illustrative workflow; clinical instructions must be customised and approved by the hospital.
      </footer>
    </div>
  );
}
