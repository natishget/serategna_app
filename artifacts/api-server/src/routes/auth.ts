import { Router } from "express";
import { db } from "../db";
import { otpSessions, users } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { z } from "zod";
import { AUTH_ROLES, signToken, type AuthRole } from "../lib/jwt.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { hash, compare } from "bcryptjs";

const router = Router();
const DEV_OTP_CODE = "123456";
const isDevelopment = process.env.NODE_ENV === "development";

const otpVerifySchema = z.object({
  phone: z.string().min(10),
  code: z.string().length(6),
  role: z.enum(AUTH_ROLES),
  name: z.string().optional(),
});

// Send OTP (mock — always sends 123456 in demo)
router.post("/otp/send", async (req, res, next) => {
  try {
    const { phone } = z.object({ phone: z.string().min(10) }).parse(req.body);

    // Store OTP in DB (expires in 5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const code = process.env.NODE_ENV === "production"
      ? String(Math.floor(100000 + Math.random() * 900000))
      : DEV_OTP_CODE;
    const hashedCode = await hash(code, 10);

    try {
      await db.insert(otpSessions).values({ phone, code: hashedCode, expiresAt });
    } catch (dbErr) {
      // For demo: if DB insert fails (e.g., duplicate), still return success
      console.log("DB insert error (demo mode - ignoring):", dbErr);
    }

    // In production send via Telebirr/SMS. For demo we return the code.
    res.json({ success: true, ...(process.env.NODE_ENV !== "production" ? { code } : {}) });
  } catch (err) { 
    console.log("Error sending OTP:", err);
    next(err); 
  }
});

// Verify OTP & return JWT
router.post("/otp/verify", async (req, res, next) => {
  try {
    const { phone, code, role, name } = otpVerifySchema.parse(req.body);

    console.log("this is the code from the frontend", code);

    if (isDevelopment) {
      if (code !== DEV_OTP_CODE) {
        res.status(401).json({ error: `Invalid development OTP. Use ${DEV_OTP_CODE}` });
        return;
      }

      const user = await findOrCreateUser({ phone, role, name });
      const token = signToken({ userId: user.id, role: user.role });
      res.json({ token, user: serializeUser(user) });
      return;
    }

    // Validate OTP
    const sessions = await db.query.otpSessions.findMany({
      where: and(
        eq(otpSessions.phone, phone),
        eq(otpSessions.used, false),
        gt(otpSessions.expiresAt, new Date()),
      ),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });

    let validSession = null;
    for (const session of sessions) {
      if (await compare(code, session.code)) {
        validSession = session;
        break;
      }
    }

    if (!validSession) {
      console.log("Invalid or expired OTP");
      res.status(401).json({ error: "Invalid or expired OTP" });
      return;
    }

    // Mark OTP as used
    await db.update(otpSessions).set({ used: true }).where(eq(otpSessions.id, validSession.id));

    // Upsert user
    const user = await findOrCreateUser({ phone, role, name });

    const token = signToken({ userId: user.id, role: user.role });
    res.json({ token, user: serializeUser(user) });
  } catch (err) { next(err); }
});

// Verify Fayda ID (mock)
router.post("/fayda/verify", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { faydaId } = z.object({ faydaId: z.string().min(6) }).parse(req.body);

    if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }

    const isValid = faydaId.length >= 6;
    if (!isValid) { res.status(400).json({ error: "Invalid Fayda ID" }); return; }

    // Check if first-time verification
    const existing = await db.query.users.findFirst({ where: eq(users.id, req.user.userId) });
    const scoreBoost = existing && !existing.faydaVerified ? 50 : 0;

    await db.update(users)
      .set({
        faydaId,
        faydaVerified: true,
        trustScore: Math.min(1000, (existing?.trustScore ?? 400) + scoreBoost),
        updatedAt: new Date(),
      })
      .where(eq(users.id, req.user.userId));

    const user = await db.query.users.findFirst({ where: eq(users.id, req.user.userId) });
    res.json({ success: true, user: serializeUser(user!) });
  } catch (err) { next(err); }
});

// Get current user
router.get("/me", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
    const user = await db.query.users.findFirst({ where: eq(users.id, req.user.userId) });
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json({ user: serializeUser(user) });
  } catch (err) { next(err); }
});

// Logout (client drops the token; server just ACKs)
router.post("/logout", (_req, res) => {
  res.json({ success: true });
});

async function findOrCreateUser({
  phone,
  role,
  name,
}: {
  phone: string;
  role: AuthRole;
  name?: string;
}) {
  const existingUser = await db.query.users.findFirst({ where: eq(users.phone, phone) });

  if (existingUser) {
    if (name && !existingUser.name) {
      const [updatedUser] = await db.update(users)
        .set({ name, updatedAt: new Date() })
        .where(eq(users.id, existingUser.id))
        .returning();
      return updatedUser;
    }

    return existingUser;
  }

  const [createdUser] = await db.insert(users).values({
    phone,
    role,
    name: name ?? "",
    trustScore: 400,
    walletBalance: 0,
  }).returning();

  return createdUser;
}

function serializeUser(u: typeof users.$inferSelect) {
  return {
    id: u.id,
    phone: u.phone,
    role: u.role,
    name: u.name,
    faydaId: u.faydaId,
    faydaVerified: u.faydaVerified,
    birthDate: u.birthDate,
    trustScore: u.trustScore,
    walletBalance: u.walletBalance,
    rating: u.ratingCount > 0 ? Math.round((u.ratingSum / u.ratingCount) * 10) / 10 : 0,
    completedJobs: u.completedJobs,
    skills: u.skills ?? [],
    location: u.location,
    commissionRate: u.commissionRate,
    // Employer fields
    employerType: u.employerType,
    orgName: u.orgName,
    orgLicense: u.orgLicense,
    massHireQuota: u.massHireQuota,
    isVip: u.isVip,
    ministryCode: u.ministryCode,
    hasApiKey: !!u.apiKey,
  };
}

export default router;
