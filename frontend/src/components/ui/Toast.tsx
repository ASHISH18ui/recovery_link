"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import clsx from "clsx";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info", title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((msg: string, title?: string) => addToast(msg, "success", title), [addToast]);
  const error = useCallback((msg: string, title?: string) => addToast(msg, "error", title), [addToast]);
  const info = useCallback((msg: string, title?: string) => addToast(msg, "info", title), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const icons = {
              success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />,
              error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />,
              warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />,
              info: <Info className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />,
            };

            const borderColors = {
              success: "border-emerald-200 dark:border-emerald-900/60 bg-white dark:bg-slate-900",
              error: "border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900",
              warning: "border-amber-200 dark:border-amber-900/60 bg-white dark:bg-slate-900",
              info: "border-sky-200 dark:border-sky-900/60 bg-white dark:bg-slate-900",
            };

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                className={clsx(
                  "pointer-events-auto p-4 rounded-xl border shadow-lg flex items-start gap-3 text-sm",
                  borderColors[t.type]
                )}
              >
                {icons[t.type]}
                <div className="flex-1">
                  {t.title && <div className="font-semibold text-slate-900 dark:text-white">{t.title}</div>}
                  <div className="text-slate-600 dark:text-slate-300">{t.message}</div>
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toast: (msg: string) => console.log(msg),
      success: (msg: string) => console.log(msg),
      error: (msg: string) => console.error(msg),
      info: (msg: string) => console.log(msg),
    };
  }
  return ctx;
}

