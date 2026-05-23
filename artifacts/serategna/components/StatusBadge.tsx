import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { type JobStatus } from "@/context/JobContext";
import { useColors } from "@/hooks/useColors";
import { useLang } from "@/context/LanguageContext";

interface Props {
  status: JobStatus;
}

export function StatusBadge({ status }: Props) {
  const colors = useColors();
  const { t } = useLang();

  const statusConfig: Record<JobStatus, { color: string; bgKey: keyof typeof colors }> = {
    requested: { color: colors.statusRequested, bgKey: "warningLight" },
    matched: { color: colors.statusMatched, bgKey: "infoLight" },
    funded: { color: "#7C3AED", bgKey: "muted" },
    active: { color: colors.statusActive, bgKey: "successLight" },
    completed: { color: colors.statusCompleted, bgKey: "successLight" },
    rated: { color: colors.statusRated, bgKey: "muted" },
    cancelled: { color: colors.destructive, bgKey: "destructive" },
  };

  const config = statusConfig[status];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors[config.bgKey] as string },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.text, { color: config.color }]}>
        {t(`job.status.${status}`)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 0.2,
  },
});
