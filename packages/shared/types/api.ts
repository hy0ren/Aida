export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface InsuranceProfile {
  carrier: string;
  plan: string;
  memberId: string;
  groupNumber: string;
  payerPhone: string;
  network: string;
  estimatedCopay: number;
}

export interface BiometricMetric {
  label: string;
  value: string;
  unit?: string;
  baseline: string;
  status: 'normal' | 'flagged';
  detail: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  type: 'insurance-front' | 'insurance-back' | 'biometric-export' | 'clinical-note';
  source: string;
  status: 'processed' | 'needs-review';
  /** When stored in Cloudinary or another CDN */
  url?: string;
  publicId?: string;
}

export interface UploadResponse {
  uploadId: string;
  patientId: string;
  insurance: InsuranceProfile;
  biometrics: BiometricMetric[];
  files: UploadedFile[];
  notes: string;
  readyForSummary: boolean;
}

/** Summary row for GET /api/upload?patientId= */
export interface UploadListItem {
  uploadId: string;
  patientId: string;
  createdAt: string;
  readyForSummary: boolean;
  fileCount: number;
  notes: string;
}

export interface ListUploadsData {
  items: UploadListItem[];
}

export interface SummaryResponse {
  summaryId: string;
  patientId: string;
  uploadId: string;
  specialtyRecommendation: string;
  urgency: 'routine' | 'soon' | 'urgent';
  summary: string;
  shareItems: string[];
  biometricHighlights: BiometricMetric[];
}

export interface ProviderOption {
  id: string;
  name: string;
  doctor: string;
  specialty: string;
  distance: string;
  address: string;
  phone: string;
  nextAvailable: string;
  networkStatus: 'in-network' | 'review-plan';
  languages: string[];
}

export interface FindProvidersResponse {
  patientId: string;
  summaryId: string;
  recommendedVisit: string;
  providers: ProviderOption[];
}

export interface InsuranceVerificationResponse {
  verificationId: string;
  patientId: string;
  providerId: string;
  insurance: InsuranceProfile;
  eligible: boolean;
  status: 'verified' | 'needs-review';
  message: string;
}

export interface CallSessionResponse {
  callSessionId: string;
  patientId: string;
  providerId: string;
  clinicName: string;
  status: 'queued' | 'calling' | 'connected' | 'confirmed';
  stages: string[];
  transcript: string[];
  appointment: {
    providerId: string;
    doctor: string;
    specialty: string;
    clinicName: string;
    address: string;
    scheduledAt: string;
  };
}

export interface AppointmentResponse {
  appointmentId: string;
  patientId: string;
  providerId: string;
  doctor: string;
  specialty: string;
  clinicName: string;
  address: string;
  scheduledAt: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  preparation: string[];
}

export interface ListAppointmentsData {
  items: AppointmentResponse[];
}

export interface SmsResponse {
  smsId: string;
  patientId: string;
  appointmentId: string;
  to: string;
  language: string;
  status: 'queued' | 'sent' | 'failed';
  message: string;
}
