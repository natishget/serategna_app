import { Router } from "express";
import { db } from "@workspace/db";
import { chatMessages, chatRooms, jobs, ratings, users } from "@workspace/db";
import { and, desc, eq, or, type SQL } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, requireRole, type AuthRequest } from "../middleware/auth.js";

const router = Router();

const MIN_BUDGET = 150;

const JOB_TYPES = [
  "informal",
  "formal",
  "gig",
  "short_run",
  "contract",
  "seasonal",
  "professional",
  "emergency",
  "remote",
  "internship",
  "mass_hire",
] as const;

const JOB_CATEGORIES = [
  "plumbing",
  "electrical",
  "construction",
  "carpentry",
  "welding",
  "painting",
  "cleaning",
  "cooking",
  "gardening",
  "moving",
  "childcare",
  "eldercare",
  "driving",
  "delivery",
  "logistics",
  "security",
  "bodyguard",
  "it_tech",
  "finance_admin",
  "legal",
  "healthcare",
  "education",
  "engineering",
  "agriculture",
  "livestock",
  "fishing",
  "hospitality",
  "retail",
  "events",
  "arts_media",
  "tailoring",
  "hairdressing",
  "manufacturing",
  "other",
] as const;

const JOB_STATUSES = [
  "requested",
  "matched",
  "funded",
  "active",
  "completed",
  "rated",
  "cancelled",
] as const;

const JOB_URGENCIES = ["flexible", "normal", "urgent"] as const;
const PAYMENT_METHODS = ["telebirr", "cbe", "bank_transfer", "cash"] as const;
const jobIdParamsSchema = z.object({ id: z.string().uuid() });

router.get("/", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { role, userId } = req.user;
    const query = z.object({
      jobType: z.enum(JOB_TYPES).optional(),
      category: z.enum(JOB_CATEGORIES).optional(),
      status: z.enum(JOB_STATUSES).optional(),
      urgency: z.enum(JOB_URGENCIES).optional(),
      isRemote: z.enum(["true", "false"]).optional(),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(50).default(20),
    }).parse(req.query);

    const offset = (query.page - 1) * query.limit;
    const baseQuery = db.select().from(jobs);

    const roleFilter =
      role === "employer" || role === "ministry"
        ? eq(jobs.employerId, userId)
        : role === "worker"
          ? or(eq(jobs.workerId, userId), eq(jobs.status, "requested"))
          : undefined;

    const filters: SQL[] = [];
    if (roleFilter) filters.push(roleFilter);
    if (query.jobType) filters.push(eq(jobs.jobType, query.jobType));
    if (query.category) filters.push(eq(jobs.category, query.category));
    if (query.status) filters.push(eq(jobs.status, query.status));
    if (query.urgency) filters.push(eq(jobs.urgency, query.urgency));
    if (query.isRemote !== undefined) {
      filters.push(eq(jobs.isRemote, query.isRemote === "true"));
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined;
    const rows = await (whereClause ? baseQuery.where(whereClause) : baseQuery)
      .orderBy(desc(jobs.createdAt))
      .limit(query.limit)
      .offset(offset);

    const enriched = await Promise.all(rows.map(enrichJob));

    res.json({
      data: enriched,
      meta: { page: query.page, limit: query.limit, hasMore: rows.length === query.limit },
      jobs: enriched,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, requireRole("employer", "ministry"), async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const data = z.object({
      title: z.string().min(3),
      description: z.string().min(10),
      jobType: z.enum(JOB_TYPES).default("gig"),
      category: z.enum(JOB_CATEGORIES),
      tags: z.array(z.string()).optional(),
      requirements: z.array(z.string()).optional(),
      price: z.number().int().min(MIN_BUDGET),
      location: z.object({ lat: z.number(), lng: z.number(), address: z.string() }),
      isRemote: z.boolean().default(false),
      urgency: z.enum(JOB_URGENCIES).default("normal"),
      scheduledAt: z.string().optional(),
      durationDays: z.number().int().optional(),
      workerCount: z.number().int().min(1).default(1),
      aiGenerated: z.number().int().default(0),
      isPublic: z.boolean().default(true),
      externalRef: z.string().optional(),
    }).parse(req.body);

    const employer = await db.query.users.findFirst({ where: eq(users.id, req.user.userId) });
    if (data.workerCount > 1 && employer?.employerType !== "mass_hire" && data.jobType !== "mass_hire") {
      data.jobType = "mass_hire";
    }

    const workerAmount = Math.round(data.price * 0.87);
    const platformFee = Math.round(data.price * 0.08);
    const agentCommission = Math.round(data.price * 0.02);
    const tax = Math.round(data.price * 0.03);

    const [job] = await db.insert(jobs).values({
      ...data,
      employerId: req.user.userId,
      workerAmount,
      platformFee,
      agentCommission,
      tax,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
    }).returning();

    const enrichedJob = await enrichJob(job);
    res.status(201).json({ data: enrichedJob, job: enrichedJob });
  } catch (err) {
    next(err);
  }
});

router.post("/bulk", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!["employer", "agent", "ministry"].includes(req.user.role)) {
      res.status(403).json({ error: "Only employers, ministries, and agents can post bulk jobs" });
      return;
    }

    const { jobs: postings } = z.object({
      jobs: z.array(z.object({
        title: z.string().min(3),
        description: z.string().min(10),
        jobType: z.enum(JOB_TYPES).default("mass_hire"),
        category: z.enum(JOB_CATEGORIES),
        price: z.number().int().min(MIN_BUDGET),
        location: z.object({ lat: z.number(), lng: z.number(), address: z.string() }),
        workerCount: z.number().int().min(1).default(1),
        urgency: z.enum(JOB_URGENCIES).default("normal"),
        isRemote: z.boolean().default(false),
        externalRef: z.string().optional(),
      })).min(1).max(50),
    }).parse(req.body);

    const created = await db.insert(jobs).values(
      postings.map((posting) => ({
        ...posting,
        employerId: req.user!.userId,
        workerAmount: Math.round(posting.price * 0.87),
        platformFee: Math.round(posting.price * 0.08),
        agentCommission: Math.round(posting.price * 0.02),
        tax: Math.round(posting.price * 0.03),
      })),
    ).returning();

    res.status(201).json({
      data: await Promise.all(created.map(enrichJob)),
      meta: { created: created.length },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", requireAuth, async (req: AuthRequest<{ id: string }>, res, next) => {
  try {
    const { id } = jobIdParamsSchema.parse(req.params);
    const job = await db.query.jobs.findFirst({ where: eq(jobs.id, id) });

    if (!job) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    const enrichedJob = await enrichJob(job);
    res.json({ data: enrichedJob, job: enrichedJob });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/accept", requireAuth, requireRole("worker"), async (req: AuthRequest<{ id: string }>, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { id } = jobIdParamsSchema.parse(req.params);
    const job = await db.query.jobs.findFirst({ where: eq(jobs.id, id) });

    if (!job) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    if (job.status !== "requested") {
      res.status(409).json({ error: "Job is no longer available" });
      return;
    }

    const newFilled = job.workersFilled + 1;
    const newStatus = newFilled >= job.workerCount ? "matched" : "requested";

    const [updated] = await db.update(jobs)
      .set({
        workerId: job.workerCount === 1 ? req.user.userId : job.workerId,
        workersFilled: newFilled,
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, id))
      .returning();

    if (job.workerCount === 1) {
      const existingRoom = await db.query.chatRooms.findFirst({ where: eq(chatRooms.jobId, id) });
      if (!existingRoom) {
        await db.insert(chatRooms).values({
          jobId: id,
          participants: [job.employerId, req.user.userId],
        });
      }
    }

    const enrichedJob = await enrichJob(updated);
    res.json({ data: enrichedJob, job: enrichedJob });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/fund-escrow", requireAuth, requireRole("employer", "ministry"), async (req: AuthRequest<{ id: string }>, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { id } = jobIdParamsSchema.parse(req.params);
    const { method } = z.object({
      method: z.enum(PAYMENT_METHODS).default("telebirr"),
    }).parse(req.body);

    const job = await db.query.jobs.findFirst({ where: eq(jobs.id, id) });
    if (!job) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    if (job.employerId !== req.user.userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    if (job.status !== "matched") {
      res.status(409).json({ error: "Job must be matched before funding" });
      return;
    }

    const employer = await db.query.users.findFirst({ where: eq(users.id, req.user.userId) });
    if (!employer || employer.walletBalance < job.price) {
      res.status(402).json({
        error: "Insufficient wallet balance",
        required: job.price,
        available: employer?.walletBalance ?? 0,
      });
      return;
    }

    await db.update(users)
      .set({ walletBalance: employer.walletBalance - job.price, updatedAt: new Date() })
      .where(eq(users.id, req.user.userId));

    const [updated] = await db.update(jobs)
      .set({ status: "funded", escrowStatus: "locked", paymentMethod: method, updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();

    const room = await db.query.chatRooms.findFirst({ where: eq(chatRooms.jobId, id) });
    if (room) {
      await db.insert(chatMessages).values({
        roomId: room.id,
        senderId: req.user.userId,
        type: "system",
        content: `${job.price.toLocaleString()} ETB secured in escrow via ${method.replace("_", " ")}.`,
      });
    }

    const enrichedJob = await enrichJob(updated);
    res.json({ data: enrichedJob, job: enrichedJob });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/start", requireAuth, async (req: AuthRequest<{ id: string }>, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { id } = jobIdParamsSchema.parse(req.params);
    const job = await db.query.jobs.findFirst({ where: eq(jobs.id, id) });

    if (!job) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    if (job.workerId !== req.user.userId && job.employerId !== req.user.userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    if (job.status !== "funded") {
      res.status(409).json({ error: "Job must be funded before starting" });
      return;
    }

    const [updated] = await db.update(jobs)
      .set({ status: "active", startedAt: new Date(), updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();

    const enrichedJob = await enrichJob(updated);
    res.json({ data: enrichedJob, job: enrichedJob });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/complete", requireAuth, requireRole("employer", "ministry"), async (req: AuthRequest<{ id: string }>, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { id } = jobIdParamsSchema.parse(req.params);
    const job = await db.query.jobs.findFirst({ where: eq(jobs.id, id) });

    if (!job) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    if (job.employerId !== req.user.userId) {
      res.status(403).json({ error: "Only employer can mark complete" });
      return;
    }

    if (job.status !== "active") {
      res.status(409).json({ error: "Job must be active to complete" });
      return;
    }

    if (job.workerId) {
      const worker = await db.query.users.findFirst({ where: eq(users.id, job.workerId) });
      if (worker) {
        await db.update(users)
          .set({
            walletBalance: worker.walletBalance + job.workerAmount,
            completedJobs: worker.completedJobs + 1,
            trustScore: Math.min(1000, worker.trustScore + 5),
            updatedAt: new Date(),
          })
          .where(eq(users.id, job.workerId));
      }
    }

    const [updated] = await db.update(jobs)
      .set({ status: "completed", completedAt: new Date(), escrowStatus: "released", updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();

    const enrichedJob = await enrichJob(updated);
    res.json({ data: enrichedJob, job: enrichedJob });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/rate", requireAuth, async (req: AuthRequest<{ id: string }>, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { id } = jobIdParamsSchema.parse(req.params);
    const { score, feedback } = z.object({
      score: z.number().int().min(1).max(5),
      feedback: z.string().optional(),
    }).parse(req.body);

    const job = await db.query.jobs.findFirst({ where: eq(jobs.id, id) });
    if (!job) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    if (job.status !== "completed") {
      res.status(409).json({ error: "Job must be completed to rate" });
      return;
    }

    const ratedId = req.user.role === "employer" || req.user.role === "ministry"
      ? job.workerId
      : job.employerId;

    if (!ratedId) {
      res.status(400).json({ error: "No counterparty to rate" });
      return;
    }

    await db.insert(ratings).values({
      jobId: job.id,
      raterId: req.user.userId,
      ratedId,
      score,
      feedback,
    });

    const ratedUser = await db.query.users.findFirst({ where: eq(users.id, ratedId) });
    if (ratedUser) {
      await db.update(users)
        .set({
          ratingSum: ratedUser.ratingSum + score,
          ratingCount: ratedUser.ratingCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ratedId));
    }

    const [updated] = await db.update(jobs)
      .set({ status: "rated", updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();

    const enrichedJob = await enrichJob(updated);
    res.json({ data: enrichedJob, job: enrichedJob });
  } catch (err) {
    next(err);
  }
});

async function enrichJob(job: typeof jobs.$inferSelect) {
  const [employer, worker] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, job.employerId) }),
    job.workerId ? db.query.users.findFirst({ where: eq(users.id, job.workerId) }) : null,
  ]);

  return {
    id: job.id,
    employerId: job.employerId,
    employerName: employer?.name ?? "Unknown",
    employerType: employer?.employerType ?? null,
    orgName: employer?.orgName ?? null,
    workerId: job.workerId,
    workerName: worker?.name ?? null,
    title: job.title,
    description: job.description,
    jobType: job.jobType,
    category: job.category,
    tags: job.tags ?? [],
    requirements: job.requirements ?? [],
    status: job.status,
    price: job.price,
    workerAmount: job.workerAmount,
    platformFee: job.platformFee,
    agentCommission: job.agentCommission,
    tax: job.tax,
    split: { worker: "87%", platform: "8%", agent: "2%", tax: "3%" },
    location: job.location,
    isRemote: job.isRemote,
    urgency: job.urgency,
    scheduledAt: job.scheduledAt,
    durationDays: job.durationDays,
    workerCount: job.workerCount,
    workersFilled: job.workersFilled,
    escrowStatus: job.escrowStatus,
    paymentMethod: job.paymentMethod,
    aiGenerated: !!job.aiGenerated,
    isPublic: job.isPublic,
    externalRef: job.externalRef,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

export default router;
