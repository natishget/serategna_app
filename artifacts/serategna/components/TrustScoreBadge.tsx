import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  verified?: boolean;
  topMatch?: boolean;
}

export function TrustScoreBadge({
  score,
  size = "md",
  showLabel = true,
  verified = false,
  topMatch = false,
}: Props) {
  const colors = useColors();

  const getColor = () => {
    if (score >= 800) return colors.success;
    if (score >= 600) return colors.warning;
    return colors.destructive;
  };

  const getLabel = () => {
    if (topMatch) return "Top Match";
    if (verified) return "Verified";
    if (score >= 800) return "Excellent";
    if (score >= 600) return "Good";
    return "Building";
  };

  const sizes = {
    sm: { container: 36, text: 12, label: 10 },
    md: { container: 48, text: 16, label: 11 },
    lg: { container: 72, text: 24, label: 13 },
  };

  const s = sizes[size];
  const color = getColor();

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.badge,
          {
            width: s.container,
            height: s.container,
            borderRadius: s.container / 2,
            backgroundColor: `${color}20`,
            borderColor: color,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <Text style={[styles.score, { fontSize: s.text, color }]}>{score}</Text>
        {verified && (
          <Text
            style={{ position: "absolute", right: 4, bottom: 4, color: colors.success, fontSize: 14 }}
          >
            ✔️
          </Text>
        )}
        {topMatch && (
          <Text
            style={{ position: "absolute", left: 4, top: 4, color: colors.accent, fontSize: 14 }}
          >
            ★
          </Text>
        )}
      </View>
      {showLabel && (
        <Text
          style={[styles.label, { fontSize: s.label, color: colors.mutedForeground }]}
        >
          {getLabel()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    gap: 4,
  },
  badge: {
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  score: {
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  label: {
    fontFamily: "Inter_500Medium",
  },
});
