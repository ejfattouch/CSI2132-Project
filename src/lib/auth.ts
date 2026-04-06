import crypto from "crypto";
import { cookies } from "next/headers";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword as hashPasswordInternal, verifyPassword } from "@/lib/password";

const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-change-in-production";
const SESSION_NAME = "ehotels_session";

/**
 * Hash a password using PBKDF2 (simple, suitable for educational project)
 */
export function hashPassword(password: string): string {
  return hashPasswordInternal(password);
}

type LoginErrorCode = "INVALID_CREDENTIALS" | "AUTH_SCHEMA_MISSING" | "AUTH_UNEXPECTED";

type LoginResult =
  | { success: true }
  | {
    success: false;
    error: string;
    code: LoginErrorCode;
  };

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
  const payloadBase64 = Buffer.from(payload, "utf-8").toString("base64url");

  const hmac = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("hex");

  return `${payloadBase64}.${hmac}`;
}

/**
 * Verify and decode session token
 */
function verifySessionToken(token: string): SessionData | null {
  try {
    const splitIndex = token.indexOf(".");
    if (splitIndex <= 0) {
      return null;
    }

    const payloadBase64 = token.slice(0, splitIndex);
    const hmac = token.slice(splitIndex + 1);
    const payloadStr = Buffer.from(payloadBase64, "base64url").toString("utf-8");

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
export async function loginUser(email: string, password: string): Promise<LoginResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();

  if (!normalizedEmail || !normalizedPassword) {
    return {
      success: false as const,
      error: "Invalid email or password",
      code: "INVALID_CREDENTIALS" as const,
    };
  }

  try {
    const userRecord = await db
      .select()
      .from(user)
      .where(eq(user.email, normalizedEmail))
      .limit(1);

    if (!userRecord[0]) {
      return {
        success: false as const,
        error: "Invalid email or password",
        code: "INVALID_CREDENTIALS" as const,
      };
    }

    const dbUser = userRecord[0];

    if (!verifyPassword(normalizedPassword, dbUser.passwordHash)) {
      return {
        success: false as const,
        error: "Invalid email or password",
        code: "INVALID_CREDENTIALS" as const,
      };
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
  } catch (error) {
    const maybePgError = error as { code?: string };

    if (maybePgError.code === "42P01" || maybePgError.code === "42703") {
      return {
        success: false as const,
        error:
          "Authentication schema is not initialized. Run npm run db:push, psql -d ehotels -f src/db/migrations.sql, and npm run db:seed.",
        code: "AUTH_SCHEMA_MISSING" as const,
      };
    }

    console.error("Login unexpected error:", error);
    return {
      success: false as const,
      error: "Unexpected server error during sign-in",
      code: "AUTH_UNEXPECTED" as const,
    };
  }
}

/**
 * Logout user
 */
export async function logoutUser() {
  await clearSessionCookie();
}

/**
 * Check if user has required role and redirect if unauthorized
 * This is the primary role guard for pages/routes
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
 * Require authentication (any role) - returns session or null
 */
export async function requireAuth() {
  return await getSession();
}

/**
 * Helper to check if user has role (for guards)
 * Returns true only if session exists and role matches
 */
export async function hasRole(...roles: Array<"customer" | "employee" | "admin">): Promise<boolean> {
  const session = await getSession();
  return !!session && roles.includes(session.role);
}
