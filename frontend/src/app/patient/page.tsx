"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PatientRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/patient/home");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
    </div>
  );
}
