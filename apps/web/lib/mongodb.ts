import { Db, MongoClient } from "mongodb";

/**
 * `MONGODB_URI` — SRV or standard connection string.
 * Optional: `MONGODB_DB_NAME` (default `aida`).
 */
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME ?? "aida";

let client: MongoClient | null = null;
let database: Db | null = null;

export const collections = {
  uploads: "uploads",
  appointments: "appointments",
} as const;

export function isMongoConfigured(): boolean {
  return Boolean(uri);
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
  return database;
}
