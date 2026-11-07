"use client";

import React, { useEffect, useState, useRef } from "react";
import { MessageSquare, Send, User, Check, CheckCheck, Clock, ShieldCheck, PhoneCall, Sparkles } from "lucide-react";
import { patientApi, PatientMessage } from "@/lib/patient-api";
import { usePatient } from "../PatientContext";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";

export default function PatientMessagesPage() {
  const { lang } = usePatient();
  const [messages, setMessages] = useState<PatientMessage[]>([]);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [requestingCallback, setRequestingCallback] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = () => {
    patientApi
      .getMessages()
      .then((res) => setMessages(res || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    try {
      await patientApi.sendMessage(content.trim());
      setContent("");
      fetchMessages();
    } catch (err: any) {
      alert(err.message || "Failed to deliver message");
    } finally {
      setSending(false);
    }
  };

  const handleRequestCallback = async () => {
    setRequestingCallback(true);
    try {
      await patientApi.sendMessage("Hello, I would like to request a phone callback from my surgical nurse when available.");
      fetchMessages();
    } catch (err: any) {
      alert(err.message || "Failed to submit callback request");
    } finally {
      setRequestingCallback(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[500px] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t("messages", lang)}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Direct communication with your post-discharge surgical navigation team.
          </p>
        </div>

        {/* Quick Callback Request Button */}
        <Button
          variant="secondary"
          size="sm"
          isLoading={requestingCallback}
          onClick={handleRequestCallback}
          iconLeft={<PhoneCall className="w-3.5 h-3.5 text-purple-600" />}
        >
          Request Nurse Callback
        </Button>
      </div>

      {/* Chat Area Container */}
      <div className="h-[500px] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between overflow-hidden">
        {/* Messages List */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
              <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
              <span>No messages yet. Send a question to your care team below.</span>
            </div>
          ) : (
            messages.map((m) => {
              const isPatient = m.sender_role === "patient";
              const isNurseOrDoctor = m.sender_role === "nurse" || m.sender_role === "doctor";
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isPatient ? "items-end" : "items-start"}`}
                >
                  <span className="text-[10px] font-semibold text-slate-400 mb-1 px-1 flex items-center gap-1">
                    {isNurseOrDoctor && <ShieldCheck className="w-3 h-3 text-purple-600 inline" />}
                    {m.sender_name}
                  </span>
                  <div
                    className={`max-w-[80%] sm:max-w-[70%] p-4 rounded-3xl text-xs sm:text-sm leading-relaxed ${
                      isPatient
                        ? "bg-purple-600 text-white rounded-tr-xs shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {m.content}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 px-1">
                    <span>
                      {m.created_at
                        ? new Date(m.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Just now"}
                    </span>
                    {isPatient && (
                      <span className="capitalize font-semibold text-purple-600 dark:text-purple-400">
                        • {m.message_status || "sent"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex gap-2"
        >
          <input
            type="text"
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your question or message for your clinician..."
            className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={sending}
            iconRight={<Send className="w-3.5 h-3.5" />}
          >
            {t("sendMessage", lang)}
          </Button>
        </form>
      </div>

      <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-700 dark:text-blue-300 text-center">
        Non-urgent inquiries typically receive responses within 2 to 4 hours during clinic hours.
      </div>
    </div>
  );
}
