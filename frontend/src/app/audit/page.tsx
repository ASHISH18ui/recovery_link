"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  User,
  Clock,
  FileText,
  Lock,
  Download
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { TableRowSkeleton } from "@/components/ui/Skeleton";
import { api, AuditLogItem } from "@/lib/api";

export default function AuditTrailPage() {
  const toast = useToast();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err: any) {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const actionColors: Record<string, { bg: string; text: string }> = {
    VIEW_PATIENT: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-300" },
    ACKNOWLEDGE_ALERT: { bg: "bg-amber-50 dark:bg-amber-950/60", text: "text-amber-700 dark:text-amber-300" },
    RESOLVE_ALERT: { bg: "bg-emerald-50 dark:bg-emerald-950/60", text: "text-emerald-700 dark:text-emerald-300" },
    ASSIGN_ALERT: { bg: "bg-blue-50 dark:bg-blue-950/60", text: "text-blue-700 dark:text-blue-300" },
    CREATE_DISCHARGE: { bg: "bg-teal-50 dark:bg-teal-950/60", text: "text-teal-700 dark:text-teal-300" },
    SCHEDULE_APPOINTMENT: { bg: "bg-purple-50 dark:bg-purple-950/60", text: "text-purple-700 dark:text-purple-300" },
    ADD_PATIENT_NOTE: { bg: "bg-sky-50 dark:bg-sky-950/60", text: "text-sky-700 dark:text-sky-300" },
    LOGIN: { bg: "bg-indigo-50 dark:bg-indigo-950/60", text: "text-indigo-700 dark:text-indigo-300" },
  };

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== "all" && log.action !== actionFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      (log.user_name || "").toLowerCase().includes(q) ||
      log.resource_type.toLowerCase().includes(q) ||
      (log.details || "").toLowerCase().includes(q)
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
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span>Hospital Audit Trail & Compliance</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Immutable log of every patient record access, discharge creation, and clinical alert acknowledgment
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchLogs}
              iconLeft={<RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />}
            >
              Refresh
            </Button>
          </div>
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
                placeholder="Search staff, actions, details..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto text-xs font-medium">
              <span className="text-slate-400 shrink-0">Action:</span>
              {[
                { id: "all", label: "All Events" },
                { id: "VIEW_PATIENT", label: "Record Views" },
                { id: "ACKNOWLEDGE_ALERT", label: "Alert Actions" },
                { id: "ASSIGN_ALERT", label: "Assignments" },
                { id: "SCHEDULE_APPOINTMENT", label: "Appointments" },
                { id: "CREATE_DISCHARGE", label: "Discharges" },
              ].map((act) => (
                <button
                  key={act.id}
                  onClick={() => setActionFilter(act.id)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${
                    actionFilter === act.id
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {act.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Audit Log Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Staff Member</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Client IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <>
                  <TableRowSkeleton columns={6} />
                  <TableRowSkeleton columns={6} />
                  <TableRowSkeleton columns={6} />
                  <TableRowSkeleton columns={6} />
                </>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={ShieldCheck}
                      title="No audit events found"
                      description="No records match the current filter."
                    />
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const style = actionColors[log.action] || {
                    bg: "bg-slate-100 dark:bg-slate-800",
                    text: "text-slate-700 dark:text-slate-300",
                  };
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString([], {
                          dateStyle: "short",
                          timeStyle: "medium",
                        })}
                      </TableCell>

                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[11px] font-bold tracking-wider ${style.bg} ${style.text}`}
                        >
                          {log.action}
                        </span>
                      </TableCell>

                      <TableCell className="font-semibold text-xs text-slate-800 dark:text-white">
                        {log.user_name || "System Automation"}
                      </TableCell>

                      <TableCell className="font-mono text-[11px] text-slate-500 uppercase">
                        {log.resource_type}
                      </TableCell>

                      <TableCell className="text-xs text-slate-700 dark:text-slate-300 max-w-md truncate">
                        {log.details || "—"}
                      </TableCell>

                      <TableCell className="font-mono text-[11px] text-slate-400 text-right whitespace-nowrap">
                        {log.ip_address || "127.0.0.1"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AppLayout>
  );
}
