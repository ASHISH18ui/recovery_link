import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "RecoverLink | Clinical Post-Discharge Patient Recovery Monitoring",
  description: "Secure, AI-assisted post-discharge patient recovery monitoring platform for hospitals.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-[#F6F8FB] dark:bg-[#090D16] text-slate-900 dark:text-slate-100 antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

