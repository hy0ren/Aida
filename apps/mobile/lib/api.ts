import type {
  AppointmentResponse,
  ApiResponse,
  CallSessionResponse,
  FindProvidersResponse,
  InsuranceVerificationResponse,
  ListAppointmentsData,
  ListUploadsData,
  SmsResponse,
  SummaryResponse,
  UploadResponse,
} from "@aida/shared";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
export const TOKEN_KEY = "aida.authToken";

function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError) return true; // e.g. fetch failed in RN
  const s = err instanceof Error ? err.message : String(err);
  return /Network request failed|Failed to fetch|NetworkError|ECONNREFUSED|ENOTFOUND/i.test(s);
}

function apiUnreachableHelp(): string {
  if (!process.env.EXPO_PUBLIC_API_URL) {
    return [
      "Can't reach the API. On a phone, localhost is the phone, not your PC.",
      "Create apps/mobile/.env with: EXPO_PUBLIC_API_URL=http://<your-computer-LAN-IP>:3000",
      "Restart Expo. Run: cd apps/web && npm run dev. Same Wi‑Fi as the computer.",
    ].join(" ");
  }
  return [
    `Can't reach the API at ${API_BASE}.`,
    "Start the Next server and leave it running: cd apps/web && npm run dev",
    "In the phone's browser, open that URL; if it won't load, check same Wi-Fi / firewall / guest network isolation.",
    "After changing apps/mobile/.env, fully restart Expo (Metro) so the URL is rebundled.",
  ].join(" ");
}

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type AuthUser = {
  id: string;
  email: string;
  emailNormalized?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: "patient" | "parent" | "provider" | "admin";
  timezone?: string;
  onboardingComplete?: boolean;
  onboardingCompletedAt?: string;
  accountStatus?: "active" | "pending" | "disabled" | "deleted";
  language?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  lastLoginAt?: string;
  passwordUpdatedAt?: string;
  notificationsEnabled?: boolean;
  smsEnabled?: boolean;
  emailNotificationsEnabled?: boolean;
  calendarSyncEnabled?: boolean;
  themeMode?: "light" | "dark";
  colorPalette?: string;
  patientProfile?: Record<string, unknown>;
  providerProfile?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export async function authSignup(
  email: string,
  password: string,
  firstName?: string,
  lastName?: string,
): Promise<AuthResponse> {
  const name = [firstName, lastName].filter(Boolean).join(" ").trim() || undefined;
  return apiPost<AuthResponse>('/auth/signup', { email, password, name, firstName, lastName });
}

export async function authLogin(email: string, password: string): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/auth/login', { email, password });
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, { method: "POST", body });
}

export async function apiPut<T>(path: string, body: unknown, authenticated = false): Promise<T> {
  return apiRequest<T>(path, { method: "PUT", body, authenticated });
}

async function apiRequest<T>(
  path: string,
  options: { method: "GET" | "POST" | "PUT"; body?: unknown; authenticated?: boolean },
): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.authenticated) {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api${path}`, {
      method: options.method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (err) {
    if (isNetworkError(err)) {
      throw new Error(apiUnreachableHelp());
    }
    throw err;
  }
  const payload = (await res.json().catch(() => null)) as ApiResponse<T> | null;

  if (!res.ok || !payload?.ok) {
    throw new Error(payload?.error ?? `API ${path} failed: ${res.status}`);
  }

  return payload.data as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: "GET" });
}

export async function apiGetAuth<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: "GET", authenticated: true });
}

export function updateAuthProfile(body: Partial<AuthUser>) {
  return apiPut<{ user: AuthUser }>('/auth/profile', body, true);
}

export function getAuthProfile() {
  return apiGetAuth<{ user: AuthUser }>('/auth/profile');
}

export function uploadPatientIntake(body: {
  insuranceComplete: boolean;
  healthComplete: boolean;
  healthSource: string;
  notes: string;
  files?: Array<{
    name: string;
    type: "insurance-front" | "insurance-back" | "health-export" | "lab-report" | "other";
    /** Data URL (data:image/jpeg;base64,...) or raw base64 */
    data: string;
  }>;
}) {
  return apiPost<UploadResponse>('/upload', body);
}

export function summarizeUpload(body: { uploadId?: string; patientId?: string }) {
  return apiPost<SummaryResponse>('/summarize', body);
}

export function findProviders(body: { summaryId?: string; patientId?: string }) {
  return apiPost<FindProvidersResponse>('/book/find-providers', body);
}

export function verifyInsurance(body: { providerId?: string; patientId?: string }) {
  return apiPost<InsuranceVerificationResponse>('/book/verify-insurance', body);
}

export function initiateCall(body: { providerId?: string; patientId?: string; summaryId?: string }) {
  return apiPost<CallSessionResponse>('/book/initiate-call', body);
}

export function createAppointment(body: { callSessionId?: string; providerId?: string }) {
  return apiPost<AppointmentResponse>('/appointments', body);
}

export function listUploads(patientId: string) {
  return apiGet<ListUploadsData>(`/upload?${new URLSearchParams({ patientId }).toString()}`);
}

export function listAppointments(patientId: string) {
  return apiGet<ListAppointmentsData>(`/appointments?${new URLSearchParams({ patientId }).toString()}`);
}

export function sendAppointmentSms(body: { appointmentId?: string; patientId?: string }) {
  return apiPost<SmsResponse>('/sms', body);
}
