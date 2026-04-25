import { Patient } from '@aida/shared/types/patient';
import { ObjectId } from 'mongodb';

export type PatientDocument = Omit<Patient, "id"> & {
  _id?: ObjectId;
  patientId: string;
};
