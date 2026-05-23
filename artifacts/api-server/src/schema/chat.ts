import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const messageTypeEnum = pgEnum("message_type", ["text", "action", "system"]);

export const chatRooms = pgTable("chat_rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  jobId: uuid("job_id").notNull().unique(),
  participants: jsonb("participants").$type<string[]>().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id").notNull(),
  senderId: uuid("sender_id").notNull(),
  content: text("content").notNull(),
  type: messageTypeEnum("type").notNull().default("text"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertChatRoomSchema = createInsertSchema(chatRooms).omit({ id: true, createdAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true });
export type ChatRoom = typeof chatRooms.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatRoom = z.infer<typeof insertChatRoomSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
