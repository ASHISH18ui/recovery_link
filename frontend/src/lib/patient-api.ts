// AfterCare Patient Portal API Client
// Separate from api.ts (staff). Uses /patient-api prefix.

const rawBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
const PATIENT_API_BASE = rawBase.endsWith("/api/v1")
  ? rawBase.replace("/api/v1", "/patient-api")
  : `${rawBase}/patient-api`;

// ─── Auth Storage ─────────────────────────────────────────────────────────────
export const patientAuthStorage = {
  getToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("aftercare_patient_token");
  },
  setToken: (t: string) => {
    if (typeof window !== "undefined") localStorage.setItem("aftercare_patient_token", t);
  },
  getPatient: (): PatientSession | null => {
    if (typeof window === "undefined") return null;
    const s = localStorage.getItem("aftercare_patient_session");
    return s ? JSON.parse(s) : null;
  },
  setPatient: (p: PatientSession) => {
    if (typeof window !== "undefined")
      localStorage.setItem("aftercare_patient_session", JSON.stringify(p));
  },
  clear: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("aftercare_patient_token");
      localStorage.removeItem("aftercare_patient_session");
    }
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface PatientSession {
  patient_id: string;
  patient_name: string;
  must_change_password: boolean;
  preferred_language: string;
}

export interface PatientMe {
  patient: {
    id: string;
    full_name: string;
    phone: string;
    email?: string;
    date_of_birth: string;
    gender: string;
    emergency_contact?: string;
    mrn?: string;
  };
  account: {
    preferred_language: string;
    must_change_password: boolean;
  };
  recovery: {
    days_in_recovery: number;
    plan_duration_days: number;
    progress_percent: number;
    care_plan_status?: string;
    follow_up_date?: string;
  };
  today_tasks: {
    checkin_done: boolean;
    checkin_id?: string;
    medicines_total: number;
    medicines_logged: number;
    has_appointment_today: boolean;
  };
  next_appointment?: {
    id: string;
    scheduled_at: string;
    appointment_type: string;
    notes?: string;
  } | null;
  disclaimer: string;
}

export interface PatientCheckinPayload {
  pain_level: number;
  has_fever?: boolean;
  temperature?: number;
  has_swelling?: boolean;
  swelling_details?: string;
  wound_status?: string;
  breathing_difficulty?: boolean;
  eating_normally?: boolean;
  sleeping_normally?: boolean;
  moving_normally?: boolean;
  new_symptoms?: string;
  mood?: string;
  medication_taken?: boolean;
  missed_medication_reason?: string;
  vital_temperature?: number;
  vital_systolic_bp?: number;
  vital_diastolic_bp?: number;
  vital_pulse?: number;
  vital_spo2?: number;
  vital_weight_kg?: number;
  vital_blood_sugar?: number;
  site_photo_b64?: string;
}

export interface PatientCheckin {
  id: string;
  date: string;
  submitted_at?: string;
  pain_level: number;
  has_fever: boolean;
  temperature?: number;
  has_swelling: boolean;
  eating_normally: boolean;
  sleeping_normally: boolean;
  moving_normally: boolean;
  medication_taken: boolean;
  new_symptoms?: string;
  ai_summary?: string;
  ai_risk_level: "low" | "medium" | "high";
  ai_flags: string[];
  disclaimer?: string;
}

export interface PatientMedication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  purpose?: string;
  today_status?: "taken" | "skipped";
}

export interface PatientAppointment {
  id: string;
  scheduled_at: string;
  appointment_type: string;
  status: string;
  notes?: string;
  is_upcoming: boolean;
}

export interface PatientMessage {
  id: string;
  sender_role: string;
  sender_name: string;
  content: string;
  message_status: string;
  created_at?: string;
}

export interface RecoveryPlanDay {
  day_number: number;
  title: string;
  instructions?: string;
  diet_notes?: string;
  exercise_notes?: string;
  warning_signs: string[];
  milestones: string[];
  is_completed: boolean;
}

// ─── Fetch Helper ─────────────────────────────────────────────────────────────
async function fetchWithPatientAuth(endpoint: string, options: RequestInit = {}) {
  const token = patientAuthStorage.getToken();
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${PATIENT_API_BASE}${endpoint}`, { ...options, headers });

  if (res.status === 401 && typeof window !== "undefined") {
    patientAuthStorage.clear();
    window.location.href = "/patient/login";
    throw new Error("Session expired");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }

  return res.json();
}

// ─── API ─────────────────────────────────────────────────────────────────────
export const patientApi = {
  login: async (username: string, password: string): Promise<PatientSession & { access_token: string }> => {
    const res = await fetch(`${PATIENT_API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(err.detail || "Invalid credentials");
    }
    const data = await res.json();
    patientAuthStorage.setToken(data.access_token);
    patientAuthStorage.setPatient({
      patient_id: data.patient_id,
      patient_name: data.patient_name,
      must_change_password: data.must_change_password,
      preferred_language: data.preferred_language,
    });
    return data;
  },

  logout: () => {
    patientAuthStorage.clear();
    if (typeof window !== "undefined") window.location.href = "/patient/login";
  },

  changePassword: (current_password: string, new_password: string) =>
    fetchWithPatientAuth("/change-password", {
      method: "POST",
      body: JSON.stringify({ current_password, new_password }),
    }),

  forgotPassword: (username: string) =>
    fetch(`${PATIENT_API_BASE}/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    }).then((r) => r.json()),

  resetPassword: (username: string, otp_code: string, new_password: string) =>
    fetch(`${PATIENT_API_BASE}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, otp_code, new_password }),
    }).then(async (r) => {
      if (!r.ok) {
        const err = await r.json().catch(() => ({ detail: "Reset failed" }));
        throw new Error(err.detail || "Reset failed");
      }
      return r.json();
    }),

  getMe: (): Promise<PatientMe> => fetchWithPatientAuth("/me"),

  updateProfile: (data: { emergency_contact?: string; preferred_language?: string }) =>
    fetchWithPatientAuth("/profile", { method: "PATCH", body: JSON.stringify(data) }),

  submitCheckin: (data: PatientCheckinPayload) =>
    fetchWithPatientAuth("/checkins", { method: "POST", body: JSON.stringify(data) }),

  getCheckins: (): Promise<PatientCheckin[]> => fetchWithPatientAuth("/checkins"),

  getTodayCheckin: () => fetchWithPatientAuth("/checkins/today"),

  getMedications: () => fetchWithPatientAuth("/medications"),

  logMedication: (medication_id: string, status: "taken" | "skipped", notes?: string) =>
    fetchWithPatientAuth(`/medications/${medication_id}/log`, {
      method: "POST",
      body: JSON.stringify({ status, notes }),
    }),

  getAppointments: (): Promise<PatientAppointment[]> => fetchWithPatientAuth("/appointments"),

  rescheduleAppointment: (appointment_id: string, reason: string, preferred_dates?: string) =>
    fetchWithPatientAuth(`/appointments/${appointment_id}/reschedule-request`, {
      method: "POST",
      body: JSON.stringify({ reason, preferred_dates }),
    }),

  getMessages: (): Promise<PatientMessage[]> => fetchWithPatientAuth("/messages"),

  sendMessage: (content: string) =>
    fetchWithPatientAuth("/messages", { method: "POST", body: JSON.stringify({ content }) }),

  getRecoveryPlan: () => fetchWithPatientAuth("/recovery-plan"),

  getVitals: () => fetchWithPatientAuth("/vitals"),

  getNotifications: () => fetchWithPatientAuth("/notifications"),

  getDocuments: () => fetchWithPatientAuth("/documents"),

  triggerEmergency: (description?: string) =>
    fetchWithPatientAuth("/emergency", {
      method: "POST",
      body: JSON.stringify({ description: description || "Patient triggered emergency alert." }),
    }),
};

export { PATIENT_API_BASE };
