// AfterCare API Client

const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
const API_BASE = rawApiUrl.endsWith("/api/v1") ? rawApiUrl : `${rawApiUrl}/api/v1`;

export interface User {
  id: string;
  hospital_id: string;
  email: string;
  full_name: string;
  role: "admin" | "doctor" | "nurse";
  department: string;
}

export interface Patient {
  id: string;
  mrn?: string;
  full_name: string;
  phone: string;
  email?: string;
  date_of_birth: string;
  gender: string;
  access_token: string;
  token_expires_at?: string;
  latest_checkin_date?: string;
  status: string;
  current_risk_level: "low" | "medium" | "high";
  pending_alerts_count: number;
  created_at: string;
}

export interface Medication {
  id?: string;
  name: string;
  dosage: string;
  frequency: string;
  purpose?: string;
  is_active?: boolean;
}

export interface Checkin {
  id: string;
  patient_id: string;
  care_plan_id: string;
  date: string;
  submitted_at: string;
  pain_level: number;
  has_fever: boolean;
  temperature?: number;
  has_swelling: boolean;
  swelling_details?: string;
  eating_normally: boolean;
  sleeping_normally: boolean;
  moving_normally: boolean;
  medication_taken: boolean;
  missed_medication_reason?: string;
  new_symptoms?: string;
  callback_requested: boolean;
  callback_reason?: string;
  ai_summary?: string;
  ai_risk_level: "low" | "medium" | "high";
  ai_flags: string[];
  ai_missing_info: string[];
}

export interface Alert {
  id: string;
  patient_id: string;
  patient_name?: string;
  patient_phone?: string;
  checkin_id?: string;
  care_plan_id: string;
  risk_level: "low" | "medium" | "high";
  summary: string;
  flags: string[];
  status: "pending" | "acknowledged" | "resolved";
  acknowledged_by?: string;
  acknowledged_by_name?: string;
  acknowledged_at?: string;
  action_taken?: "call_patient" | "schedule_visit" | "escalate_to_doctor" | "no_action_needed" | "resolved";
  notes?: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  patient_name?: string;
  patient_phone?: string;
  patient_mrn?: string;
  care_plan_id: string;
  doctor_id?: string;
  doctor_name?: string;
  scheduled_at: string;
  appointment_type: string;
  status: "scheduled" | "completed" | "cancelled";
  notes?: string;
  created_at?: string;
}

export interface PatientNote {
  id: string;
  patient_id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  note_type: string;
  content: string;
  created_at: string;
}

export interface CarePlanTemplate {
  id: string;
  name: string;
  category: string;
  description?: string;
  duration_days: number;
  checkin_frequency: string;
  default_instructions?: string;
  suggested_medications: string; // JSON string
  created_at?: string;
}

export interface Hospital {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  created_at: string;
}

export interface DashboardStats {
  total_discharged_patients: number;
  completed_today: number;
  missed_checkins: number;
  requiring_review: number;
  upcoming_appointments: number;
}

export interface DashboardChartsData {
  completion_history: Array<{
    date: string;
    day: string;
    completed: number;
    missed: number;
    rate: number;
  }>;
  risk_distribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  upcoming_appointments: Array<{
    id: string;
    patient_name: string;
    patient_mrn: string;
    patient_id: string;
    appointment_type: string;
    scheduled_at: string;
    doctor_name: string;
    status: string;
  }>;
  stat_trends: {
    discharged_trend: string;
    completion_trend: string;
    missed_trend: string;
    review_trend: string;
  };
}

export interface NotificationItem {
  id: string;
  patient_id?: string;
  patient_name?: string;
  notification_type: string;
  channel: string;
  recipient_contact: string;
  message: string;
  status: string;
  link_url?: string;
  sent_at: string;
}

export interface AuditLogItem {
  id: string;
  user_id?: string;
  user_name?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}

export interface ReportSummary {
  total_monitored_patients: number;
  total_checkins_logged: number;
  overall_medication_adherence: number;
  alert_resolution_rate: number;
  risk_distribution: { low: number; medium: number; high: number };
  daily_trends: Array<{
    date: string;
    display_date: string;
    avg_pain: number;
    checkins_count: number;
    adherence_rate: number;
    fever_flags: number;
  }>;
  procedure_breakdown: Array<{
    procedure: string;
    patients: number;
    active_alerts: number;
    avg_pain_score: number;
    readmission_risk: string;
  }>;
}

// Token helper for browser
export const authStorage = {
  getToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("aftercare_token") || localStorage.getItem("recoverlink_token");
  },
  setToken: (token: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("aftercare_token", token);
      localStorage.setItem("recoverlink_token", token);
    }
  },
  getUser: (): User | null => {
    if (typeof window === "undefined") return null;
    const str = localStorage.getItem("aftercare_user") || localStorage.getItem("recoverlink_user");
    return str ? JSON.parse(str) : null;
  },
  setUser: (user: User) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("aftercare_user", JSON.stringify(user));
      localStorage.setItem("recoverlink_user", JSON.stringify(user));
    }
  },
  clear: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("aftercare_token");
      localStorage.removeItem("recoverlink_token");
      localStorage.removeItem("aftercare_user");
      localStorage.removeItem("recoverlink_user");
    }
  }
};

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = authStorage.getToken();
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && typeof window !== "undefined" && !window.location.pathname.startsWith("/recovery") && !window.location.pathname.startsWith("/check-in")) {
    authStorage.clear();
    window.location.href = "/login";
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || "Request failed");
  }

  return res.json();
}

export const api = {
  // Auth
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(err.detail || "Invalid credentials");
    }
    const data = await res.json();
    authStorage.setToken(data.access_token);
    authStorage.setUser(data.user);
    return data;
  },
  logout: () => {
    authStorage.clear();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  },
  getMe: () => fetchWithAuth("/auth/me"),
  getDoctors: () => fetchWithAuth("/auth/doctors"),

  // Dashboard
  getStats: (): Promise<DashboardStats> => fetchWithAuth("/dashboard/stats"),
  getDashboardCharts: (): Promise<DashboardChartsData> => fetchWithAuth("/dashboard/charts"),
  getAlerts: (statusFilter = "pending"): Promise<Alert[]> =>
    fetchWithAuth(`/dashboard/alerts?status_filter=${statusFilter}`),
  getFlaggedPatients: () => fetchWithAuth("/dashboard/flagged-patients"),

  // Patients
  getPatients: (params: { search?: string; risk_level?: string; status?: string } = {}): Promise<Patient[]> => {
    const q = new URLSearchParams();
    if (params.search) q.set("search", params.search);
    if (params.risk_level) q.set("risk_level", params.risk_level);
    if (params.status) q.set("status_filter", params.status);
    return fetchWithAuth(`/patients?${q.toString()}`);
  },
  getPatientDetail: (id: string) => fetchWithAuth(`/patients/${id}`),
  getPatientNotes: (id: string): Promise<PatientNote[]> => fetchWithAuth(`/patients/${id}/notes`),
  addPatientNote: (id: string, content: string, note_type = "clinical"): Promise<PatientNote> =>
    fetchWithAuth(`/patients/${id}/notes`, {
      method: "POST",
      body: JSON.stringify({ content, note_type })
    }),
  getPatientActivity: (id: string): Promise<any[]> => fetchWithAuth(`/patients/${id}/activity`),

  // Discharges
  createDischarge: (data: any) =>
    fetchWithAuth("/discharges", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Alerts
  listAlerts: (params: { risk_level?: string; status?: string; search?: string } = {}): Promise<Alert[]> => {
    const q = new URLSearchParams();
    if (params.risk_level) q.set("risk_level", params.risk_level);
    if (params.status) q.set("status", params.status);
    if (params.search) q.set("search", params.search);
    return fetchWithAuth(`/alerts?${q.toString()}`);
  },
  takeAlertAction: (alertId: string, action: string, notes?: string): Promise<Alert> =>
    fetchWithAuth(`/alerts/${alertId}/action`, {
      method: "POST",
      body: JSON.stringify({ action, notes }),
    }),
  assignAlert: (alertId: string, assigneeId: string, notes?: string): Promise<Alert> =>
    fetchWithAuth(`/alerts/${alertId}/assign`, {
      method: "PATCH",
      body: JSON.stringify({ assignee_id: assigneeId, notes })
    }),

  // Appointments
  getAppointments: (params: { status?: string; patient_id?: string } = {}): Promise<Appointment[]> => {
    const q = new URLSearchParams();
    if (params.status) q.set("status", params.status);
    if (params.patient_id) q.set("patient_id", params.patient_id);
    return fetchWithAuth(`/appointments?${q.toString()}`);
  },
  createAppointment: (data: { patient_id: string; care_plan_id: string; scheduled_at: string; appointment_type: string; notes?: string }) =>
    fetchWithAuth("/appointments", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  updateAppointment: (id: string, data: { scheduled_at?: string; status?: string; appointment_type?: string; notes?: string }) =>
    fetchWithAuth(`/appointments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data)
    }),
  remindAppointment: (id: string) =>
    fetchWithAuth(`/appointments/${id}/remind`, { method: "POST" }),

  // Reports
  getReportsSummary: (): Promise<ReportSummary> => fetchWithAuth("/reports/summary"),
  exportReportsCsvUrl: () => `${API_BASE}/reports/export-csv`,

  // Settings
  getHospitalProfile: (): Promise<Hospital> => fetchWithAuth("/settings/hospital"),
  updateHospitalProfile: (data: Partial<Hospital>): Promise<Hospital> =>
    fetchWithAuth("/settings/hospital", {
      method: "PATCH",
      body: JSON.stringify(data)
    }),
  getTemplates: (): Promise<CarePlanTemplate[]> => fetchWithAuth("/settings/templates"),
  createTemplate: (data: Partial<CarePlanTemplate>): Promise<CarePlanTemplate> =>
    fetchWithAuth("/settings/templates", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  getTeamMembers: (): Promise<User[]> => fetchWithAuth("/settings/team"),
  addTeamMember: (data: any): Promise<User> =>
    fetchWithAuth("/settings/team", {
      method: "POST",
      body: JSON.stringify(data)
    }),

  // Patient Portal (Tokenized, NO password required)
  getPortalInfo: async (token: string) => {
    const res = await fetch(`${API_BASE}/checkins/portal-info/${token}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Failed to load portal" }));
      throw new Error(err.detail || "Invalid portal link");
    }
    return res.json();
  },
  submitCheckin: async (token: string, checkinData: any) => {
    const res = await fetch(`${API_BASE}/checkins/submit/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(checkinData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Submission failed" }));
      throw new Error(err.detail || "Failed to submit check-in");
    }
    return res.json();
  },

  // Notifications
  getNotifications: (params: { patient_id?: string; notification_type?: string } = {}): Promise<NotificationItem[]> => {
    const q = new URLSearchParams();
    if (params.patient_id) q.set("patient_id", params.patient_id);
    if (params.notification_type) q.set("notification_type", params.notification_type);
    return fetchWithAuth(`/notifications?${q.toString()}`);
  },
  sendReminder: (patientId: string) =>
    fetchWithAuth(`/notifications/send-checkin-reminder/${patientId}`, { method: "POST" }),

  // Audit Logs
  getAuditLogs: (): Promise<AuditLogItem[]> => fetchWithAuth("/audit-logs"),
};
