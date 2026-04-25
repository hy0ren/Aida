import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { getDb, isMongoConfigured } from "@/lib/mongodb";

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET ?? "aida-dev-secret-change-in-production";
const JWT_EXPIRES_IN = "7d";

const USERS_COLLECTION = "users";

export interface UserDocument {
  _id?: unknown;
  email: string;
  passwordHash: string;
  name?: string;
  role?: string;
  onboardingComplete?: boolean;
  language?: string;
  patientProfile?: Record<string, unknown>;
  providerProfile?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  onboardingComplete?: boolean;
  language?: string;
  patientProfile?: Record<string, unknown>;
  providerProfile?: Record<string, unknown>;
}

export interface AuthResult {
  ok: boolean;
  token?: string;
  user?: AuthUser;
  error?: string;
}

async function ensureUserIndexes() {
  const db = await getDb();
  if (!db) return;
  const col = db.collection(USERS_COLLECTION);
  await col.createIndex({ email: 1 }, { unique: true });
}

let indexInit: Promise<void> | null = null;

async function getUsersCollection() {
  const db = await getDb();
  if (!db) return null;
  if (!indexInit) {
    indexInit = ensureUserIndexes();
  }
  await indexInit;
  return db.collection<UserDocument>(USERS_COLLECTION);
}

function signToken(userId: string, email: string): string {
  return jwt.sign({ sub: userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): { sub: string; email: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { sub: string; email: string };
  } catch {
    return null;
  }
}

/**
 * Register a new user with email + password.
 * Returns a JWT on success.
 */
export async function signup(email: string, password: string, name?: string): Promise<AuthResult> {
  if (!email || !password) {
    return { ok: false, error: "Email and password are required." };
  }
  if (password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." };
  }

  const col = await getUsersCollection();

  // Fallback mock when Mongo is not configured
  if (!col) {
    return {
      ok: true,
      token: signToken("demo-user-id", email),
      user: { id: "demo-user-id", email, name, role: "patient" },
    };
  }

  // Check for existing user
  const existing = await col.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return { ok: false, error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const now = new Date();

  const result = await col.insertOne({
    email: email.toLowerCase().trim(),
    passwordHash,
    name: name ?? undefined,
    role: "patient",
    createdAt: now,
    updatedAt: now,
  });

  const userId = result.insertedId.toString();
  const token = signToken(userId, email);

  return {
    ok: true,
    token,
    user: { id: userId, email, name, role: "patient" },
  };
}

/**
 * Authenticate an existing user with email + password.
 * Returns a JWT on success.
 */
export async function login(email: string, password: string): Promise<AuthResult> {
  if (!email || !password) {
    return { ok: false, error: "Email and password are required." };
  }

  const col = await getUsersCollection();

  // Fallback mock when Mongo is not configured
  if (!col) {
    return {
      ok: true,
      token: signToken("demo-user-id", email),
      user: { id: "demo-user-id", email, role: "patient" },
    };
  }

  const user = await col.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return { ok: false, error: "No account found with this email." };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { ok: false, error: "Incorrect password." };
  }

  const userId = user._id!.toString();
  const token = signToken(userId, user.email);

  return {
    ok: true,
    token,
    user: {
      id: userId,
      email: user.email,
      name: user.name,
      role: user.role,
      onboardingComplete: user.onboardingComplete ?? false,
      language: user.language,
      patientProfile: user.patientProfile,
      providerProfile: user.providerProfile,
    },
  };
}

/**
 * Update a user's profile / onboarding data by userId string.
 */
export async function updateUserProfile(
  userId: string,
  data: {
    onboardingComplete?: boolean;
    role?: string;
    language?: string;
    patientProfile?: Record<string, unknown>;
    providerProfile?: Record<string, unknown>;
  },
): Promise<{ ok: boolean; error?: string }> {
  const col = await getUsersCollection();
  if (!col) return { ok: true }; // fallback mock — no-op

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(userId);
  } catch {
    return { ok: false, error: "Invalid user ID." };
  }

  await col.updateOne(
    { _id: objectId },
    { $set: { ...data, updatedAt: new Date() } },
  );

  return { ok: true };
}
