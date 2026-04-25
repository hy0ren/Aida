export interface Appointment {
  id: string;
  patientId: string;
  providerId: string;
  specialty: string;
  scheduledAt: Date;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  biometricSummaryId?: string;
  smsConfirmationSent: boolean;
}
