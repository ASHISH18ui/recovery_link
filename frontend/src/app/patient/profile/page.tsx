"use client";

import React, { useEffect, useState } from "react";
import { User, Phone, Mail, Shield, KeyRound, Languages, Heart, Check, Save } from "lucide-react";
import { patientApi, PatientMe } from "@/lib/patient-api";
import { usePatient } from "../PatientContext";
import { t, Lang } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";

export default function PatientProfilePage() {
  const { lang, setLang } = usePatient();
  const [profile, setProfile] = useState<PatientMe | null>(null);
  const [emergencyContact, setEmergencyContact] = useState("");
  const [savingContact, setSavingContact] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  // Change password form
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [changingPw, setChangingPw] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  useEffect(() => {
    patientApi
      .getMe()
      .then((res) => {
        setProfile(res);
        setEmergencyContact(res.patient.emergency_contact || "");
      })
      .catch(() => {});
  }, []);

  const handleSaveEmergencyContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingContact(true);
    setContactSuccess(false);
    try {
      await patientApi.updateProfile({ emergency_contact: emergencyContact });
      setContactSuccess(true);
      setTimeout(() => setContactSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to update emergency contact");
    } finally {
      setSavingContact(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);
    if (newPw !== confirmPw) {
      setPwError("New passwords do not match");
      return;
    }
    setChangingPw(true);
    try {
      await patientApi.changePassword(currentPw, newPw);
      setPwSuccess(true);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setTimeout(() => setPwSuccess(false), 4000);
    } catch (err: any) {
      setPwError(err.message || "Failed to update password");
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t("profile", lang)}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your contact information, emergency caregiver, and portal settings.
        </p>
      </div>

      {/* Demographics Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Personal Information (Hospital Record)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Full Name</span>
            <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
              {profile?.patient.full_name || "—"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Medical Record Number (MRN)</span>
            <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
              {profile?.patient.mrn || "MRN-PENDING"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Primary Contact Phone</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {profile?.patient.phone || "—"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Date of Birth</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {profile?.patient.date_of_birth || "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Language Preference Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-purple-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Preferred Language / भाषा वरीयता
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setLang("en")}
            className={`p-3.5 rounded-2xl border text-xs font-bold transition-all ${
              lang === "en"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
            }`}
          >
            English (Default)
          </button>
          <button
            type="button"
            onClick={() => setLang("hi")}
            className={`p-3.5 rounded-2xl border text-xs font-bold transition-all ${
              lang === "hi"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
            }`}
          >
            हिन्दी (Hindi)
          </button>
        </div>
      </div>

      {/* Emergency Caregiver Form */}
      <form
        onSubmit={handleSaveEmergencyContact}
        className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Emergency Contact & Caregiver
            </h2>
          </div>
          {contactSuccess && (
            <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Saved!
            </span>
          )}
        </div>

        <p className="text-xs text-slate-500">
          This person will be reached by the hospital if critical alerts or emergency notifications are triggered.
        </p>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Caregiver Name, Relationship & Phone Number
          </label>
          <input
            type="text"
            required
            value={emergencyContact}
            onChange={(e) => setEmergencyContact(e.target.value)}
            placeholder="e.g. John Vance (Spouse) - +1 (555) 987-6543"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
          />
        </div>

        <Button
          type="submit"
          variant="secondary"
          size="md"
          isLoading={savingContact}
          iconLeft={<Save className="w-3.5 h-3.5" />}
        >
          {t("saveChanges", lang)}
        </Button>
      </form>

      {/* Change Password Form */}
      <form
        onSubmit={handleChangePassword}
        className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-purple-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t("changePassword", lang)}
            </h2>
          </div>
          {pwSuccess && (
            <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Password updated!
            </span>
          )}
        </div>

        {pwError && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">{pwError}</div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>
          </div>
        </div>

        <Button type="submit" variant="primary" size="md" isLoading={changingPw}>
          Update Password
        </Button>
      </form>

      {/* Consent & Privacy Notice */}
      <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
        <span className="font-bold block text-slate-700 dark:text-slate-300">
          Consent & Clinical Privacy Protocol
        </span>
        <p>
          Your daily check-ins are processed in compliance with hospital security standards. Information submitted is monitored by automated rules and hospital clinical staff to guide your recovery.
        </p>
      </div>
    </div>
  );
}
