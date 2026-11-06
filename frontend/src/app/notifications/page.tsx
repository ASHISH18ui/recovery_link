"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  Phone,
  RefreshCw,
  Search,
  Copy,
  ExternalLink,
  Mail,
  Bell,
  Smartphone,
  Check,
  Filter
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { api, NotificationItem } from "@/lib/api";

export default function NotificationsLogPage() {
  const toast = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  // Preview Modal
  const [previewItem, setPreviewItem] = useState<NotificationItem | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getNotifications({
        notification_type: typeFilter || undefined,
      });
      setNotifications(data);
    } catch (err: any) {
      toast.error("Failed to load notifications log");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [typeFilter]);

  const copyMessage = (msg: string) => {
    navigator.clipboard.writeText(msg);
    toast.success("Message content copied to clipboard");
  };

  const channelIcons: Record<string, React.ReactNode> = {
    whatsapp: <MessageSquare className="w-4 h-4 text-[#25D366]" />,
    sms: <Smartphone className="w-4 h-4 text-teal-600 dark:text-teal-400" />,
    in_app: <Bell className="w-4 h-4 text-rose-500" />,
    email: <Mail className="w-4 h-4 text-indigo-500" />,
  };

  const typeLabels: Record<string, { label: string; badgeVariant: "success" | "info" | "warning" | "danger" | "default" }> = {
    onboarding_link: { label: "Patient Onboarding Link", badgeVariant: "success" },
    checkin_reminder: { label: "Daily Check-in Prompt", badgeVariant: "info" },
    medication_reminder: { label: "Medication Adherence Alert", badgeVariant: "default" },
    appointment_reminder: { label: "Follow-up Clinic Reminder", badgeVariant: "warning" },
    staff_escalation: { label: "Clinical Staff Escalation", badgeVariant: "danger" },
  };

  const filteredNotifications = notifications.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.message.toLowerCase().includes(q) ||
      (item.patient_name || "").toLowerCase().includes(q) ||
      item.recipient_contact.toLowerCase().includes(q) ||
      item.notification_type.toLowerCase().includes(q)
    );
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                <MessageSquare className="w-6 h-6" />
              </div>
              <span>Dispatched Notifications & Message Log</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Audit trail of patient WhatsApp onboarding, SMS reminders, and staff clinical escalations
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchLogs}
              iconLeft={<RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />}
            >
              Refresh Log
            </Button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">Total Dispatched</span>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                  {notifications.length}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                <Send className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">WhatsApp Messages</span>
                <div className="text-2xl font-bold text-[#25D366] mt-0.5">
                  {notifications.filter((n) => n.channel === "whatsapp").length}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#25D366] flex items-center justify-center font-bold">
                <MessageSquare className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">SMS Reminders</span>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                  {notifications.filter((n) => n.channel === "sms").length}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">Delivery Mode</span>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  100% Sim
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter bar */}
        <Card>
          <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search message text, recipient..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto text-xs font-medium">
              {[
                { id: "", label: "All Messages" },
                { id: "onboarding_link", label: "WhatsApp Onboarding" },
                { id: "checkin_reminder", label: "Check-in Prompts" },
                { id: "staff_escalation", label: "Staff Escalations" },
                { id: "appointment_reminder", label: "Appointments" },
              ].map((fl) => (
                <button
                  key={fl.id}
                  onClick={() => setTypeFilter(fl.id)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${
                    typeFilter === fl.id
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {fl.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* List of Messages */}
        {loading ? (
          <Card className="p-8 text-center text-slate-400 animate-pulse">
            Loading notifications audit log...
          </Card>
        ) : filteredNotifications.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No messages found"
            description="No dispatched notifications matching the current criteria."
          />
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((item) => {
              const meta = typeLabels[item.notification_type] || {
                label: item.notification_type,
                badgeVariant: "default",
              };
              return (
                <Card key={item.id} hoverLift>
                  <CardContent className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        {channelIcons[item.channel] || <Send className="w-4 h-4 text-slate-400" />}
                      </div>

                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                            {item.recipient_contact}
                          </span>
                          {item.patient_name && (
                            <>
                              <span className="text-slate-400 text-xs">•</span>
                              <Link
                                href={`/patients/${item.patient_id}`}
                                className="font-bold text-xs text-slate-900 dark:text-white hover:text-teal-600"
                              >
                                {item.patient_name}
                              </Link>
                            </>
                          )}
                          <Badge variant={meta.badgeVariant} size="sm">
                            {meta.label}
                          </Badge>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {item.channel} • {item.status}
                          </span>
                        </div>

                        {/* Message body */}
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                          {item.message}
                        </div>

                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {new Date(item.sent_at).toLocaleString([], {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-start">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyMessage(item.message)}
                        iconLeft={<Copy className="w-3.5 h-3.5" />}
                      >
                        Copy
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setPreviewItem(item)}
                      >
                        Preview
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Message Preview Modal */}
      <Modal
        isOpen={!!previewItem}
        onClose={() => setPreviewItem(null)}
        title="Message Delivery Preview"
        description={`Simulated channel transmission for ${previewItem?.recipient_contact || ""}`}
        maxWidth="md"
        footer={
          <Button variant="secondary" size="md" onClick={() => setPreviewItem(null)}>
            Close
          </Button>
        }
      >
        {previewItem && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#EFEAE2] dark:bg-[#1C2431] border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center font-bold text-xs">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    RecoverLink Outbound Gateway
                  </div>
                  <div className="text-[10px] text-slate-500">
                    To: {previewItem.recipient_contact} • {previewItem.channel.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#202C33] shadow-xs text-xs text-slate-800 dark:text-slate-100 space-y-2 whitespace-pre-wrap leading-relaxed">
                {previewItem.message}
              </div>
            </div>

            <div className="text-xs text-slate-500 space-y-1">
              <div><strong>Status:</strong> {previewItem.status} (Simulated Sandbox Dispatch)</div>
              <div><strong>Timestamp:</strong> {new Date(previewItem.sent_at).toLocaleString()}</div>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
