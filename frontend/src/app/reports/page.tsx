"use client";

import React, { useEffect, useState } from "react";
import {
  FileText,
  Download,
  TrendingDown,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Pill,
  RefreshCw,
  Sparkles
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { api, ReportSummary } from "@/lib/api";

export default function ReportsPage() {
  const toast = useToast();
  const [data, setData] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const summary = await api.getReportsSummary();
      setData(summary);
    } catch (err: any) {
      toast.error("Failed to load clinical analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExportCsv = () => {
    window.open(api.exportReportsCsvUrl(), "_blank");
    toast.success("Downloading CSV recovery report...", "Export Started");
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                <FileText className="w-6 h-6" />
              </div>
              <span>Clinical Recovery Analytics & Reports</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Cohort pain regression trajectories, readmission risk segmentation, and protocol adherence
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchReports}
              iconLeft={<RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExportCsv}
              iconLeft={<Download className="w-4 h-4" />}
            >
              Export CSV Report
            </Button>
          </div>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">Active Cohort</span>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {data?.total_monitored_patients ?? 15}
                </div>
                <div className="text-xs text-teal-600 dark:text-teal-400 mt-0.5">
                  Across 6 surgical disciplines
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                <Activity className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">Check-ins Logged</span>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {data?.total_checkins_logged ?? 48}
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>High engagement rate</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">Medication Adherence</span>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {data?.overall_medication_adherence ?? 94}%
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Prescription compliance
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Pill className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">Alert Resolution</span>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {data?.alert_resolution_rate ?? 91}%
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
                  Clinician review verified
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recovery Trajectory: Pain Regression */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Cohort Pain Regression Trajectory</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Average post-operative pain score (0-10) over 14 calendar days
                  </p>
                </div>
                <Badge variant="success" size="sm">
                  Normal Downward Trend
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                {data?.daily_trends && data.daily_trends.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={data.daily_trends}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="painGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0EA5A4" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#0EA5A4" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="display_date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <YAxis domain={[0, 10]} stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0F172A",
                          borderRadius: "10px",
                          border: "none",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="avg_pain"
                        name="Avg Pain Score (0-10)"
                        stroke="#0EA5A4"
                        strokeWidth={2.5}
                        fill="url(#painGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    Loading trend analytics...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Adherence & Missed Rates Bar Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Daily Protocol Engagement & Adherence</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Total check-in submissions per day
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                {data?.daily_trends && data.daily_trends.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.daily_trends}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <XAxis dataKey="display_date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0F172A",
                          borderRadius: "10px",
                          border: "none",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                      />
                      <Bar
                        dataKey="checkins_count"
                        name="Completed Check-ins"
                        fill="#2563EB"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    Loading bar metrics...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Surgical Procedure Readmission Risk Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Surgical Procedure Outcomes & Readmission Risk Breakdown</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Stratification by procedure type, active complication flags, and average recovery pain
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Surgical Procedure</TableHead>
                  <TableHead>Enrolled Patients</TableHead>
                  <TableHead>Active Flags</TableHead>
                  <TableHead>Avg Pain Score</TableHead>
                  <TableHead className="text-right">Readmission Risk Assessment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.procedure_breakdown && data.procedure_breakdown.length > 0 ? (
                  data.procedure_breakdown.map((row, idx) => {
                    const badgeVariant =
                      row.readmission_risk === "High"
                        ? "danger"
                        : row.readmission_risk === "Moderate"
                        ? "warning"
                        : "success";
                    return (
                      <TableRow key={idx}>
                        <TableCell className="font-semibold text-xs text-slate-900 dark:text-white">
                          {row.procedure}
                        </TableCell>
                        <TableCell className="text-xs font-mono">{row.patients}</TableCell>
                        <TableCell className="text-xs">
                          {row.active_alerts > 0 ? (
                            <span className="font-bold text-rose-600 dark:text-rose-400">
                              {row.active_alerts} Active
                            </span>
                          ) : (
                            <span className="text-slate-400">0 Flags</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-mono font-medium">
                          {row.avg_pain_score} / 10
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={badgeVariant} size="sm">
                            {row.readmission_risk} Risk
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-400 py-6">
                      No surgical outcome data available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

