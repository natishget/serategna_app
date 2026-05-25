import { Router } from "express";
import { db } from "../db";
import { otpSessions, users } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { signToken, type AuthRole } from "../lib/jwt.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { hash, compare } from "bcryptjs";
import {
  faydaIdSchema,
  normalizePhoneNumber,
  otpSendSchema,
  otpVerifySchema,
} from "@workspace/api-zod";

const router = Router();
const DEV_OTP_CODE = "123456";
const isDevelopment = process.env.NODE_ENV === "development";

// Send OTP (mock — always sends 123456 in demo)
router.post("/otp/send", async (req, res, next) => {
  try {
    const { phone } = otpSendSchema.parse(req.body);
    const normalizedPhone = normalizePhoneNumber(phone);
    const existingUser = await db.query.users.findFirst({
      where: eq(users.phone, normalizedPhone),
    });

    // Store OTP in DB (expires in 5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const code =
      process.env.NODE_ENV === "production"
        ? String(Math.floor(100000 + Math.random() * 900000))
        : DEV_OTP_CODE;
    const hashedCode = await hash(code, 10);

    try {
      await db
        .insert(otpSessions)
        .values({ phone: normalizedPhone, code: hashedCode, expiresAt });
    } catch (dbErr) {
      // For demo: if DB insert fails (e.g., duplicate), still return success
      console.log("DB insert error (demo mode - ignoring):", dbErr);
    }

    // In production send via Telebirr/SMS. For demo we return the code.
    res.json({
      success: true,
      existingUser: !!existingUser,
      ...(process.env.NODE_ENV !== "production" ? { code } : {}),
    });
  } catch (err) {
    console.log("Error sending OTP:", err);
    next(err);
  }
});

// Verify OTP & return JWT
router.post("/otp/verify", async (req, res, next) => {
  try {
    const { phone, code, role, name } = otpVerifySchema.parse(req.body);
    const normalizedPhone = normalizePhoneNumber(phone);

    console.log("this is the code from the frontend", code);

    if (isDevelopment) {
      if (code !== DEV_OTP_CODE) {
        res
          .status(401)
          .json({ error: `Invalid development OTP. Use ${DEV_OTP_CODE}` });
        return;
      }

      const userResult = await findOrCreateUser({
        phone: normalizedPhone,
        role,
        name,
      });
      const token = signToken({
        userId: userResult.user.id,
        role: userResult.user.role,
      });
      res.json({
        token,
        user: serializeUser(userResult.user),
        isNewUser: userResult.isNewUser,
      });
      return;
    }

    // Validate OTP
    const sessions = await db.query.otpSessions.findMany({
      where: and(
        eq(otpSessions.phone, normalizedPhone),
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
    await db
      .update(otpSessions)
      .set({ used: true })
      .where(eq(otpSessions.id, validSession.id));

    // Upsert user
    const userResult = await findOrCreateUser({
      phone: normalizedPhone,
      role,
      name,
    });

    const token = signToken({
      userId: userResult.user.id,
      role: userResult.user.role,
    });
    res.json({
      token,
      user: serializeUser(userResult.user),
      isNewUser: userResult.isNewUser,
    });
  } catch (err) {
    next(err);
  }
});

// Verify Fayda ID (mock)
router.post(
  "/fayda/verify",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const parsed = faydaIdSchema.safeParse(req.body.faydaId);
      if (!parsed.success) {
        res.status(400).json({
          error: parsed.error.issues[0]?.message ?? "Invalid Fayda ID",
        });
        return;
      }
      const faydaId = parsed.data;

      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      // Check if first-time verification
      const existing = await db.query.users.findFirst({
        where: eq(users.id, req.user.userId),
      });
      const scoreBoost = existing && !existing.faydaVerified ? 50 : 0;

      await db
        .update(users)
        .set({
          faydaId,
          faydaVerified: true,
          trustScore: Math.min(
            1000,
            (existing?.trustScore ?? 400) + scoreBoost,
          ),
          updatedAt: new Date(),
        })
        .where(eq(users.id, req.user.userId));

      const user = await db.query.users.findFirst({
        where: eq(users.id, req.user.userId),
      });
      res.json({ success: true, user: serializeUser(user!) });
    } catch (err) {
      next(err);
    }
  },
);

// Get current user
router.get("/me", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user.userId),
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ user: serializeUser(user) });
  } catch (err) {
    next(err);
  }
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
}): Promise<{ user: typeof users.$inferSelect; isNewUser: boolean }> {
  const existingUser = await db.query.users.findFirst({
    where: eq(users.phone, phone),
  });

  if (existingUser) {
    if (name && !existingUser.name) {
      const [updatedUser] = await db
        .update(users)
        .set({ name, updatedAt: new Date() })
        .where(eq(users.id, existingUser.id))
        .returning();
      return { user: updatedUser, isNewUser: false };
    }

    return { user: existingUser, isNewUser: false };
  }

  const [createdUser] = await db
    .insert(users)
    .values({
      phone,
      role,
      name: name ?? "",
      trustScore: 400,
      walletBalance: 0,
    })
    .returning();

  return { user: createdUser, isNewUser: true };
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
    rating:
      u.ratingCount > 0
        ? Math.round((u.ratingSum / u.ratingCount) * 10) / 10
        : 0,
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
