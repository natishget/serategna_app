import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./AuthContext";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text?: string;
  action?: "accept_job" | "fund_escrow" | "complete_job" | "sos";
  timestamp: string;
  read: boolean;
}

export interface ChatRoom {
  id: string;
  jobId: string;
  jobTitle: string;
  participants: { id: string; name: string; role: string }[];
  messages: ChatMessage[];
  lastMessage?: ChatMessage;
  unreadCount: number;
}

interface ChatContextType {
  rooms: ChatRoom[];
  activeRoom: ChatRoom | null;
  openRoom: (roomId: string) => void;
  sendMessage: (roomId: string, text: string) => void;
  sendAction: (roomId: string, action: ChatMessage["action"]) => void;
  totalUnread: number;
}

const MOCK_ROOMS: ChatRoom[] = [
  {
    id: "room-001",
    jobId: "j-001",
    jobTitle: "Fix kitchen plumbing leak",
    participants: [
      { id: "e-001", name: "Tigist Alemu", role: "employer" },
      { id: "w-001", name: "Abebe Kebede", role: "worker" },
    ],
    messages: [
      {
        id: "m-001",
        senderId: "e-001",
        senderName: "Tigist",
        text: "Hi, can you come today?",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        read: true,
      },
      {
        id: "m-002",
        senderId: "w-001",
        senderName: "Abebe",
        text: "Yes, I can be there in 30 minutes.",
        timestamp: new Date(Date.now() - 3500000).toISOString(),
        read: true,
      },
      {
        id: "m-003",
        senderId: "e-001",
        senderName: "Tigist",
        action: "fund_escrow",
        text: "Payment secured in escrow",
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        read: true,
      },
    ],
    unreadCount: 0,
  },
  {
    id: "room-002",
    jobId: "j-002",
    jobTitle: "House deep cleaning",
    participants: [
      { id: "e-002", name: "Solomon Tesfaye", role: "employer" },
      { id: "w-001", name: "Abebe Kebede", role: "worker" },
    ],
    messages: [
      {
        id: "m-004",
        senderId: "e-002",
        senderName: "Solomon",
        text: "Are you available for house cleaning?",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        read: false,
      },
    ],
    unreadCount: 1,
  },
];

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>(MOCK_ROOMS);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setRooms([]);
      setActiveRoomId(null);
    }
  }, [isAuthenticated]);

  const activeRoom = rooms.find((r) => r.id === activeRoomId) || null;
  const totalUnread = rooms.reduce((sum, r) => sum + r.unreadCount, 0);

  const openRoom = useCallback((roomId: string) => {
    setActiveRoomId(roomId);
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? {
              ...r,
              unreadCount: 0,
              messages: r.messages.map((m) => ({ ...m, read: true })),
            }
          : r,
      ),
    );
  }, []);

  const sendMessage = useCallback((roomId: string, text: string) => {
    const msg: ChatMessage = {
      id: `m-${Date.now()}`,
      senderId: "current-user",
      senderName: "You",
      text,
      timestamp: new Date().toISOString(),
      read: true,
    };
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? { ...r, messages: [...r.messages, msg], lastMessage: msg }
          : r,
      ),
    );
  }, []);

  const sendAction = useCallback(
    (roomId: string, action: ChatMessage["action"]) => {
      const actionLabels: Record<string, string> = {
        accept_job: "Job accepted",
        fund_escrow: "Payment secured in escrow",
        complete_job: "Job marked complete",
        sos: "EMERGENCY ALERT sent",
      };
      const msg: ChatMessage = {
        id: `m-${Date.now()}`,
        senderId: "current-user",
        senderName: "You",
        action,
        text: actionLabels[action ?? ""] ?? "",
        timestamp: new Date().toISOString(),
        read: true,
      };
      setRooms((prev) =>
        prev.map((r) =>
          r.id === roomId
            ? { ...r, messages: [...r.messages, msg], lastMessage: msg }
            : r,
        ),
      );
    },
    [],
  );

  return (
    <ChatContext.Provider
      value={{
        rooms,
        activeRoom,
        openRoom,
        sendMessage,
        sendAction,
        totalUnread,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
