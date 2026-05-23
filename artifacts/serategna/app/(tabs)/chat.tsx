import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useChat } from "@/context/ChatContext";
import { useLang } from "@/context/LanguageContext";

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { rooms, totalUnread } = useChat();
  const { t } = useLang();

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffH = (now.getTime() - d.getTime()) / 3600000;
    if (diffH < 1) return `${Math.round(diffH * 60)}m`;
    if (diffH < 24) return `${Math.round(diffH)}h`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>{t("nav.chat")}</Text>
        {totalUnread > 0 && (
          <View style={[styles.totalBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.totalBadgeText}>{totalUnread}</Text>
          </View>
        )}
      </View>

      <View style={{ backgroundColor: '#FFF8E1', borderRadius: 10, padding: 12, margin: 16, marginBottom: 0 }}>
        <Text style={{ color: '#B45309', fontWeight: 'bold', marginBottom: 4 }}>In-App Communication Required</Text>
        <Text style={{ color: '#B45309' }}>
          For your safety and payment guarantee, all job-related communication must stay within this chat. This creates a legal record and protects you from outside scams.
        </Text>
      </View>

      <FlatList
        data={rooms}
        keyExtractor={(r) => r.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100) },
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: room }) => {
          const lastMsg = room.messages[room.messages.length - 1];
          const other = room.participants.find((p) => p.id !== "current-user") || room.participants[0];
          return (
            <Pressable
              style={({ pressed }) => [
                styles.roomRow,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
              onPress={() => router.push({ pathname: "/chat-room", params: { id: room.id } })}
            >
              <View style={[styles.avatar, { backgroundColor: `${colors.primary}20` }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                  {other.name.charAt(0)}
                </Text>
                <View
                  style={[
                    styles.onlineDot,
                    { backgroundColor: colors.success, borderColor: colors.card },
                  ]}
                />
              </View>

              <View style={styles.roomInfo}>
                <View style={styles.roomTopRow}>
                  <Text style={[styles.roomName, { color: colors.foreground }]}>{other.name}</Text>
                  <Text style={[styles.time, { color: colors.mutedForeground }]}>
                    {lastMsg ? formatTime(lastMsg.timestamp) : ""}
                  </Text>
                </View>
                <View style={styles.roomBottomRow}>
                  <Text
                    style={[
                      styles.lastMsg,
                      { color: room.unreadCount > 0 ? colors.foreground : colors.mutedForeground },
                      room.unreadCount > 0 && { fontFamily: "Inter_500Medium" },
                    ]}
                    numberOfLines={1}
                  >
                    {lastMsg?.action ? `[${lastMsg.action.replace(/_/g, " ")}]` : (lastMsg?.text || "")}
                  </Text>
                  {room.unreadCount > 0 && (
                    <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.unreadText}>{room.unreadCount}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.jobTitle, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {room.jobTitle}
                </Text>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="message-circle" size={40} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No conversations yet</Text>
          </View>
        }
        scrollEnabled={!!rooms.length}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, letterSpacing: -0.5, flex: 1 },
  totalBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  totalBadgeText: { fontFamily: "Inter_700Bold", fontSize: 12, color: "#fff" },
  list: { paddingHorizontal: 20, paddingTop: 12, gap: 8 },
  roomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarText: { fontFamily: "Inter_700Bold", fontSize: 20 },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  roomInfo: { flex: 1, gap: 3 },
  roomTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  roomName: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  time: { fontFamily: "Inter_400Regular", fontSize: 12 },
  roomBottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  lastMsg: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  unreadText: { fontFamily: "Inter_700Bold", fontSize: 11, color: "#fff" },
  jobTitle: { fontFamily: "Inter_400Regular", fontSize: 12 },
  empty: { alignItems: "center", gap: 12, paddingVertical: 60 },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 15 },
});
