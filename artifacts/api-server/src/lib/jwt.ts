import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SESSION_SECRET || "";
const JWT_EXPIRES_IN = "30d";

export const AUTH_ROLES = ["worker", "employer", "agent", "ministry"] as const;
export type AuthRole = (typeof AUTH_ROLES)[number];

export interface JwtPayload {
  userId: string;
  role: AuthRole;
}

function getJwtSecret(): string {
  if (!JWT_SECRET) {
    throw new Error("JWT secret not configured");
  }

  return JWT_SECRET;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, getJwtSecret()) as JwtPayload;
}
