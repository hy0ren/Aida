import type {
  AppointmentResponse,
  BiometricMetric,
  CallSessionResponse,
  FindProvidersResponse,
  InsuranceProfile,
  InsuranceVerificationResponse,
  ProviderOption,
  SmsResponse,
  SummaryResponse,
  UploadResponse,
} from '@aida/shared';

export const demoPatient = {
  id: 'pat_maria_rivera',
  name: 'Maria Rivera',
  dob: '1988-04-18',
  phone: '+14155550148',
  language: 'Spanish',
  timezone: 'America/Los_Angeles',
};

export const demoInsurance: InsuranceProfile = {
  carrier: 'Aetna',
  plan: 'Choice POS II',
  memberId: 'XGH 482-19-7720',
  groupNumber: '884216',
  payerPhone: '+18008723867',
  network: 'Aetna Choice POS II',
  estimatedCopay: 25,
};

export const demoBiometrics: BiometricMetric[] = [
  {
    label: 'Resting HR',
    value: '78',
    unit: 'bpm',
    baseline: '66 bpm',
    status: 'flagged',
    detail: '+12 above usual baseline for three days',
  },
  {
    label: 'Sleep',
    value: '65',
    unit: '/100',
    baseline: '82/100',
    status: 'flagged',
    detail: 'Sleep quality and duration are lower than usual',
  },
  {
    label: 'HRV',
    value: '42',
    unit: 'ms',
    baseline: '58 ms',
    status: 'flagged',
    detail: 'Lower recovery trend over the past 72 hours',
  },
  {
    label: 'Steps',
    value: '5.2k',
    baseline: '6.8k',
    status: 'normal',
    detail: 'Activity is slightly below normal range',
  },
];

export const demoProviders: ProviderOption[] = [
  {
    id: 'prov_bayview_chen',
    name: 'Bayview Family Medicine',
    doctor: 'Dr. Lin Chen',
    specialty: 'General Practitioner',
    distance: '0.4 mi',
    address: '1840 Mission St, San Francisco',
    phone: '+14155550191',
    nextAvailable: '2026-05-06T14:30:00-07:00',
    networkStatus: 'in-network',
    languages: ['English', 'Spanish'],
  },
  {
    id: 'prov_mission_okonkwo',
    name: 'Mission Heart & Vascular',
    doctor: 'Dr. Ruth Okonkwo',
    specialty: 'Cardiology',
    distance: '1.1 mi',
    address: '2301 Mission St, San Francisco',
    phone: '+14155550192',
    nextAvailable: '2026-05-07T09:00:00-07:00',
    networkStatus: 'in-network',
    languages: ['English'],
  },
  {
    id: 'prov_sunset_vasquez',
    name: 'Sunset Internal Medicine',
    doctor: 'Dr. Paula Vasquez',
    specialty: 'Internal Medicine',
    distance: '2.0 mi',
    address: '1199 Irving St, San Francisco',
    phone: '+14155550193',
    nextAvailable: '2026-05-08T11:00:00-07:00',
    networkStatus: 'review-plan',
    languages: ['English', 'Spanish'],
  },
];

export const demoUploadResponse: UploadResponse = {
  uploadId: 'upl_maria_20260425',
  patientId: demoPatient.id,
  insurance: demoInsurance,
  biometrics: demoBiometrics,
  files: [
    {
      id: 'file_ins_front',
      name: 'aetna_card_front.jpg',
      type: 'insurance-front',
      source: 'mobile-camera',
      status: 'processed',
    },
    {
      id: 'file_ins_back',
      name: 'aetna_card_back.jpg',
      type: 'insurance-back',
      source: 'mobile-camera',
      status: 'processed',
    },
    {
      id: 'file_apple_health',
      name: 'apple_health_export.zip',
      type: 'biometric-export',
      source: 'Apple Health',
      status: 'processed',
    },
  ],
  notes:
    'Fatigue for three days, dizziness when standing, and a higher than usual resting heart rate. Prefers Spanish updates.',
  readyForSummary: true,
};

export const demoSummaryResponse: SummaryResponse = {
  summaryId: 'sum_maria_20260425',
  patientId: demoPatient.id,
  uploadId: demoUploadResponse.uploadId,
  specialtyRecommendation: 'General practitioner or cardiology screening',
  urgency: 'soon',
  summary:
    'Maria Rivera reports three days of fatigue and dizziness when standing. Her wearable data shows resting heart rate elevated to 78 bpm versus a 66 bpm baseline, with lower sleep score and reduced HRV over the same period. She denies emergency symptoms in the intake notes, but the trend may warrant evaluation for illness, stress response, dehydration, medication effects, or cardiovascular strain. Please review symptoms, vitals, and whether further cardiac screening is appropriate.',
  shareItems: [
    'Approved clinician summary',
    'Aetna Choice POS II insurance details',
    'Last 30 days of wearable trends',
    'Preferred language: Spanish',
  ],
  biometricHighlights: demoBiometrics.filter((metric) => metric.status === 'flagged'),
};

export function findProvidersResponse(summaryId = demoSummaryResponse.summaryId): FindProvidersResponse {
  return {
    patientId: demoPatient.id,
    summaryId,
    recommendedVisit: 'General practitioner or cardiology screening for elevated resting heart rate and fatigue.',
    providers: demoProviders,
  };
}

export function verifyInsuranceResponse(providerId = demoProviders[0].id): InsuranceVerificationResponse {
  const provider = demoProviders.find((item) => item.id === providerId) ?? demoProviders[0];
  const verified = provider.networkStatus === 'in-network';

  return {
    verificationId: `ver_${provider.id}`,
    patientId: demoPatient.id,
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
    callSessionId: `call_${provider.id}_20260425`,
    patientId: demoPatient.id,
    providerId: provider.id,
    clinicName: provider.name,
    status: 'calling',
    stages: ['Calling clinic', 'Connected', 'Verifying insurance', 'Confirmed'],
    transcript: [
      `Aida: Hi, I am calling on behalf of ${demoPatient.name} to schedule a visit.`,
      `Clinic: What insurance and reason for visit?`,
      `Aida: ${demoInsurance.carrier} ${demoInsurance.plan}. Elevated resting heart rate and fatigue for three days.`,
      `Clinic: ${provider.doctor} has Wednesday, May 6 at 2:30 PM.`,
      'Aida: That works. Please book it and send the confirmation to Maria.',
    ],
    appointment: {
      providerId: provider.id,
      doctor: provider.doctor,
      specialty: provider.specialty,
      clinicName: provider.name,
      address: provider.address,
      scheduledAt: '2026-05-06T14:30:00-07:00',
    },
  };
}

export const demoAppointmentResponse: AppointmentResponse = {
  appointmentId: 'appt_maria_chen_20260506',
  patientId: demoPatient.id,
  providerId: demoProviders[0].id,
  doctor: demoProviders[0].doctor,
  specialty: demoProviders[0].specialty,
  clinicName: demoProviders[0].name,
  address: demoProviders[0].address,
  scheduledAt: '2026-05-06T14:30:00-07:00',
  status: 'confirmed',
  preparation: ['Bring insurance card and photo ID', 'Bring current medication list', 'Arrive 15 minutes early'],
};

export const demoSmsResponse: SmsResponse = {
  smsId: 'sms_maria_confirmation_20260425',
  patientId: demoPatient.id,
  appointmentId: demoAppointmentResponse.appointmentId,
  to: demoPatient.phone,
  language: 'es',
  status: 'sent',
  message:
    'Aida: Cita confirmada con Dr. Lin Chen el miercoles 6 de mayo a las 2:30 PM. Responde CANCELAR para anular.',
};
