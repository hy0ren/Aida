export interface Patient {
  id: string;
  worldIdProof: string;
  language: 'en' | 'es' | 'ko';
  firstName: string;
  lastName: string;
  dob: string;
  phone: string;
  timezone: string;
  role: 'patient' | 'parent';
  expoPushToken?: string;
  createdAt: Date;
}
