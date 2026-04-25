import {
  demoData,
  type AppointmentResponse,
  type BiometricMetric,
  type CallSessionResponse,
  type FindProvidersResponse,
  type InsuranceProfile,
  type InsuranceVerificationResponse,
  type ProviderOption,
  type SmsResponse,
  type SummaryResponse,
  type UploadResponse,
} from '@aida/shared';

export const demoPatient = demoData.patient;

export const demoInsurance: InsuranceProfile = {
  carrier: demoData.insurance.carrier,
  plan: demoData.insurance.plan,
  memberId: demoData.insurance.memberId,
  groupNumber: demoData.insurance.groupNumber,
  payerPhone: demoData.insurance.payerPhone,
  network: demoData.insurance.networkStatus,
  estimatedCopay: demoData.insurance.estimatedCopayAmount,
};

export const demoBiometrics: BiometricMetric[] = demoData.biometricMetrics.map((metric) => ({
  label: metric.label,
  value: metric.value,
  unit: metric.unit,
  baseline: metric.summaryDetail,
  status: metric.status === 'attention' ? 'flagged' : 'normal',
  detail: metric.detail,
}));

export const demoProviders: ProviderOption[] = demoData.providers.map((provider) => ({
  id: provider.id,
  name: provider.name,
  doctor: provider.doctor,
  specialty: provider.specialty,
  distance: provider.distance,
  address: provider.address,
  phone: provider.phone,
  nextAvailable: provider.nextAvailable,
  networkStatus: provider.network === 'In-network' ? 'in-network' : 'review-plan',
  languages: ['English', demoData.patient.preferredLanguage.label],
}));

export const demoUploadResponse: UploadResponse = {
  uploadId: 'upload-demo-2026-04-25',
  patientId: demoData.patient.id,
  insurance: demoInsurance,
  biometrics: demoBiometrics,
  files: [
    {
      id: 'file-insurance-front',
      name: 'insurance_front.jpg',
      type: 'insurance-front',
      source: 'mobile-camera',
      status: 'processed',
    },
    {
      id: 'file-insurance-back',
      name: 'insurance_back.jpg',
      type: 'insurance-back',
      source: 'mobile-camera',
      status: 'processed',
    },
    {
      id: 'file-health-export',
      name: demoData.healthSummary.uploadFiles[0].name,
      type: 'biometric-export',
      source: 'Apple Health',
      status: 'processed',
    },
  ],
  notes: demoData.healthSummary.notesForAida,
  readyForSummary: true,
};

export const demoSummaryResponse: SummaryResponse = {
  summaryId: demoData.healthSummary.id,
  patientId: demoData.patient.id,
  uploadId: demoUploadResponse.uploadId,
  specialtyRecommendation: demoData.selectedAppointment.visitType,
  urgency: 'soon',
  summary: demoData.healthSummary.approvedSummary,
  shareItems: [
    'Approved clinician summary',
    `${demoData.insurance.carrier} ${demoData.insurance.plan} insurance details`,
    `Preferred language: ${demoData.patient.preferredLanguage.label}`,
  ],
  biometricHighlights: demoBiometrics.filter((metric) => metric.status === 'flagged'),
};

export function findProvidersResponse(summaryId = demoSummaryResponse.summaryId): FindProvidersResponse {
  return {
    patientId: demoData.patient.id,
    summaryId,
    recommendedVisit: demoData.healthSummary.suggestedVisit,
    providers: demoProviders,
  };
}

export function verifyInsuranceResponse(providerId = demoProviders[0].id): InsuranceVerificationResponse {
  const provider = demoProviders.find((item) => item.id === providerId) ?? demoProviders[0];
  const verified = provider.networkStatus === 'in-network';

  return {
    verificationId: `verify-${provider.id}`,
    patientId: demoData.patient.id,
    providerId: provider.id,
    insurance: demoInsurance,
    eligible: verified,
    status: verified ? 'verified' : 'needs-review',
    message: verified
      ? `${provider.name} is in network. Estimated copay is $${demoInsurance.estimatedCopay}.`
      : 'Aida can still call, but the clinic should confirm plan participation before booking.',
  };
}

export function callSessionResponse(providerId = demoProviders[0].id): CallSessionResponse {
  const provider = demoProviders.find((item) => item.id === providerId) ?? demoProviders[0];

  return {
    callSessionId: `call-${provider.id}-demo`,
    patientId: demoData.patient.id,
    providerId: provider.id,
    clinicName: provider.name,
    status: 'confirmed',
    stages: demoData.providerIntake.callStages,
    transcript: demoData.providerIntake.callTranscript,
    appointment: {
      providerId: provider.id,
      doctor: provider.doctor,
      specialty: provider.specialty,
      clinicName: provider.name,
      address: provider.address,
      scheduledAt: demoData.selectedAppointment.scheduledAt,
    },
  };
}

export const demoAppointmentResponse: AppointmentResponse = {
  appointmentId: demoData.selectedAppointment.id,
  patientId: demoData.patient.id,
  providerId: demoProviders[0].id,
  doctor: demoProviders[0].doctor,
  specialty: demoProviders[0].specialty,
  clinicName: demoProviders[0].name,
  address: demoProviders[0].address,
  scheduledAt: demoData.selectedAppointment.scheduledAt,
  status: 'confirmed',
  preparation: ['Bring insurance card and photo ID', 'Bring current medication list', 'Arrive 10 minutes early'],
};

export const demoSmsResponse: SmsResponse = {
  smsId: demoData.smsReceipt.id,
  patientId: demoData.patient.id,
  appointmentId: demoData.selectedAppointment.id,
  to: demoData.smsReceipt.toMasked,
  language: demoData.patient.preferredLanguage.label,
  status: 'sent',
  message: demoData.smsReceipt.body,
};
