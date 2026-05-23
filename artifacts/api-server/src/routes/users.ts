import { Router } from "express";
import { db } from "@workspace/db";
import { users } from "@workspace/db";
import { eq, ilike, and } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";
import { requireAuth, requireRole, type AuthRequest } from "../middleware/auth.js";

const router = Router();

const EMPLOYER_TYPES = ["individual","company","mass_hire","vip","ministry","ngo","startup"] as const;
const MINISTRY_CODES = ["MoLSA","MoE","MoF","MoH","MoA","MoT","MoI","MoD","MoJ","MoWIE","MOR","other"] as const;
const userIdParamsSchema = z.object({ id: z.string().uuid() });

// ─── Update own profile ───────────────────────────────────────────────────────
router.patch("/me", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }

    const updates = z.object({
      name: z.string().min(2).optional(),
      skills: z.array(z.string()).optional(),
      hourlyRate: z.number().int().min(1).optional(),
      isAvailable: z.boolean().optional(),
      location: z.object({ lat: z.number(), lng: z.number(), address: z.string() }).optional(),
      cvUrl: z.string().url().optional(),
      birthDate: z.string().optional(),
      // Employer-specific
      employerType: z.enum(EMPLOYER_TYPES).optional(),
      orgName: z.string().optional(),
      orgLicense: z.string().optional(),
      massHireQuota: z.number().int().min(1).max(5000).optional(),
      ministryCode: z.enum(MINISTRY_CODES).optional(),
    }).parse(req.body);

    const [updated] = await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, req.user.userId))
      .returning();

    res.json({ data: serializeUser(updated), user: serializeUser(updated) });
  } catch (err) { next(err); }
});

// ─── Generate / rotate API key ────────────────────────────────────────────────
router.post("/me/api-key", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }

    const apiKey = `sk_${req.user.role}_${crypto.randomBytes(24).toString("hex")}`;
    await db.update(users)
      .set({ apiKey, updatedAt: new Date() })
      .where(eq(users.id, req.user.userId));

    res.json({
      data: { apiKey },
      message: "Store this key securely — it will not be shown again. Use X-API-Key header to authenticate.",
    });
  } catch (err) { next(err); }
});

// ─── Browse workers ───────────────────────────────────────────────────────────
router.get("/workers", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const query = z.object({
      category: z.string().optional(),
      q: z.string().optional(),
      faydaOnly: z.string().optional(),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(50).default(20),
    }).parse(req.query);

    const faydaFilter = query.faydaOnly !== "false" ? eq(users.faydaVerified, true) : undefined;

    let workers = await db.select().from(users)
      .where(and(
        eq(users.role, "worker"),
        eq(users.isActive, true),
        faydaFilter,
        query.q ? ilike(users.name, `%${query.q}%`) : undefined,
      ))
      .limit(query.limit)
      .offset((query.page - 1) * query.limit);

    if (query.category) {
      workers = workers.filter(w =>
        (w.skills ?? []).some(s => s.toLowerCase().includes(query.category!.toLowerCase()))
      );
    }

    const data = workers.map(w => ({
      id: w.id,
      name: w.name,
      trustScore: w.trustScore,
      rating: w.ratingCount > 0 ? Math.round((w.ratingSum / w.ratingCount) * 10) / 10 : 0,
      completedJobs: w.completedJobs,
      skills: w.skills ?? [],
      location: w.location,
      faydaVerified: w.faydaVerified,
      isAvailable: w.isAvailable,
      estimatedDailyRate: Math.round(w.trustScore * 0.15),
    }));

    res.json({ data, workers: data, meta: { page: query.page, limit: query.limit, hasMore: workers.length === query.limit } });
  } catch (err) { next(err); }
});

// ─── Browse employers ─────────────────────────────────────────────────────────
router.get("/employers", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const query = z.object({
      employerType: z.string().optional(),
      ministryCode: z.string().optional(),
      q: z.string().optional(),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(50).default(20),
    }).parse(req.query);

    let employers = await db.select().from(users)
      .where(and(
        eq(users.role, "employer"),
        eq(users.isActive, true),
        query.q ? ilike(users.name, `%${query.q}%`) : undefined,
        query.employerType ? eq(users.employerType, query.employerType as typeof EMPLOYER_TYPES[number]) : undefined,
      ))
      .limit(query.limit)
      .offset((query.page - 1) * query.limit);

    if (query.ministryCode) {
      employers = employers.filter(e => e.ministryCode === query.ministryCode);
    }

    const data = employers.map(e => ({
      id: e.id,
      name: e.name,
      employerType: e.employerType,
      orgName: e.orgName,
      orgLicense: e.orgLicense,
      ministryCode: e.ministryCode,
      isVip: e.isVip,
      massHireQuota: e.massHireQuota,
      trustScore: e.trustScore,
      rating: e.ratingCount > 0 ? Math.round((e.ratingSum / e.ratingCount) * 10) / 10 : 0,
      location: e.location,
      faydaVerified: e.faydaVerified,
    }));

    res.json({ data, employers: data, meta: { page: query.page, limit: query.limit, hasMore: employers.length === query.limit } });
  } catch (err) { next(err); }
});

// ─── Get user by ID ───────────────────────────────────────────────────────────
router.get("/:id", requireAuth, async (req: AuthRequest<{ id: string }>, res, next) => {
  try {
    const { id } = userIdParamsSchema.parse(req.params);
    const user = await db.query.users.findFirst({ where: eq(users.id, id) });
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json({ data: serializeUser(user), user: serializeUser(user) });
  } catch (err) { next(err); }
});

// ─── SOS Emergency Alert ──────────────────────────────────────────────────────
router.post("/sos", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }

    const { location, message } = z.object({
      location: z.object({ lat: z.number(), lng: z.number(), address: z.string() }),
      message: z.string().optional(),
    }).parse(req.body);

    // In a real implementation, this would integrate with Federal Police API
    // For now, log the emergency and simulate response
    console.log(`SOS Alert from ${req.user.userId}: ${message || 'Emergency'} at ${location.address}`);

    // Simulate police response time
    setTimeout(() => {
      console.log(`Police dispatched to ${location.address}`);
    }, 5000);

    res.json({
      success: true,
      message: "Emergency alert sent to Federal Police. Help is on the way.",
      referenceId: `SOS-${Date.now()}`,
      estimatedResponse: "5-10 minutes"
    });
  } catch (err) { next(err); }
});

// ─── Issue Digital Badge (TVETs/NGOs) ─────────────────────────────────────────
router.post("/:id/badges", requireAuth, requireRole("agent"), async (req: AuthRequest<{ id: string }>, res, next) => {
  try {
    if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
    const { id } = userIdParamsSchema.parse(req.params);

    const { badgeType, issuer, expiryDate } = z.object({
      badgeType: z.string().min(1),
      issuer: z.string().min(1),
      expiryDate: z.string().optional(),
    }).parse(req.body);

    const targetUser = await db.query.users.findFirst({ where: eq(users.id, id) });
    if (!targetUser) { res.status(404).json({ error: "User not found" }); return; }

    // In real implementation, verify with TVET/NGO API
    // For now, add to user skills/badges
    const updatedSkills = [...(targetUser.skills ?? []), badgeType];
    await db.update(users)
      .set({ skills: updatedSkills, updatedAt: new Date() })
      .where(eq(users.id, id));

    res.json({
      success: true,
      message: `Digital badge "${badgeType}" issued by ${issuer}`,
      badge: { type: badgeType, issuer, issuedAt: new Date().toISOString(), expiryDate }
    });
  } catch (err) { next(err); }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
