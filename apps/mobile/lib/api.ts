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

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = (await res.json().catch(() => null)) as ApiResponse<T> | null;

  if (!res.ok || !payload?.ok) {
    throw new Error(payload?.error ?? `API ${path} failed: ${res.status}`);
  }

  return payload.data as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`);
  const payload = (await res.json().catch(() => null)) as ApiResponse<T> | null;

  if (!res.ok || !payload?.ok) {
    throw new Error(payload?.error ?? `API ${path} failed: ${res.status}`);
  }

  return payload.data as T;
}

export function uploadPatientIntake(body: {
  insuranceComplete: boolean;
  healthComplete: boolean;
  healthSource: string;
  notes: string;
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
