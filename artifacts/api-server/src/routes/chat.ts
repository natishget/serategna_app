import { Router } from "express";
import { db } from "@workspace/db";
import { chatRooms, chatMessages, users } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();
const roomParamsSchema = z.object({ roomId: z.string().uuid() });

// Get user's chat rooms
router.get("/rooms", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }

    const allRooms = await db.select().from(chatRooms);
    const myRooms = allRooms.filter(r => (r.participants ?? []).includes(req.user!.userId));

    const enriched = await Promise.all(myRooms.map(async (room) => {
      const lastMsg = await db.query.chatMessages.findFirst({
        where: eq(chatMessages.roomId, room.id),
        orderBy: [desc(chatMessages.createdAt)],
      });
      const otherIds = (room.participants ?? []).filter((p: string) => p !== req.user!.userId);
      const otherUser = otherIds.length > 0
        ? await db.query.users.findFirst({ where: eq(users.id, otherIds[0]) })
        : null;
      return { ...room, lastMessage: lastMsg, otherUser: otherUser ? { id: otherUser.id, name: otherUser.name } : null };
    }));

    res.json({ rooms: enriched });
  } catch (err) { next(err); }
});

// Get messages for a room
router.get("/rooms/:roomId/messages", requireAuth, async (req: AuthRequest<{ roomId: string }>, res, next) => {
  try {
    if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
    const { roomId } = roomParamsSchema.parse(req.params);

    const room = await db.query.chatRooms.findFirst({ where: eq(chatRooms.id, roomId) });
    if (!room) { res.status(404).json({ error: "Room not found" }); return; }
    if (!(room.participants ?? []).includes(req.user.userId)) {
      res.status(403).json({ error: "Forbidden" }); return;
    }

    const messages = await db.select().from(chatMessages)
      .where(eq(chatMessages.roomId, roomId))
      .orderBy(chatMessages.createdAt)
      .limit(100);

    res.json({ messages });
  } catch (err) { next(err); }
});

// Send a message
router.post("/rooms/:roomId/messages", requireAuth, async (req: AuthRequest<{ roomId: string }>, res, next) => {
  try {
    if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
    const { roomId } = roomParamsSchema.parse(req.params);

    const { content, type } = z.object({
      content: z.string().min(1).max(2000),
      type: z.enum(["text", "action", "system"]).default("text"),
    }).parse(req.body);

    const room = await db.query.chatRooms.findFirst({ where: eq(chatRooms.id, roomId) });
    if (!room) { res.status(404).json({ error: "Room not found" }); return; }
    if (!(room.participants ?? []).includes(req.user.userId)) {
      res.status(403).json({ error: "Forbidden" }); return;
    }

    const [msg] = await db.insert(chatMessages).values({
      roomId,
      senderId: req.user.userId,
      content,
      type,
    }).returning();

    res.status(201).json({ message: msg });
  } catch (err) { next(err); }
});

export default router;
