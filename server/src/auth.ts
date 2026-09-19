import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const BCRYPT_ROUNDS = 12;

// ---------------------------------------------------------------------------
// JWT secret — must be set in environment (never hardcoded in production)
// ---------------------------------------------------------------------------
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return secret;
}

// ---------------------------------------------------------------------------
// Password Hashing (BR-06)
// ---------------------------------------------------------------------------

/** Hash a plaintext password using bcrypt */
export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, BCRYPT_ROUNDS);
}

/** Verify a plaintext password against a stored bcrypt hash */
export async function verifyPassword(
  plaintext: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}

// ---------------------------------------------------------------------------
// JWT Token (BR-07)
// ---------------------------------------------------------------------------

export interface JwtPayload {
  userId: number;
  role: string;
}

/**
 * Sign a JWT containing userId and role.
 * Token expires in 24 hours.
 */
export function generateToken(userId: number, role: string): string {
  const secret = getJwtSecret();
  return jwt.sign({ userId, role } satisfies JwtPayload, secret, {
    expiresIn: "24h",
  });
}

/**
 * Verify and decode a JWT.
 * Returns the decoded payload or null if invalid / expired.
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}
