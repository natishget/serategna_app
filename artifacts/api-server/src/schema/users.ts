import { boolean, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userRoleEnum = pgEnum("user_role", ["worker", "employer", "agent", "ministry"]);

export const employerTypeEnum = pgEnum("employer_type", [
  "individual",   // private person (domestic hire)
  "company",      // registered private business
  "mass_hire",    // bulk / seasonal employer — farms, factories, events
  "vip",          // executive / high-net-worth needing specialised staff
  "ministry",     // government ministry or federal agency
  "ngo",          // non-governmental / development organisation
  "startup",      // early-stage tech or service company
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  phone: text("phone").notNull().unique(),
  role: userRoleEnum("role").notNull(),
  name: text("name").notNull().default(""),

  // Identity & verification
  faydaId: text("fayda_id"),
  faydaVerified: boolean("fayda_verified").notNull().default(false),
  birthDate: text("birth_date"),

  // Scores & financials
  trustScore: integer("trust_score").notNull().default(400),
  walletBalance: integer("wallet_balance").notNull().default(0),
  ratingSum: integer("rating_sum").notNull().default(0),
  ratingCount: integer("rating_count").notNull().default(0),
  completedJobs: integer("completed_jobs").notNull().default(0),

  // Worker-specific
  skills: jsonb("skills").$type<string[]>().default([]),
  hourlyRate: integer("hourly_rate"),
  isAvailable: boolean("is_available").notNull().default(true),
  cvUrl: text("cv_url"),
  commissionRate: integer("commission_rate").default(200), // basis points (200 = 2%)

  // Employer-specific
  employerType: employerTypeEnum("employer_type"),
  orgName: text("org_name"),              // company / ministry official name
  orgLicense: text("org_license"),        // TIN / business registration / ministry code
  massHireQuota: integer("mass_hire_quota"), // max workers per single posting
  isVip: boolean("is_vip").notNull().default(false),
  ministryCode: text("ministry_code"),    // e.g. MoLSA, MoE, MoF, MoH, MoA

  // API key for third-party / programmatic access
  apiKey: text("api_key"),

  // Shared
  location: jsonb("location").$type<{ lat: number; lng: number; address: string } | null>().default(null),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
