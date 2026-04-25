import { AppointmentResponse } from '@aida/shared';
import { ObjectId } from 'mongodb';

export type AppointmentDocument = AppointmentResponse & {
  _id?: ObjectId;
  createdAt: Date;
  callSessionId?: string;
  notes?: string;
};
