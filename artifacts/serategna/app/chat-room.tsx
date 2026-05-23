import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useChat, type ChatMessage } from "@/context/ChatContext";
import { useLang } from "@/context/LanguageContext";

const ACTION_COLORS: Record<string, string> = {
  accept_job: "#2563EB",
  fund_escrow: "#16A34A",
  complete_job: "#1A7F6E",
  sos: "#DC2626",
};

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { rooms, openRoom, sendMessage, sendAction } = useChat();
  const { t } = useLang();
  const [text, setText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const room = rooms.find((r) => r.id === id);
  if (!room) return null;

  const other = room.participants.find((p) => p.id !== user?.id) || room.participants[0];

  const handleSend = () => {
    if (!text.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendMessage(room.id, text.trim());
    setText("");
  };

  const handleAction = (action: ChatMessage["action"]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    sendAction(room.id, action);
  };

  const renderMessage = ({ item: msg }: { item: ChatMessage }) => {
    const isMe = msg.senderId === "current-user" || msg.senderId === user?.id;

    if (msg.action) {
      const actionColor = ACTION_COLORS[msg.action] || colors.primary;
      return (
        <View style={styles.actionMsgContainer}>
          <View style={[styles.actionMsg, { backgroundColor: `${actionColor}15`, borderColor: `${actionColor}30` }]}>
            <Feather name="zap" size={14} color={actionColor} />
            <Text style={[styles.actionMsgText, { color: actionColor }]}>{msg.text}</Text>
          </View>
          <Text style={[styles.msgTime, styles.actionTime, { color: colors.mutedForeground }]}>
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}>
        {!isMe && (
          <View style={[styles.msgAvatar, { backgroundColor: `${colors.primary}20` }]}>
            <Text style={[styles.msgAvatarText, { color: colors.primary }]}>{msg.senderName.charAt(0)}</Text>
          </View>
        )}
        <View style={styles.msgBubbleGroup}>
          {!isMe && (
            <Text style={[styles.msgSender, { color: colors.mutedForeground }]}>{msg.senderName}</Text>
          )}
          <View
            style={[
              styles.msgBubble,
              isMe
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
            ]}
          >
            <Text style={[styles.msgText, { color: isMe ? "#fff" : colors.foreground }]}>
              {msg.text}
            </Text>
          </View>
          <Text style={[styles.msgTime, { color: colors.mutedForeground, textAlign: isMe ? "right" : "left" }]}>
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
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
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <View style={[styles.headerAvatar, { backgroundColor: `${colors.primary}20` }]}>
          <Text style={[styles.headerAvatarText, { color: colors.primary }]}>{other.name.charAt(0)}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerName, { color: colors.foreground }]}>{other.name}</Text>
          <Text style={[styles.headerJob, { color: colors.mutedForeground }]} numberOfLines={1}>
            {room.jobTitle}
          </Text>
        </View>
        <Pressable
          style={[styles.headerAction, { backgroundColor: `${colors.info}15` }]}
          onPress={() => router.push({ pathname: "/job-detail", params: { id: room.jobId } })}
        >
          <Feather name="briefcase" size={18} color={colors.info} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={room.messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={[styles.msgList, { paddingBottom: 12 }]}
          renderItem={renderMessage}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />

        {/* In-chat action buttons */}
        <View style={[styles.actionsBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <Pressable
            style={[styles.inlineAction, { backgroundColor: `${colors.info}15`, borderColor: `${colors.info}30` }]}
            onPress={() => handleAction("accept_job")}
          >
            <Feather name="check" size={14} color={colors.info} />
            <Text style={[styles.inlineActionText, { color: colors.info }]}>{t("chat.accept_job")}</Text>
          </Pressable>
          <Pressable
            style={[styles.inlineAction, { backgroundColor: `${colors.success}15`, borderColor: `${colors.success}30` }]}
            onPress={() => handleAction("fund_escrow")}
          >
            <Feather name="lock" size={14} color={colors.success} />
            <Text style={[styles.inlineActionText, { color: colors.success }]}>{t("chat.fund_escrow")}</Text>
          </Pressable>
          <Pressable
            style={[styles.inlineAction, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30` }]}
            onPress={() => handleAction("complete_job")}
          >
            <Feather name="flag" size={14} color={colors.primary} />
            <Text style={[styles.inlineActionText, { color: colors.primary }]}>{t("chat.complete_job")}</Text>
          </Pressable>
        </View>

        {/* Input */}
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 8),
            },
          ]}
        >
          <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.textInput, { color: colors.foreground }]}
              value={text}
              onChangeText={setText}
              placeholder={t("chat.message")}
              placeholderTextColor={colors.mutedForeground}
              multiline
            />
          </View>
          <Pressable
            style={[styles.sendBtn, { backgroundColor: colors.primary, opacity: text.trim() ? 1 : 0.5 }]}
            onPress={handleSend}
            disabled={!text.trim()}
          >
            <Feather name="send" size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  headerAvatarText: { fontFamily: "Inter_700Bold", fontSize: 16 },
  headerInfo: { flex: 1, gap: 1 },
  headerName: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  headerJob: { fontFamily: "Inter_400Regular", fontSize: 12 },
  headerAction: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  msgList: { paddingHorizontal: 16, paddingTop: 12, gap: 4 },
  msgRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginVertical: 2 },
  msgRowMe: { justifyContent: "flex-end" },
  msgRowOther: { justifyContent: "flex-start" },
  msgAvatar: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  msgAvatarText: { fontFamily: "Inter_700Bold", fontSize: 13 },
  msgBubbleGroup: { maxWidth: "75%", gap: 3 },
  msgSender: { fontFamily: "Inter_500Medium", fontSize: 11, paddingLeft: 4 },
  msgBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  msgText: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 22 },
  msgTime: { fontFamily: "Inter_400Regular", fontSize: 11 },
  actionMsgContainer: { alignItems: "center", marginVertical: 8, gap: 4 },
  actionMsg: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  actionMsgText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  actionTime: { textAlign: "center" },
  actionsBar: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  inlineAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  inlineActionText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  inputContainer: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 120,
  },
  textInput: { fontFamily: "Inter_400Regular", fontSize: 15 },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
