"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  HeartPulse,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  TrendingUp,
  Activity,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("dr.chen@recoverlink.com");
  const [password, setPassword] = useState("doctor123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid clinical credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const setDemoUser = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setError(null);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F6F8FB] dark:bg-[#090D16] text-slate-900 dark:text-slate-100">
      {/* Left Pitch Panel (Gradient with floating glass cards) */}
      <div className="lg:w-1/2 relative bg-brand-gradient p-8 lg:p-16 flex flex-col justify-between overflow-hidden text-white">
        {/* Ambient glow circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-blue-900/20 blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-teal-200" />
            <span>AI-Assisted Clinical Monitoring</span>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <div className="w-12 h-12 rounded-2xl bg-white text-teal-600 flex items-center justify-center shadow-lg font-bold">
              <HeartPulse className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">RecoverLink</h1>
              <p className="text-teal-100 text-xs font-medium">Enterprise Post-Discharge Surveillance</p>
            </div>
          </div>
        </div>

        {/* Center Pitch & Floating Glass Cards */}
        <div className="relative z-10 my-10 space-y-6">
          <div className="max-w-md">
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
              Proactive recovery. Early complication triage.
            </h2>
            <p className="mt-3 text-teal-50 text-sm lg:text-base leading-relaxed opacity-90">
              Automated daily patient check-ins without app downloads, intelligent clinical symptom flags, and instant clinician intervention.
            </p>
          </div>

          {/* Floating glass sample stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg pt-4">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="p-4 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shadow-glass"
            >
              <div className="flex items-center justify-between text-xs text-teal-100">
                <span>Check-in Adherence</span>
                <TrendingUp className="w-4 h-4 text-emerald-300" />
              </div>
              <div className="text-2xl font-bold mt-1">94.8%</div>
              <div className="text-[11px] text-teal-200 mt-0.5">Across 15 surgical cohorts</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="p-4 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shadow-glass"
            >
              <div className="flex items-center justify-between text-xs text-teal-100">
                <span>Clinical Triage Time</span>
                <Activity className="w-4 h-4 text-teal-200" />
              </div>
              <div className="text-2xl font-bold mt-1">&lt; 12 mins</div>
              <div className="text-[11px] text-teal-200 mt-0.5">From patient check-in to nurse review</div>
            </motion.div>
          </div>

          {/* Core Principle Callout */}
          <div className="p-4 rounded-xl bg-slate-900/30 backdrop-blur-md border border-white/15 text-xs text-teal-50 flex items-start gap-2.5 max-w-md">
            <ShieldCheck className="w-5 h-5 text-teal-300 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Governing Principle:</span> The AI summarises and flags; the clinician decides. No unsupervised medical advice to patients.
            </div>
          </div>
        </div>

        {/* Footer Regulatory Badge */}
        <div className="relative z-10 text-[11px] text-teal-100/80 flex items-center gap-2">
          <span>St. Jude Orthopedic & Surgical Centre Deployment</span>
          <span>•</span>
          <span>v1.0.0 Production</span>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Sign in to Hospital Portal
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Select a role preset or enter your institutional credentials.
            </p>
          </div>

          {/* Quick Demo Credentials Switcher */}
          <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Quick 1-Click Role Presets:
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDemoUser("dr.chen@recoverlink.com", "doctor123")}
                className={`py-1.5 px-2 rounded-xl text-xs font-medium border text-center transition-all ${
                  email === "dr.chen@recoverlink.com"
                    ? "bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-700 dark:text-teal-300 font-semibold shadow-xs"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300"
                }`}
              >
                🩺 Doctor
              </button>
              <button
                type="button"
                onClick={() => setDemoUser("nurse.sarah@recoverlink.com", "nurse123")}
                className={`py-1.5 px-2 rounded-xl text-xs font-medium border text-center transition-all ${
                  email === "nurse.sarah@recoverlink.com"
                    ? "bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-700 dark:text-teal-300 font-semibold shadow-xs"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300"
                }`}
              >
                🩹 Nurse
              </button>
              <button
                type="button"
                onClick={() => setDemoUser("admin@recoverlink.com", "admin123")}
                className={`py-1.5 px-2 rounded-xl text-xs font-medium border text-center transition-all ${
                  email === "admin@recoverlink.com"
                    ? "bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-700 dark:text-teal-300 font-semibold shadow-xs"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300"
                }`}
              >
                🛡️ Admin
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Institutional Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                  placeholder="doctor@hospital.org"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              className="w-full mt-2"
              iconRight={<ArrowRight className="w-4 h-4" />}
            >
              Access Dashboard
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-400">
            Protected under HIPAA & Clinical Governance Protocol. Session expires on logout.
          </div>
        </div>
      </div>
    </div>
  );
}
