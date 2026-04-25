import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET ?? "aida-dev-secret-change-in-production";
const JWT_EXPIRES_IN = "7d";

const USERS_COLLECTION = "users";

export interface UserDocument {
  _id?: unknown;
  email: string;
  emailNormalized: string;
  passwordHash?: string;
  authProvider: "password" | "google" | "worldcoin" | "apple";
  externalAuthId?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: "patient" | "parent" | "provider" | "admin";
  timezone?: string;
  onboardingComplete: boolean;
  onboardingCompletedAt?: Date;
  accountStatus: "active" | "pending" | "disabled" | "deleted";
  language?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  lastLoginAt?: Date;
  passwordUpdatedAt?: Date;
  failedLoginCount: number;
  notificationsEnabled: boolean;
  pushNotificationsEnabled: boolean;
  expoPushToken?: string;
  emailNotificationsEnabled: boolean;
  calendarSyncEnabled: boolean;
  themeMode?: "light" | "dark";
  colorPalette?: string;
  patientProfile?: Record<string, unknown>;
  providerProfile?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface AuthUser {
  id: string;
  email: string;
  emailNormalized?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: "patient" | "parent" | "provider" | "admin";
  timezone?: string;
  onboardingComplete?: boolean;
  onboardingCompletedAt?: string;
  accountStatus?: "active" | "pending" | "disabled" | "deleted";
  language?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  lastLoginAt?: string;
  passwordUpdatedAt?: string;
  notificationsEnabled?: boolean;
  pushNotificationsEnabled?: boolean;
  expoPushToken?: string;
  emailNotificationsEnabled?: boolean;
  calendarSyncEnabled?: boolean;
  themeMode?: "light" | "dark";
  colorPalette?: string;
  patientProfile?: Record<string, unknown>;
  providerProfile?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
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
  await col.createIndex({ emailNormalized: 1 }, { unique: true, sparse: true });
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

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function toIso(value?: Date): string | undefined {
  return value ? value.toISOString() : undefined;
}

function splitFullName(name?: string): { firstName?: string; lastName?: string } {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" ") || undefined,
  };
}

function joinName(firstName?: string, lastName?: string, fallback?: string): string | undefined {
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  return fullName || fallback;
}

function serializeUser(user: UserDocument & { _id?: unknown }): AuthUser {
  const legacyName = splitFullName(user.name);
  const firstName = user.firstName ?? legacyName.firstName;
  const lastName = user.lastName ?? legacyName.lastName;
  return {
    id: String(user._id),
    email: user.email,
    emailNormalized: user.emailNormalized ?? normalizeEmail(user.email),
    name: joinName(firstName, lastName, user.name),
    firstName,
    lastName,
    phone: user.phone,
    role: user.role,
    timezone: user.timezone,
    onboardingComplete: user.onboardingComplete ?? false,
    onboardingCompletedAt: toIso(user.onboardingCompletedAt),
    accountStatus: user.accountStatus ?? "active",
    language: user.language,
    emailVerified: user.emailVerified ?? false,
    phoneVerified: user.phoneVerified ?? false,
    lastLoginAt: toIso(user.lastLoginAt),
    passwordUpdatedAt: toIso(user.passwordUpdatedAt),
    notificationsEnabled: user.notificationsEnabled ?? true,
    pushNotificationsEnabled: user.pushNotificationsEnabled ?? true,
    expoPushToken: user.expoPushToken,
    emailNotificationsEnabled: user.emailNotificationsEnabled ?? true,
    calendarSyncEnabled: user.calendarSyncEnabled ?? false,
    themeMode: user.themeMode,
    colorPalette: user.colorPalette,
    patientProfile: user.patientProfile,
    providerProfile: user.providerProfile,
    createdAt: toIso(user.createdAt),
    updatedAt: toIso(user.updatedAt),
  };
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
export async function signup(
  email: string,
  password: string,
  name?: string,
  firstName?: string,
  lastName?: string,
): Promise<AuthResult> {
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
      user: {
        id: "demo-user-id",
        email,
        emailNormalized: normalizeEmail(email),
        name: joinName(firstName, lastName, name),
        firstName: firstName ?? splitFullName(name).firstName,
        lastName: lastName ?? splitFullName(name).lastName,
        role: "patient",
        onboardingComplete: false,
        accountStatus: "active",
        language: "English",
        emailVerified: false,
        phoneVerified: false,
        notificationsEnabled: true,
        pushNotificationsEnabled: true,
        emailNotificationsEnabled: true,
        calendarSyncEnabled: false,
      },
    };
  }

  // Check for existing user
  const emailNormalized = normalizeEmail(email);
  const existing = await col.findOne({ $or: [{ emailNormalized }, { email: emailNormalized }] });
  if (existing) {
    return { ok: false, error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const now = new Date();
  const splitName = splitFullName(name);
  const resolvedFirstName = firstName ?? splitName.firstName;
  const resolvedLastName = lastName ?? splitName.lastName;
  const fullName = joinName(resolvedFirstName, resolvedLastName, name);

  const result = await col.insertOne({
    email: emailNormalized,
    emailNormalized,
    passwordHash,
    name: fullName,
    firstName: resolvedFirstName,
    lastName: resolvedLastName,
    phone: undefined,
    authProvider: "password",
    role: "patient",
    language: "English",
    timezone: undefined,
    onboardingComplete: false,
    accountStatus: "active",
    emailVerified: false,
    phoneVerified: false,
    passwordUpdatedAt: now,
    failedLoginCount: 0,
    notificationsEnabled: true,
    pushNotificationsEnabled: true,
    emailNotificationsEnabled: true,
    calendarSyncEnabled: false,
    themeMode: "light",
    colorPalette: "red",
    createdAt: now,
    updatedAt: now,
  });

  const userId = result.insertedId.toString();
  const token = signToken(userId, emailNormalized);

  return {
    ok: true,
    token,
    user: {
      id: userId,
      email: emailNormalized,
      emailNormalized,
      name: fullName,
      firstName: resolvedFirstName,
      lastName: resolvedLastName,
      role: "patient",
      onboardingComplete: false,
      accountStatus: "active",
      language: "English",
      emailVerified: false,
      phoneVerified: false,
      passwordUpdatedAt: now.toISOString(),
      notificationsEnabled: true,
      pushNotificationsEnabled: true,
      emailNotificationsEnabled: true,
      calendarSyncEnabled: false,
      themeMode: "light",
      colorPalette: "red",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
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
      user: {
        id: "demo-user-id",
        email,
        emailNormalized: normalizeEmail(email),
        role: "patient",
        onboardingComplete: true,
        accountStatus: "active",
        notificationsEnabled: true,
        pushNotificationsEnabled: true,
        emailNotificationsEnabled: true,
        calendarSyncEnabled: false,
      },
    };
  }

  const emailNormalized = normalizeEmail(email);
  const user = await col.findOne({
    $or: [{ emailNormalized }, { email: emailNormalized }],
    accountStatus: { $ne: "deleted" },
  });
  if (!user) {
    return { ok: false, error: "No account found with this email." };
  }
  if (user.accountStatus === "disabled") {
    return { ok: false, error: "This account is disabled." };
  }
  if (!user.passwordHash) {
    return { ok: false, error: "Please sign in with your account provider." };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    await col.updateOne(
      { _id: user._id },
      { $inc: { failedLoginCount: 1 }, $set: { updatedAt: new Date() } },
    );
    return { ok: false, error: "Incorrect password." };
  }

  const userId = user._id!.toString();
  const token = signToken(userId, user.email);
  const now = new Date();
  const splitName = splitFullName(user.name);
  const resolvedFirstName = user.firstName ?? splitName.firstName;
  const resolvedLastName = user.lastName ?? splitName.lastName;
  const normalizedUser = {
    emailNormalized: user.emailNormalized ?? normalizeEmail(user.email),
    authProvider: user.authProvider ?? "password",
    firstName: resolvedFirstName,
    lastName: resolvedLastName,
    name: joinName(resolvedFirstName, resolvedLastName, user.name),
    role: user.role ?? "patient",
    onboardingComplete: user.onboardingComplete ?? false,
    accountStatus: user.accountStatus ?? "active",
    emailVerified: user.emailVerified ?? false,
    phoneVerified: user.phoneVerified ?? false,
    failedLoginCount: 0,
    notificationsEnabled: user.notificationsEnabled ?? true,
    pushNotificationsEnabled: user.pushNotificationsEnabled ?? true,
    emailNotificationsEnabled: user.emailNotificationsEnabled ?? true,
    calendarSyncEnabled: user.calendarSyncEnabled ?? false,
    themeMode: user.themeMode ?? "light",
    colorPalette: user.colorPalette ?? "red",
    lastLoginAt: now,
    updatedAt: now,
  };
  await col.updateOne({ _id: user._id }, { $set: normalizedUser });

  return {
    ok: true,
    token,
    user: serializeUser({ ...user, ...normalizedUser }),
  };
}

export async function getUserById(userId: string): Promise<{ ok: boolean; user?: AuthUser; error?: string }> {
  const col = await getUsersCollection();
  if (!col) {
    return {
      ok: true,
      user: {
        id: "demo-user-id",
        email: "demo@aida.local",
        role: "patient",
        onboardingComplete: true,
        accountStatus: "active",
      },
    };
  }

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(userId);
  } catch {
    return { ok: false, error: "Invalid user ID." };
  }

  const user = await col.findOne({ _id: objectId, accountStatus: { $ne: "deleted" } });
  if (!user) return { ok: false, error: "User not found." };

  return { ok: true, user: serializeUser(user) };
}

/**
 * Update a user's profile / onboarding data by userId string.
 */
export async function updateUserProfile(
  userId: string,
  data: {
    onboardingComplete?: boolean;
    role?: "patient" | "parent" | "provider" | "admin";
    language?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    timezone?: string;
    notificationsEnabled?: boolean;
    pushNotificationsEnabled?: boolean;
    expoPushToken?: string;
    emailNotificationsEnabled?: boolean;
    calendarSyncEnabled?: boolean;
    themeMode?: "light" | "dark";
    colorPalette?: string;
    patientProfile?: Record<string, unknown>;
    providerProfile?: Record<string, unknown>;
  },
): Promise<{ ok: boolean; user?: AuthUser; error?: string }> {
  const col = await getUsersCollection();
  if (!col) return { ok: true }; // fallback mock — no-op

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(userId);
  } catch {
    return { ok: false, error: "Invalid user ID." };
  }

  const existing = await col.findOne({ _id: objectId, accountStatus: { $ne: "deleted" } });
  if (!existing) return { ok: false, error: "User not found." };

  const updateData: Partial<UserDocument> = {
    updatedAt: new Date(),
  };

  if (typeof data.onboardingComplete === "boolean") updateData.onboardingComplete = data.onboardingComplete;
  if (data.role) updateData.role = data.role;
  if (typeof data.language === "string") updateData.language = data.language;
  if (typeof data.firstName === "string") updateData.firstName = data.firstName;
  if (typeof data.lastName === "string") updateData.lastName = data.lastName;
  if (typeof data.name === "string") updateData.name = data.name;
  if (typeof data.firstName === "string" || typeof data.lastName === "string") {
    updateData.name = joinName(
      data.firstName ?? existing.firstName,
      data.lastName ?? existing.lastName,
      data.name ?? existing.name,
    );
  }
  if (typeof data.phone === "string") updateData.phone = data.phone;
  if (typeof data.timezone === "string") updateData.timezone = data.timezone;
  if (typeof data.notificationsEnabled === "boolean") updateData.notificationsEnabled = data.notificationsEnabled;
  if (typeof data.pushNotificationsEnabled === "boolean") {
    updateData.pushNotificationsEnabled = data.pushNotificationsEnabled;
  }
  if (typeof data.expoPushToken === "string") updateData.expoPushToken = data.expoPushToken;
  if (typeof data.emailNotificationsEnabled === "boolean") {
    updateData.emailNotificationsEnabled = data.emailNotificationsEnabled;
  }
  if (typeof data.calendarSyncEnabled === "boolean") updateData.calendarSyncEnabled = data.calendarSyncEnabled;
  if (data.themeMode === "light" || data.themeMode === "dark") updateData.themeMode = data.themeMode;
  if (typeof data.colorPalette === "string") updateData.colorPalette = data.colorPalette;
  if (data.patientProfile) updateData.patientProfile = data.patientProfile;
  if (data.providerProfile) updateData.providerProfile = data.providerProfile;
  if (data.onboardingComplete && !existing.onboardingCompletedAt) {
    updateData.onboardingCompletedAt = new Date();
  }

  await col.updateOne(
    { _id: objectId },
    { $set: updateData },
  );

  const updated = await col.findOne({ _id: objectId });
  return updated ? { ok: true, user: serializeUser(updated) } : { ok: false, error: "User not found." };
}
