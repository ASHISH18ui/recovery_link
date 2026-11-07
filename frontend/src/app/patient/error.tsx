"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function PatientErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console for debugging
    console.error("Patient portal runtime error:", error);
  }, [error]);

  return (
    <div className="min-h-[450px] max-w-lg mx-auto flex flex-col items-center justify-center p-6 text-center space-y-5">
      <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs">
        <AlertCircle className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
          Something went wrong
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
          We experienced an unexpected issue loading this page. Your clinical records and care plan remain secure.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto pt-2">
        <Button
          variant="primary"
          size="md"
          onClick={() => reset()}
          iconLeft={<RefreshCw className="w-4 h-4" />}
          className="w-full sm:w-auto"
        >
          Try Again
        </Button>

        <Link href="/patient/home" className="w-full sm:w-auto">
          <Button
            variant="secondary"
            size="md"
            iconLeft={<Home className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Return to Home
          </Button>
        </Link>
      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
        <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
        <span>For medical emergencies, please call the 24/7 hospital desk at +1 (555) 019-8200.</span>
      </div>
    </div>
  );
}
