import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const otpSessions = pgTable("otp_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  phone: text("phone").notNull(),
  code: text("code").notNull(),
  used: boolean("used").notNull().default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOtpSchema = createInsertSchema(otpSessions).omit({ id: true, createdAt: true });
export type OtpSession = typeof otpSessions.$inferSelect;
export type InsertOtp = z.infer<typeof insertOtpSchema>;
