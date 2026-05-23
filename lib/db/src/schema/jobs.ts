import { boolean, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jobStatusEnum = pgEnum("job_status", [
  "requested",   // posted, awaiting worker
  "matched",     // worker accepted
  "funded",      // escrow locked
  "active",      // work in progress
  "completed",   // employer confirmed done
  "rated",       // both sides rated
  "cancelled",   // cancelled before start
]);

export const jobTypeEnum = pgEnum("job_type", [
  "informal",     // day labour, casual work, no contract required
  "formal",       // regular salaried / structured employment
    "gig",          // single deliverable / task-based (think Uber-style)
  "short_run",    // up to 1 week duration
  "contract",     // fixed-term contract (weeks to months)
  "seasonal",     // harvest, events, holiday peaks
  "professional", // certified / licensed skill required
  "emergency",    // immediate response, premium rate
  "remote",       // location-independent, digital delivery
  "internship",   // learning placement, reduced or stipend pay
  "mass_hire",    // bulk onboarding (10+ workers for same employer)
]);

export const jobCategoryEnum = pgEnum("job_category", [
  // Trades & crafts
  "plumbing", "electrical", "construction", "carpentry", "welding", "painting",
  // Home services
  "cleaning", "cooking", "gardening", "moving", "childcare", "eldercare",
  // Transport
  "driving", "delivery", "logistics",
  // Security
  "security", "bodyguard",
  // Professional & tech
  "it_tech", "finance_admin", "legal", "healthcare", "education", "engineering",
  // Agriculture
  "agriculture", "livestock", "fishing",
  // Hospitality & retail
  "hospitality", "retail", "events",
  // Creative
  "arts_media", "tailoring", "hairdressing",
  // Other
  "manufacturing", "other",
]);

export const urgencyEnum = pgEnum("urgency", ["flexible", "normal", "urgent"]);
export const escrowStatusEnum = pgEnum("escrow_status", ["pending", "locked", "released", "disputed", "refunded"]);

export const jobs = pgTable("jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  employerId: uuid("employer_id").notNull(),
  workerId: uuid("worker_id"),
  agentId: uuid("agent_id"),

  // Classification
  title: text("title").notNull(),
  description: text("description").notNull(),
  jobType: jobTypeEnum("job_type").notNull().default("gig"),
  category: jobCategoryEnum("category").notNull(),
  tags: jsonb("tags").$type<string[]>().default([]),            // free-form search tags
  requirements: jsonb("requirements").$type<string[]>().default([]), // skill/cert requirements

  // Lifecycle
  status: jobStatusEnum("status").notNull().default("requested"),

  // Payment (all amounts in ETB)
  price: integer("price").notNull(),
  workerAmount: integer("worker_amount").notNull(),    // 87%
  platformFee: integer("platform_fee").notNull(),      // 8%
  agentCommission: integer("agent_commission").notNull(), // 2%
  tax: integer("tax").notNull(),                       // 3%

  // Location
  location: jsonb("location").$type<{ lat: number; lng: number; address: string }>().notNull(),
  isRemote: boolean("is_remote").notNull().default(false),

  // Scheduling
  urgency: urgencyEnum("urgency").notNull().default("normal"),
  scheduledAt: timestamp("scheduled_at"),              // optional start date/time
  durationDays: integer("duration_days"),              // estimated duration

  // Mass hire support
  workerCount: integer("worker_count").notNull().default(1),   // slots requested
  workersFilled: integer("workers_filled").notNull().default(0), // slots matched

  // Escrow
  escrowStatus: escrowStatusEnum("escrow_status").notNull().default("pending"),
  paymentMethod: text("payment_method"),

  // Metadata
  aiGenerated: integer("ai_generated").notNull().default(0),
  isPublic: boolean("is_public").notNull().default(true),      // private jobs are invite-only
  externalRef: text("external_ref"),                           // third-party integration ID

  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertJobSchema = createInsertSchema(jobs).omit({ id: true, createdAt: true, updatedAt: true });
export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;
