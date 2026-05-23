import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const disputeTypeEnum = pgEnum("dispute_type", ["work_not_done", "work_poor_quality", "payment_not_received", "worker_no_show", "scope_creep", "safety_incident", "other"]);
export const disputeStatusEnum = pgEnum("dispute_status", ["submitted", "under_review", "resolved", "closed"]);
export const resolutionTypeEnum = pgEnum("resolution_type", ["refund", "partial", "release", "redo"]);

export const disputes = pgTable("disputes", {
  id: uuid("id").defaultRandom().primaryKey(),
  referenceId: text("reference_id").notNull().unique(),
  jobId: uuid("job_id").notNull(),
  raisedBy: uuid("raised_by").notNull(),
  disputeType: disputeTypeEnum("dispute_type").notNull(),
  description: text("description").notNull(),
  preferredResolution: resolutionTypeEnum("preferred_resolution").notNull(),
  evidenceNotes: text("evidence_notes"),
  status: disputeStatusEnum("status").notNull().default("submitted"),
  resolution: text("resolution"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDisputeSchema = createInsertSchema(disputes).omit({ id: true, createdAt: true, updatedAt: true });
export type Dispute = typeof disputes.$inferSelect;
export type InsertDispute = z.infer<typeof insertDisputeSchema>;
