"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Phone,
  Lock,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Heart,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { patientApi } from "@/lib/patient-api";
import { Button } from "@/components/ui/Button";

const DEMO_PATIENTS = [
  { name: "Robert Vance", phone: "+1 (555) 234-5678", procedure: "Knee Replacement" },
  { name: "Margaret Davis", phone: "+1 (555) 345-6789", procedure: "CABG Heart Surgery" },
  { name: "James Wilson", phone: "+1 (555) 456-7890", procedure: "Spine Lumbar Fusion" },
  { name: "Patricia Moore", phone: "+1 (555) 567-8901", procedure: "C-Section Delivery" },
  { name: "David Miller", phone: "+1 (555) 678-9012", procedure: "Gallbladder Removal" },
];

export default function PatientLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("+1 (555) 234-5678");
  const [password, setPassword] = useState("patient123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password flow
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<"phone" | "otp" | "done">("phone");
  const [forgotUsername, setForgotUsername] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);

  // Forced password change flow (if must_change_password is true)
  const [mustChangeModalOpen, setMustChangeModalOpen] = useState(false);
  const [currentPwForChange, setCurrentPwForChange] = useState("");
  const [forcedNewPw, setForcedNewPw] = useState("");
  const [forcedChangeLoading, setForcedChangeLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await patientApi.login(username, password);
      if (data.must_change_password) {
        setCurrentPwForChange(password);
        setMustChangeModalOpen(true);
      } else {
        router.push("/patient/home");
      }
    } catch (err: any) {
      setError(err.message || "Invalid login credentials. Please check your phone or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleForcedPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setForcedChangeLoading(true);
    try {
      await patientApi.changePassword(currentPwForChange, forcedNewPw);
      setMustChangeModalOpen(false);
      router.push("/patient/home");
    } catch (err: any) {
      setError(err.message || "Failed to update password");
    } finally {
      setForcedChangeLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMsg(null);
    try {
      await patientApi.forgotPassword(forgotUsername);
      setForgotStep("otp");
      setForgotMsg("A simulated 6-digit OTP code has been dispatched. (Check Notifications Log in Staff portal, or enter code from care team).");
    } catch (err: any) {
      setForgotMsg(err.message || "Could not send OTP.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMsg(null);
    try {
      await patientApi.resetPassword(forgotUsername, otpCode, newPassword);
      setForgotStep("done");
      setForgotMsg("Your password has been reset successfully. You can now login.");
    } catch (err: any) {
      setForgotMsg(err.message || "Invalid or expired OTP code.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F6F8FB] dark:bg-[#090D16] text-slate-900 dark:text-slate-100">
      {/* Left Warm Healthcare Welcome Panel */}
      <div className="lg:w-1/2 relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 p-8 lg:p-16 flex flex-col justify-between overflow-hidden text-white">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider">
            <Heart className="w-3.5 h-3.5 text-pink-200" />
            <span>Patient Recovery Companion</span>
          </div>

          <div className="flex items-center gap-3.5 mt-6">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md p-1.5 flex items-center justify-center shadow-lg border border-white/30">
              <Image
                src="/logo.png"
                alt="AfterCare Logo"
                width={64}
                height={64}
                className="w-full h-full object-contain rounded-xl"
                priority
              />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">AfterCare</h1>
              <p className="text-purple-100 text-xs font-medium">Your Personal Recovery Portal</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 my-10 space-y-6 max-w-md">
          <h2 className="text-3xl lg:text-4xl font-extrabold leading-tight">
            We are with you every step of your healing journey.
          </h2>
          <p className="text-purple-100 text-sm sm:text-base leading-relaxed opacity-95">
            Log your daily symptoms in 60 seconds, receive doctor-approved recovery guidance, track medicines, and stay connected with your care team from home.
          </p>

          <div className="space-y-2.5 pt-4">
            <div className="flex items-center gap-3 text-xs sm:text-sm text-purple-50">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>No complicated app download needed</span>
            </div>
            <div className="flex items-center gap-3 text-xs sm:text-sm text-purple-50">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Direct alerts to your surgeon and care nurse</span>
            </div>
            <div className="flex items-center gap-3 text-xs sm:text-sm text-purple-50">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Multi-language support in English & हिन्दी</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-4 text-xs text-purple-200">
          Hospital Care Team Hotline • 24/7 Clinical Monitoring
        </div>
      </div>

      {/* Right Login Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Patient Access
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              Welcome back
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Sign in with your registered phone number or email
            </p>
          </div>

          {/* Demo Patient Chips */}
          <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-purple-900 dark:text-purple-200">
              <span className="font-bold">Instant Demo Login:</span>
              <span className="text-[11px] font-normal text-purple-600 dark:text-purple-400">
                Password: <code className="font-mono font-bold">patient123</code>
              </span>
            </div>

            {/* Primary requested Demo Patient chip */}
            <button
              type="button"
              onClick={() => {
                setUsername("+1 (555) 234-5678");
                setPassword("patient123");
                setError(null);
              }}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 border-2 border-purple-400 dark:border-purple-700 hover:bg-purple-100/50 shadow-xs transition-all text-left"
            >
              <span>Demo Patient (Robert Vance)</span>
              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                +1 (555) 234-5678 / patient123
              </span>
            </button>

            {/* Other demo patients */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {DEMO_PATIENTS.slice(1).map((p) => (
                <button
                  key={p.phone}
                  type="button"
                  onClick={() => {
                    setUsername(p.phone);
                    setPassword("patient123");
                    setError(null);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 border border-purple-200 dark:border-purple-800 hover:border-purple-500 hover:bg-purple-100/50 transition-colors shadow-2xs"
                >
                  {p.name.split(" ")[0]} ({p.procedure.split(" ")[0]})
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Phone Number or Email
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  placeholder="+1 (555) 234-5678"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotUsername(username);
                    setForgotStep("phone");
                    setForgotModalOpen(true);
                  }}
                  className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-semibold"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
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
              Sign In to Recovery Portal
            </Button>
          </form>

          {/* Cross Link to Staff Login */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-center space-y-2 text-xs text-slate-500 dark:text-slate-400">
            <p>
              Are you hospital staff?{" "}
              <Link href="/login" className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">
                Staff login &rarr;
              </Link>
            </p>
            <p className="text-[11px] text-slate-400">
              For security, patient sessions are encrypted and monitored under clinical governance.
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-purple-600" />
                <span>Password Recovery</span>
              </h3>
              <button
                onClick={() => setForgotModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {forgotMsg && (
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 text-purple-800 dark:text-purple-300 text-xs">
                {forgotMsg}
              </div>
            )}

            {forgotStep === "phone" && (
              <form onSubmit={handleSendOtp} className="space-y-3">
                <p className="text-xs text-slate-500">
                  Enter your registered phone number or email address. A 6-digit OTP will be generated.
                </p>
                <input
                  type="text"
                  required
                  value={forgotUsername}
                  onChange={(e) => setForgotUsername(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  placeholder="+1 (555) 234-5678"
                />
                <Button type="submit" variant="primary" size="md" isLoading={forgotLoading} className="w-full">
                  Send Recovery OTP
                </Button>
              </form>
            )}

            {forgotStep === "otp" && (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono tracking-widest text-center"
                    placeholder="123456"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                    placeholder="Min 6 characters"
                  />
                </div>
                <Button type="submit" variant="primary" size="md" isLoading={forgotLoading} className="w-full">
                  Verify OTP & Set Password
                </Button>
              </form>
            )}

            {forgotStep === "done" && (
              <div className="text-center space-y-3 py-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setForgotModalOpen(false)}
                  className="w-full"
                >
                  Return to Sign In
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Forced Change Password Modal */}
      {mustChangeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              <span>Set Your Permanent Password</span>
            </h3>
            <p className="text-xs text-slate-500">
              For your account safety, please set a new personal password on your first login.
            </p>
            <form onSubmit={handleForcedPasswordChange} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Choose New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={forcedNewPw}
                  onChange={(e) => setForcedNewPw(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  placeholder="Min 6 characters"
                />
              </div>
              <Button type="submit" variant="primary" size="md" isLoading={forcedChangeLoading} className="w-full">
                Save & Continue to Portal
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
