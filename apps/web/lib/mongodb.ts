import { Db, MongoClient } from "mongodb";

/**
 * `MONGODB_URI` — SRV or standard connection string.
 * Optional: `MONGODB_DB_NAME` (default `aida`).
 */
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME ?? "aida";

let client: MongoClient | null = null;
let database: Db | null = null;
/** In-flight or completed index build; nulled on failure so the next getDb() retries. */
let indexPromise: Promise<void> | null = null;

export const collections = {
  uploads: "uploads",
  biometricSummaries: "biometricSummaries",
  appointments: "appointments",
  confirmationMessages: "confirmationMessages",
} as const;

export function isMongoConfigured(): boolean {
  return Boolean(uri);
}

async function ensureIndexes(db: Db): Promise<void> {
  const uploads = db.collection(collections.uploads);
  const biometricSummaries = db.collection(collections.biometricSummaries);
  const appointments = db.collection(collections.appointments);
  const confirmationMessages = db.collection(collections.confirmationMessages);
  await Promise.all([
    uploads.createIndex({ patientId: 1, createdAt: -1 }),
    uploads.createIndex({ uploadId: 1 }, { unique: true }),
    biometricSummaries.createIndex({ patientId: 1, createdAt: -1 }),
    biometricSummaries.createIndex({ summaryId: 1 }, { unique: true }),
    biometricSummaries.createIndex({ uploadId: 1 }),
    appointments.createIndex({ patientId: 1, createdAt: -1 }),
    appointments.createIndex({ appointmentId: 1 }, { unique: true }),
    confirmationMessages.createIndex({ patientId: 1, createdAt: -1 }),
    confirmationMessages.createIndex({ confirmationId: 1 }, { unique: true }),
    confirmationMessages.createIndex({ appointmentId: 1 }),
  ]);
}

export async function getDb(): Promise<Db | null> {
  if (!uri) return null;
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  if (!database) {
    database = client.db(dbName);
  }
  if (!indexPromise) {
    indexPromise = ensureIndexes(database);
  }
  try {
    await indexPromise;
  } catch (err) {
    indexPromise = null;
    throw err;
  }
  return database;
}
