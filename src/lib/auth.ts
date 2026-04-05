import crypto from "crypto";
import { cookies } from "next/headers";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-change-in-production";
const SESSION_NAME = "ehotels_session";

/**
 * Hash a password using PBKDF2 (simple, suitable for educational project)
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  const [salt, storedHash] = hash.split(":");
  const computed = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
  return computed === storedHash;
}

export type SessionData = {
  userId: number;
  email: string;
  role: "customer" | "employee" | "admin";
  customerId?: number;
  employeeSsn?: string;
  expiresAt: number;
};

/**
 * Create a secure JWT-like token for session management
 */
function createSessionToken(data: Omit<SessionData, "expiresAt">): string {
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  const payload = JSON.stringify({ ...data, expiresAt });

  const hmac = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("hex");

  return Buffer.from(`${payload}.${hmac}`).toString("base64");
}

/**
 * Verify and decode session token
 */
function verifySessionToken(token: string): SessionData | null {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [payloadStr, hmac] = decoded.split(".");

    const payload = JSON.parse(payloadStr);

    // Verify HMAC
    const expectedHmac = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(payloadStr)
      .digest("hex");

    if (hmac !== expectedHmac) {
      return null;
    }

    // Check expiration
    if (payload.expiresAt < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Set session cookie for user
 */
export async function setSessionCookie(sessionData: Omit<SessionData, "expiresAt">) {
  const token = createSessionToken(sessionData);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60, // 24 hours
    path: "/",
  });
}

/**
 * Get current session from cookies
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_NAME);
}

/**
 * Login user by email and password
 */
export async function loginUser(email: string, password: string) {
  let userRecord: Array<typeof user.$inferSelect>;

  try {
    userRecord = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);
  } catch (error) {
    const maybePgError = error as { code?: string; message?: string };

    if (maybePgError.code === "42P01") {
      return {
        success: false as const,
        error:
          "Authentication is not initialized. Run `npm run db:push` and `npm run db:seed`, then retry.",
        code: "AUTH_SCHEMA_MISSING" as const,
      };
    }

    throw error;
  }

  if (!userRecord[0]) {
    return { success: false as const, error: "Invalid email or password" };
  }

  const dbUser = userRecord[0];

  if (!verifyPassword(password, dbUser.passwordHash)) {
    return { success: false as const, error: "Invalid email or password" };
  }

  const role = dbUser.role as "customer" | "employee" | "admin";

  await setSessionCookie({
    userId: dbUser.userId,
    email: dbUser.email,
    role,
    customerId: dbUser.customerId || undefined,
    employeeSsn: dbUser.employeeSsn || undefined,
  });

  return { success: true as const };
}

/**
 * Logout user
 */
export async function logoutUser() {
  await clearSessionCookie();
}

/**
 * Check if user has required role (case-insensitive)
 */
export async function requireRole(...roles: Array<"customer" | "employee" | "admin">) {
  const session = await getSession();

  if (!session) {
    return null;
  }

  if (!roles.includes(session.role)) {
    return null;
  }

  return session;
}

/**
 * Require authentication (any role)
 */
export async function requireAuth() {
  return await getSession();
}
