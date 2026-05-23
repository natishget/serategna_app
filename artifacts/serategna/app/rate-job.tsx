import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useJobs } from "@/context/JobContext";
import { useLang } from "@/context/LanguageContext";

export default function RateJobScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { jobs, rateJob } = useJobs();
  const { t } = useLang();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const job = jobs.find((j) => j.id === id);

  const handleSubmit = async () => {
    if (rating === 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(true);
    await rateJob(id!, rating, feedback);
    setDone(true);
    setLoading(false);
  };

  if (done) {
    return (
      <View style={[styles.root, styles.doneCenter, { backgroundColor: colors.background }]}>
        <View style={[styles.doneIcon, { backgroundColor: `${colors.success}15` }]}>
          <Feather name="check-circle" size={48} color={colors.success} />
        </View>
        <Text style={[styles.doneTitle, { color: colors.foreground }]}>Job Complete!</Text>
        <Text style={[styles.doneText, { color: colors.mutedForeground }]}>
          Payment has been released. Thank you for using Serategna.
        </Text>
        <Pressable
          style={[styles.homeBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={styles.homeBtnText}>Back to Home</Text>
        </Pressable>
      </View>
    );
  }

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
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Rate Job</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={[styles.workerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: `${colors.primary}20` }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {(job?.workerName || "W").charAt(0)}
            </Text>
          </View>
          <View style={styles.workerInfo}>
            <Text style={[styles.workerName, { color: colors.foreground }]}>{job?.workerName || "Worker"}</Text>
            <Text style={[styles.jobTitle, { color: colors.mutedForeground }]}>{job?.title}</Text>
          </View>
          <View style={[styles.priceBadge, { backgroundColor: `${colors.success}15` }]}>
            <Text style={[styles.price, { color: colors.success }]}>{job?.price.toLocaleString()} ETB</Text>
          </View>
        </View>

        <Text style={[styles.question, { color: colors.foreground }]}>How was the job?</Text>

        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Pressable
              key={star}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setRating(star);
              }}
            >
              <Feather
                name="star"
                size={44}
                color={star <= rating ? colors.accent : colors.border}
              />
            </Pressable>
          ))}
        </View>

        {rating > 0 && (
          <Text style={[styles.ratingLabel, { color: colors.mutedForeground }]}>
            {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
          </Text>
        )}

        <View style={[styles.textAreaContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.textArea, { color: colors.foreground }]}
            value={feedback}
            onChangeText={setFeedback}
            placeholder="Share your experience (optional)"
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <Pressable
          style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: rating > 0 && !loading ? 1 : 0.5 }]}
          onPress={handleSubmit}
          disabled={rating === 0 || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Feather name="send" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>{t("general.submit")}</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  doneCenter: { alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 16 },
  doneIcon: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center" },
  doneTitle: { fontFamily: "Inter_700Bold", fontSize: 28 },
  doneText: { fontFamily: "Inter_400Regular", fontSize: 15, textAlign: "center", lineHeight: 22 },
  homeBtn: { height: 56, borderRadius: 16, paddingHorizontal: 40, alignItems: "center", justifyContent: "center", marginTop: 8 },
  homeBtnText: { fontFamily: "Inter_700Bold", fontSize: 17, color: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 20, flex: 1, textAlign: "center" },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 28, gap: 24, alignItems: "center" },
  workerCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: "Inter_700Bold", fontSize: 22 },
  workerInfo: { flex: 1, gap: 3 },
  workerName: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  jobTitle: { fontFamily: "Inter_400Regular", fontSize: 13 },
  priceBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  price: { fontFamily: "Inter_700Bold", fontSize: 14 },
  question: { fontFamily: "Inter_700Bold", fontSize: 22, textAlign: "center" },
  stars: { flexDirection: "row", gap: 8 },
  ratingLabel: { fontFamily: "Inter_500Medium", fontSize: 15, marginTop: -12 },
  textAreaContainer: { width: "100%", borderWidth: 1.5, borderRadius: 12, padding: 14, minHeight: 90 },
  textArea: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 22 },
  submitBtn: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitBtnText: { fontFamily: "Inter_700Bold", fontSize: 17, color: "#fff" },
});
