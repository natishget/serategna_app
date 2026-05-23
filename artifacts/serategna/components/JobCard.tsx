import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { StatusBadge } from "@/components/StatusBadge";
import { useColors } from "@/hooks/useColors";
import { type Job } from "@/context/JobContext";
import { useLang } from "@/context/LanguageContext";

const CATEGORY_ICONS: Record<string, string> = {
  construction: "tool",
  cleaning: "wind",
  plumbing: "droplet",
  electrical: "zap",
  driving: "truck",
  cooking: "coffee",
  gardening: "feather",
  moving: "package",
  security: "shield",
  other: "briefcase",
};

interface Props {
  job: Job;
  onPress?: () => void;
  showActions?: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
}

export function JobCard({ job, onPress, showActions, onAccept, onDecline }: Props) {
  const colors = useColors();
  const { t } = useLang();

  const iconName = (CATEGORY_ICONS[job.category] ?? "briefcase") as any;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.95 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}
      onPress={handlePress}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
          <Feather name={iconName} size={20} color={colors.primary} />
        </View>
        <View style={styles.titleGroup}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
            {job.title}
          </Text>
          <Text style={[styles.employer, { color: colors.mutedForeground }]}>
            {job.employerName}
          </Text>
        </View>
        <StatusBadge status={job.status} />
      </View>

      <Text style={[styles.description, { color: colors.mutedForeground }]} numberOfLines={2}>
        {job.description}
      </Text>

      <View style={styles.footer}>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Feather name="map-pin" size={13} color={colors.mutedForeground} />
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>
              {job.location.address.split(",")[0]}
            </Text>
          </View>
          {job.distance !== undefined && (
            <View style={styles.metaItem}>
              <Feather name="navigation" size={13} color={colors.mutedForeground} />
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                {job.distance} {t("general.km")}
              </Text>
            </View>
          )}
        </View>
        <View style={[styles.priceTag, { backgroundColor: `${colors.primary}15` }]}>
          <Text style={[styles.price, { color: colors.primary }]}>
            {job.price.toLocaleString()} {t("general.etb")}
          </Text>
        </View>
      </View>

      {showActions && (
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              styles.declineBtn,
              { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onDecline?.(); }}
          >
            <Feather name="x" size={18} color={colors.mutedForeground} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              styles.acceptBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onAccept?.(); }}
          >
            <Feather name="check" size={18} color="#fff" />
            <Text style={styles.acceptText}>{t("job.accept")}</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  titleGroup: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  employer: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  description: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  meta: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  priceTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  price: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 4,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  declineBtn: {
    flex: 0,
    width: 48,
    borderWidth: 1.5,
  },
  acceptBtn: {},
  acceptText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
});
