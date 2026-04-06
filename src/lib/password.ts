import crypto from "crypto";

const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEY_LENGTH = 64;
const PBKDF2_DIGEST = "sha512";

export function hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto
        .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEY_LENGTH, PBKDF2_DIGEST)
        .toString("hex");

    return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
    const [salt, expectedHash] = stored.split(":");

    if (!salt || !expectedHash) {
        return false;
    }

    const computedHash = crypto
        .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEY_LENGTH, PBKDF2_DIGEST)
        .toString("hex");

    return computedHash === expectedHash;
}
