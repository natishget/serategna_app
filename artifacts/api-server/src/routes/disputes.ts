import { Router } from "express";
import { db } from "@workspace/db";
import { disputes, jobs } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();
const disputeParamsSchema = z.object({ id: z.string().uuid() });

// Raise a dispute
router.post("/", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }

    const data = z.object({
      jobId: z.string().uuid(),
      disputeType: z.enum(["work_not_done", "work_poor_quality", "payment_not_received", "worker_no_show", "scope_creep", "safety_incident", "other"]),
      description: z.string().min(20),
      preferredResolution: z.enum(["refund", "partial", "release", "redo"]),
      evidenceNotes: z.string().optional(),
    }).parse(req.body);

    // Verify job exists and user is a participant
    const job = await db.query.jobs.findFirst({ where: eq(jobs.id, data.jobId) });
    if (!job) { res.status(404).json({ error: "Job not found" }); return; }

    const isParticipant = job.employerId === req.user.userId || job.workerId === req.user.userId;
    if (!isParticipant) { res.status(403).json({ error: "Only job participants can raise disputes" }); return; }

    // Freeze escrow
    await db.update(jobs).set({ escrowStatus: "disputed", updatedAt: new Date() }).where(eq(jobs.id, data.jobId));

    const referenceId = `DSP-${Date.now().toString().slice(-6)}`;
    const [dispute] = await db.insert(disputes).values({
      ...data,
      raisedBy: req.user.userId,
      referenceId,
      status: "submitted",
    }).returning();

    res.status(201).json({ dispute });
  } catch (err) { next(err); }
});

// Get a dispute
router.get("/:id", requireAuth, async (req: AuthRequest<{ id: string }>, res, next) => {
  try {
    if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
    const { id } = disputeParamsSchema.parse(req.params);
    const dispute = await db.query.disputes.findFirst({ where: eq(disputes.id, id) });
    if (!dispute) { res.status(404).json({ error: "Dispute not found" }); return; }
    if (dispute.raisedBy !== req.user.userId) { res.status(403).json({ error: "Forbidden" }); return; }
    res.json({ dispute });
  } catch (err) { next(err); }
});

// List user disputes
router.get("/", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
    const rows = await db.select().from(disputes).where(eq(disputes.raisedBy, req.user.userId)).orderBy(disputes.createdAt);
    res.json({ disputes: rows });
  } catch (err) { next(err); }
});

export default router;
