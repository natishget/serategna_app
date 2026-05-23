import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { users } from "@workspace/db";
import { eq } from "drizzle-orm";
import { verifyToken, type JwtPayload } from "../lib/jwt.js";

export interface AuthRequest<P extends Record<string, string> = Record<string, string>> extends Request<P> {
  user?: JwtPayload;
}

export async function resolveApiKey(req: AuthRequest, res: Response, next: NextFunction) {
  const apiKey = req.headers["x-api-key"] as string | undefined;
  if (!apiKey) { next(); return; }

  try {
    const user = await db.query.users.findFirst({ where: eq(users.apiKey, apiKey) });
    if (!user) { res.status(401).json({ error: "Invalid API key" }); return; }
    req.user = { userId: user.id, role: user.role };
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  // Already resolved by API key middleware
  if (req.user) { next(); return; }

  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required. Use Authorization: Bearer <token> or X-API-Key: <key>" });
    return;
  }
  try {
    req.user = verifyToken(header.slice(7));
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(...roles: JwtPayload["role"][]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "Insufficient permissions", requiredRoles: roles });
      return;
    }
    next();
  };
}
