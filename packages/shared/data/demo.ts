export type DemoLanguageCode = "en" | "es" | "ko";
export type DemoAppointmentStatus = "Booked" | "Confirmed" | "Completed" | "Open" | "Held";
export type DemoMetricStatus = "attention" | "stable";

export interface DemoPatientProfile {
  id: string;
  worldIdProof: string;
  role: "patient" | "parent";
  firstName: string;
  lastName: string;
  name: string;
  age: number;
  dob: string;
  phone: string;
  timezone: string;
  emergencyContact: string;
  preferredLanguage: {
    code: DemoLanguageCode;
    label: string;
    confirmationLabel: string;
  };
  createdAt: string;
}

export interface DemoInsuranceData {
  carrier: string;
  plan: string;
  memberId: string;
  groupNumber: string;
  payerPhone: string;
  networkStatus: string;
  estimatedCopayAmount: number;
  estimatedCopay: string;
  acceptedLabel: string;
  detectedLabel: string;
}

export interface DemoBiometricMetric {
  id: string;
  label: string;
  shortLabel: string;
  value: string;
  unit?: string;
  detail: string;
  summaryDetail: string;
  status: DemoMetricStatus;
  wide?: boolean;
}

export interface DemoHealthSummary {
  id: string;
  headline: string;
  detail: string;
  suggestedVisit: string;
  approvedSummary: string;
  notesForAida: string;
  lastSyncLabel: string;
  uploadFiles: {
    name: string;
    detail: string;
  }[];
  manualMeasurements: {
    restingHeartRate: string;
    hrv: string;
    sleep: string;
    bloodPressure: string;
    symptoms: string;
  };
}

export interface DemoProviderClinic {
  id: string;
  name: string;
  doctor: string;
  specialty: string;
  distance: string;
  address: string;
  nextAvailable: string;
  network: string;
  phone: string;
}

export interface DemoSelectedAppointment {
  id: string;
  patientId: string;
  clinicId: string;
  providerId: string;
  status: "Confirmed";
  scheduledAt: string;
  dateLabel: string;
  timeLabel: string;
  shortDateTime: string;
  displayDateTime: string;
  visitType: string;
  reason: string;
  bookedBy: string;
  confirmationSent: boolean;
  confirmationChannel: "expo-push";
}

export interface DemoConfirmationReceipt {
  id: string;
  appointmentId: string;
  sentAt: string;
  toMasked: string;
  language: DemoLanguageCode;
  channel: "expo-push" | "in-app";
  title: string;
  body: string;
}

export interface DemoProviderIntakeDetails {
  clinicEmail: string;
  clinicCode: string;
  visitsToday: number;
  aiBookedNeedingReview: number;
  intakeStatus: string;
  callStages: string[];
  callTranscript: string[];
  availabilityRules: string[];
  scheduleSlots: {
    time: string;
    status: DemoAppointmentStatus;
    patient: string;
  }[];
  pendingConfirmations: {
    name: string;
    detail: string;
  }[];
  patientRoster: {
    id: string;
    name: string;
    age: number;
    time: string;
    reason: string;
    language: string;
    status: string;
    specialty: string;
    insurance: string;
    flagged: boolean;
  }[];
}

export interface DemoAppointmentHistoryItem {
  id: string;
  patientName: string;
  clinicName: string;
  providerName: string;
  reason: string;
  specialty: string;
  status: DemoAppointmentStatus | "Upcoming";
  dateTime: string;
}

export interface DemoData {
  patient: DemoPatientProfile;
  insurance: DemoInsuranceData;
  biometricMetrics: DemoBiometricMetric[];
  healthSummary: DemoHealthSummary;
  providers: DemoProviderClinic[];
  selectedAppointment: DemoSelectedAppointment;
  confirmationReceipt: DemoConfirmationReceipt;
  providerIntake: DemoProviderIntakeDetails;
  appointmentHistory: DemoAppointmentHistoryItem[];
}

const patient: DemoPatientProfile = {
  id: "patient-elena-morales",
  worldIdProof: "worldid-demo-proof-elena-morales",
  role: "patient",
  firstName: "Elena",
  lastName: "Morales",
  name: "Elena Morales",
  age: 38,
  dob: "1988-02-14",
  phone: "+1 (415) 555-4729",
  timezone: "America/Los_Angeles",
  emergencyContact: "Ana Morales",
  preferredLanguage: {
    code: "es",
    label: "Spanish",
    confirmationLabel: "espanol",
  },
  createdAt: "2026-04-25T08:30:00-07:00",
};

const providers: DemoProviderClinic[] = [
  {
    id: "clinic-bayview-family",
    name: "Bayview Family Medicine",
    doctor: "Dr. Lin Chen",
    specialty: "General Practitioner",
    distance: "0.4 mi",
    address: "1840 Mission St, San Francisco",
    nextAvailable: "Wed 2:30 PM",
    network: "In-network",
    phone: "+1 (415) 555-0184",
  },
  {
    id: "clinic-mission-heart",
    name: "Mission Heart & Vascular",
    doctor: "Dr. Ruth Okonkwo",
    specialty: "Cardiology",
    distance: "1.1 mi",
    address: "2100 Market St, San Francisco",
    nextAvailable: "Thu 9:00 AM",
    network: "In-network",
    phone: "+1 (415) 555-0191",
  },
  {
    id: "clinic-sunset-internal",
    name: "Sunset Internal Medicine",
    doctor: "Dr. Paula Vasquez",
    specialty: "Internal Medicine",
    distance: "2.0 mi",
    address: "1201 Irving St, San Francisco",
    nextAvailable: "Fri 11:00 AM",
    network: "Review plan",
    phone: "+1 (415) 555-0117",
  },
];

const selectedAppointment: DemoSelectedAppointment = {
  id: "appt-2026-05-06-bayview",
  patientId: patient.id,
  clinicId: providers[0].id,
  providerId: providers[0].id,
  status: "Confirmed",
  scheduledAt: "2026-05-06T14:30:00-07:00",
  dateLabel: "Wed, May 6",
  timeLabel: "2:30 PM",
  shortDateTime: "Wed 2:30 PM",
  displayDateTime: "Wed, May 6 at 2:30 PM",
  visitType: "General care",
  reason: "Elevated resting heart rate and fatigue",
  bookedBy: "AI-booked intake",
  confirmationSent: true,
  confirmationChannel: "expo-push",
};

export const demoData: DemoData = {
  patient,
  insurance: {
    carrier: "Aetna",
    plan: "Choice POS II",
    memberId: "DEMO-482-19-7720",
    groupNumber: "884216",
    payerPhone: "+1 (800) 555-0199",
    networkStatus: "2 in-network",
    estimatedCopayAmount: 25,
    estimatedCopay: "$25 estimated copay",
    acceptedLabel: "Aetna accepted",
    detectedLabel: "Aetna detected",
  },
  biometricMetrics: [
    {
      id: "resting-heart-rate",
      label: "Resting heart rate",
      shortLabel: "Resting HR",
      value: "78",
      unit: "bpm",
      detail: "+12 above your usual morning range",
      summaryDetail: "+12 above normal",
      status: "attention",
    },
    {
      id: "sleep-score",
      label: "Sleep score",
      shortLabel: "Sleep",
      value: "65",
      unit: "/100",
      detail: "Lower than your 7-day average",
      summaryDetail: "Lower than usual",
      status: "attention",
    },
    {
      id: "heart-rate-variability",
      label: "HRV",
      shortLabel: "HRV",
      value: "42",
      unit: "ms",
      detail: "Down 18% from your baseline",
      summaryDetail: "Down from baseline",
      status: "attention",
    },
    {
      id: "steps",
      label: "Steps",
      shortLabel: "Steps",
      value: "5,240",
      detail: "On track for your weekday goal",
      summaryDetail: "On track",
      status: "stable",
    },
    {
      id: "blood-oxygen",
      label: "Blood oxygen",
      shortLabel: "SpO2",
      value: "97",
      unit: "%",
      detail: "Within your normal range",
      summaryDetail: "Within normal range",
      status: "stable",
      wide: true,
    },
  ],
  healthSummary: {
    id: "summary-elena-2026-04-25",
    headline: "3 vitals need attention",
    detail: "Resting heart rate, sleep score, and HRV changed from your normal range.",
    suggestedVisit:
      "General practitioner or cardiology screening for elevated resting heart rate and fatigue.",
    approvedSummary:
      "Elena Morales reports three days of fatigue with a resting heart rate trending above her usual baseline. Recent wearable data shows resting HR at 78 bpm, HRV at 42 ms, and sleep score at 65/100, while blood oxygen is 97%. Please review for possible stress, viral illness, medication effect, or cardiovascular strain; patient prefers Spanish updates when possible.",
    notesForAida:
      "I have felt tired for three days and noticed my heart rate staying higher than usual. Prefer Spanish-speaking clinic staff if available.",
    lastSyncLabel: "Today",
    uploadFiles: [
      {
        name: "apple_health_export.zip",
        detail: "2.4 MB - synced just now",
      },
      {
        name: "sleep_hrv_report.pdf",
        detail: "843 KB - last 30 days",
      },
    ],
    manualMeasurements: {
      restingHeartRate: "78 bpm",
      hrv: "42 ms",
      sleep: "5h 45m",
      bloodPressure: "128/82",
      symptoms:
        "Fatigue, dizziness when standing, and higher than usual resting heart rate.",
    },
  },
  providers,
  selectedAppointment,
  confirmationReceipt: {
    id: "confirm-2026-05-06-bayview",
    appointmentId: selectedAppointment.id,
    sentAt: "2026-04-25T09:18:00-07:00",
    toMasked: "Expo push token ending 4729",
    language: "es",
    channel: "expo-push",
    title: "Cita confirmada",
    body:
      "Aida: Cita confirmada con Dr. Lin Chen el miercoles 6 de mayo a las 2:30 PM. Abre Aida para ver que traer.",
  },
  providerIntake: {
    clinicEmail: "frontdesk@bayview.example",
    clinicCode: "BAYVIEW-DEMO",
    visitsToday: 8,
    aiBookedNeedingReview: 1,
    intakeStatus: "Needs review",
    callStages: ["Calling clinic", "Connected", "Verifying insurance", "Checking availability", "Confirmed"],
    callTranscript: [
      "Aida: Hi, I am calling on behalf of Elena Morales to schedule a visit.",
      "Clinic: What insurance and reason for visit?",
      "Aida: Aetna Choice POS II. Elevated resting heart rate and fatigue for three days.",
      "Clinic: Let me check Dr. Chen's next open appointment.",
      "Clinic: Dr. Chen has Wednesday at 2:30 PM.",
      "Aida: That works. Please book it.",
    ],
    availabilityRules: ["English calls", "Aetna accepted", "15 min buffer"],
    scheduleSlots: [
      { time: selectedAppointment.shortDateTime, status: "Booked", patient: patient.name },
      { time: "Thu 9:00 AM", status: "Open", patient: "Available for agent" },
      { time: "Fri 11:00 AM", status: "Open", patient: "Available for agent" },
      { time: "Mon 1:15 PM", status: "Held", patient: "Manual review" },
    ],
    pendingConfirmations: [
      { name: "Jae Kim", detail: "Thu 9:00 AM - Cardiology" },
      { name: "Sofia Alvarez", detail: "Fri 11:00 AM - Follow-up" },
    ],
    patientRoster: [
      {
        id: patient.id,
        name: patient.name,
        age: patient.age,
        time: selectedAppointment.timeLabel,
        reason: "Elevated heart rate",
        language: patient.preferredLanguage.label,
        status: "Needs review",
        specialty: selectedAppointment.visitType,
        insurance: "Aetna POS II",
        flagged: true,
      },
      {
        id: "patient-jae-kim",
        name: "Jae Kim",
        age: 44,
        time: "Thu 9:00 AM",
        reason: "Chest tightness",
        language: "Korean",
        status: "Confirmed",
        specialty: "Cardiology",
        insurance: "Blue Shield",
        flagged: true,
      },
      {
        id: "patient-sofia-alvarez",
        name: "Sofia Alvarez",
        age: 12,
        time: "Fri 11:00 AM",
        reason: "Asthma follow-up",
        language: "Spanish",
        status: "Waiting",
        specialty: "Pediatrics",
        insurance: "Medi-Cal",
        flagged: false,
      },
      {
        id: "patient-noah-patel",
        name: "Noah Patel",
        age: 51,
        time: "Completed",
        reason: "Lab review",
        language: "English",
        status: "Completed",
        specialty: "Internal medicine",
        insurance: "United",
        flagged: false,
      },
    ],
  },
  appointmentHistory: [
    {
      id: selectedAppointment.id,
      patientName: patient.name,
      clinicName: providers[0].name,
      providerName: providers[0].doctor,
      reason: selectedAppointment.bookedBy,
      specialty: selectedAppointment.visitType,
      status: "Upcoming",
      dateTime: selectedAppointment.shortDateTime,
    },
    {
      id: "appt-jae-2026-05-07",
      patientName: "Jae Kim",
      clinicName: "Mission Heart & Vascular",
      providerName: "Dr. Ruth Okonkwo",
      reason: "Cardiology consult",
      specialty: "Cardiology",
      status: "Confirmed",
      dateTime: "Thu 9:00 AM",
    },
    {
      id: "appt-sofia-2026-05-08",
      patientName: "Sofia Alvarez",
      clinicName: "Sunset Pediatrics",
      providerName: "Dr. Naomi Grant",
      reason: "Follow-up",
      specialty: "Pediatrics",
      status: "Confirmed",
      dateTime: "Fri 11:00 AM",
    },
    {
      id: "appt-noah-2026-04-22",
      patientName: "Noah Patel",
      clinicName: "Bayview Family Medicine",
      providerName: "Dr. Lin Chen",
      reason: "Lab review",
      specialty: "Internal medicine",
      status: "Completed",
      dateTime: "Completed",
    },
  ],
};
