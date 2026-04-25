export interface Patient {
  id: string;
  worldIdProof: string;
  language: 'en' | 'es' | 'ko';
  name: string;
  dob: string;
  phone: string;
  timezone: string;
  role: 'patient' | 'parent';
  createdAt: Date;
}
