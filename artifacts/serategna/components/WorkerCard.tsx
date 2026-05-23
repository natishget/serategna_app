import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { TrustScoreBadge } from "@/components/TrustScoreBadge";
import { useColors } from "@/hooks/useColors";
import { type Worker } from "@/context/JobContext";
import { useLang } from "@/context/LanguageContext";

interface Props {
  worker: Worker;
  rank?: number;
  onSelect?: () => void;
  selected?: boolean;
}

export function WorkerCard({ worker, rank, onSelect, selected }: Props) {
  const colors = useColors();
  const { t } = useLang();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: selected ? colors.primary : colors.border,
          borderWidth: selected ? 2 : 1,
          opacity: pressed ? 0.95 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSelect?.();
      }}
    >
      {rank === 1 && (
        <View style={[styles.topBadge, { backgroundColor: colors.accent }]}>
          <Text style={styles.topBadgeText}>{t("worker.top_match")}</Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.foreground }]}>{worker.name}</Text>
        <View style={styles.ratingRow}>
          <Feather name="star" size={13} color={colors.accent} />
          <Text style={[styles.rating, { color: colors.foreground }]}>
            {worker.rating.toFixed(1)}
          </Text>
          <Text style={[styles.jobs, { color: colors.mutedForeground }]}>
            · {worker.completedJobs} {t("worker.jobs_done")}
          </Text>
        </View>
        <TrustScoreBadge
          score={worker.trustScore}
          verified={worker.verified}
          topMatch={rank === 1}
          size="sm"
        />
      </View>

      <View style={styles.skills}>
        {worker.skills.slice(0, 3).map((skill) => (
          <View key={skill} style={[styles.skill, { backgroundColor: `${colors.primary}12` }]}>
            <Text style={[styles.skillText, { color: colors.primary }]}>{skill}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.rate, { color: colors.mutedForeground }]}>
          {worker.hourlyRate} {t("general.etb")}/hr
        </Text>
        {onSelect && (
          <View
            style={[
              styles.selectBtn,
              { backgroundColor: selected ? colors.primary : `${colors.primary}15` },
            ]}
          >
            <Feather name={selected ? "check" : "user-plus"} size={14} color={selected ? "#fff" : colors.primary} />
            <Text style={[styles.selectText, { color: selected ? "#fff" : colors.primary }]}>
              {selected ? "Selected" : t("worker.select")}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  topBadge: {
    position: "absolute",
    top: -1,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  topBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: "#fff",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rating: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  jobs: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  distance: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  skills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  skill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  skillText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rate: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  selectBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  selectText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
});
