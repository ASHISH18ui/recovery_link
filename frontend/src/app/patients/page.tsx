"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  UserPlus,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Copy,
  Check,
  Send,
  ArrowUpDown,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Sparkles,
  Phone
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, RiskBadge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { TableRowSkeleton } from "@/components/ui/Skeleton";
import { api, Patient } from "@/lib/api";

type SortField = "full_name" | "mrn" | "current_risk_level" | "latest_checkin_date" | "created_at";
type SortOrder = "asc" | "desc";

export default function PatientsListPage() {
  const toast = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selection & Bulk
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Sorting & Pagination
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Single reminder state
  const [remindingId, setRemindingId] = useState<string | null>(null);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const data = await api.getPatients({
        search: search.trim() || undefined,
        risk_level: riskFilter === "all" ? undefined : riskFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      setPatients(data);
    } catch (err: any) {
      toast.error("Failed to load patient records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [riskFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPatients();
  };

  const handleCopyLink = (token: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/check-in/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Patient portal link copied to clipboard");
  };

  const handleSendReminder = async (patientId: string, patientName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRemindingId(patientId);
    try {
      await api.sendReminder(patientId);
      toast.success(`Check-in reminder sent to ${patientName}`, "Dispatched");
    } catch (err: any) {
      toast.error(err.message || "Failed to dispatch reminder");
    } finally {
      setRemindingId(null);
    }
  };

  // Sorting
  const sortedPatients = useMemo(() => {
    return [...patients].sort((a, b) => {
      let valA: any = a[sortField] || "";
      let valB: any = b[sortField] || "";

      if (sortField === "current_risk_level") {
        const weight: Record<string, number> = { high: 3, medium: 2, low: 1 };
        valA = weight[a.current_risk_level] || 0;
        valB = weight[b.current_risk_level] || 0;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [patients, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedPatients.length / pageSize) || 1;
  const paginatedPatients = sortedPatients.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedPatients.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedPatients.map((p) => p.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkRemind = async () => {
    if (selectedIds.length === 0) return;
    setBulkProcessing(true);
    try {
      for (const id of selectedIds) {
        await api.sendReminder(id);
      }
      toast.success(`Dispatched reminders to ${selectedIds.length} patients`, "Bulk Action Completed");
      setSelectedIds([]);
    } catch (err: any) {
      toast.error("Some reminders failed to dispatch");
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkExport = () => {
    window.open(api.exportReportsCsvUrl(), "_blank");
    toast.info("Downloading recovery CSV...", "Export Started");
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Patient Monitoring Directory
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Active surgical recovery cohorts, risk classifications, and patient check-in credentials
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleBulkExport}
              iconLeft={<FileSpreadsheet className="w-4 h-4" />}
            >
              Export CSV
            </Button>
            <Link href="/discharges/new">
              <Button
                variant="primary"
                size="sm"
                iconLeft={<UserPlus className="w-4 h-4" />}
              >
                Discharge Patient
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <Card>
          <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
            <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patient name, MRN, or phone..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </form>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {/* Risk Level Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 font-medium">Risk:</span>
                <select
                  value={riskFilter}
                  onChange={(e) => {
                    setRiskFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">All Risks</option>
                  <option value="high">High Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="low">Low Risk</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 font-medium">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Recovery</option>
                  <option value="completed">Completed / Discharged</option>
                </select>
              </div>

              <Button variant="secondary" size="sm" onClick={fetchPatients}>
                Apply
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-between text-xs animate-in fade-in">
            <div className="flex items-center gap-2 text-teal-800 dark:text-teal-200 font-medium">
              <CheckSquare className="w-4 h-4 text-teal-600" />
              <span>{selectedIds.length} patients selected</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                isLoading={bulkProcessing}
                onClick={handleBulkRemind}
                iconLeft={<Send className="w-3.5 h-3.5" />}
              >
                Send Bulk Reminders
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds([])}
              >
                Deselect All
              </Button>
            </div>
          </div>
        )}

        {/* Patients Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={
                      paginatedPatients.length > 0 &&
                      selectedIds.length === paginatedPatients.length
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => toggleSort("full_name")}
                    className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white"
                  >
                    <span>Patient Name & MRN</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => toggleSort("current_risk_level")}
                    className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white"
                  >
                    <span>Risk Status</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => toggleSort("latest_checkin_date")}
                    className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white"
                  >
                    <span>Latest Check-in</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </TableHead>
                <TableHead>Pending Alerts</TableHead>
                <TableHead>Patient Portal Token</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <>
                  <TableRowSkeleton columns={7} />
                  <TableRowSkeleton columns={7} />
                  <TableRowSkeleton columns={7} />
                  <TableRowSkeleton columns={7} />
                </>
              ) : paginatedPatients.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      title="No patients found"
                      description="Try adjusting your search query or risk level filter."
                    />
                  </td>
                </tr>
              ) : (
                paginatedPatients.map((patient) => {
                  const isSelected = selectedIds.includes(patient.id);
                  return (
                    <TableRow key={patient.id} data-state={isSelected ? "selected" : undefined}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(patient.id)}
                          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                      </TableCell>

                      <TableCell>
                        <Link
                          href={`/patients/${patient.id}`}
                          className="group block"
                        >
                          <div className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-teal-600 transition-colors">
                            {patient.full_name}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>MRN: {patient.mrn || "N/A"}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {patient.phone}
                            </span>
                          </div>
                        </Link>
                      </TableCell>

                      <TableCell>
                        <RiskBadge risk={patient.current_risk_level} size="sm" />
                      </TableCell>

                      <TableCell>
                        <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {patient.latest_checkin_date || (
                            <span className="text-slate-400 italic">None logged</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        {patient.pending_alerts_count > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                            {patient.pending_alerts_count} Open
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">0 Open</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-700 dark:text-slate-300 max-w-[140px] truncate">
                            {patient.access_token}
                          </code>
                          <button
                            onClick={(e) => handleCopyLink(patient.access_token, e)}
                            title="Copy patient portal link"
                            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <Link
                            href={`/check-in/${patient.access_token}`}
                            target="_blank"
                            title="Open patient portal in new tab"
                            className="p-1 rounded text-teal-600 hover:text-teal-700"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            isLoading={remindingId === patient.id}
                            onClick={(e) => handleSendReminder(patient.id, patient.full_name, e)}
                            className="text-xs text-teal-600 hover:text-teal-700"
                          >
                            Remind
                          </Button>
                          <Link href={`/patients/${patient.id}`}>
                            <Button variant="secondary" size="sm" className="text-xs">
                              View Record
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing {paginatedPatients.length} of {sortedPatients.length} patients
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
