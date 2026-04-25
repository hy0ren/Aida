import { SummaryResponse } from '@aida/shared';
import { ObjectId } from 'mongodb';

export type BiometricSummaryDocument = SummaryResponse & {
  _id?: ObjectId;
  createdAt: Date;
};
