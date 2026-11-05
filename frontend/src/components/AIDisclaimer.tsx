import { AlertTriangle } from "lucide-react";

export function AIDisclaimer({ className = "" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100/90 text-slate-600 text-xs font-medium border border-slate-200/80 ${className}`}
    >
      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
      <span>AI-generated summary. Clinician review required.</span>
    </div>
  );
}

