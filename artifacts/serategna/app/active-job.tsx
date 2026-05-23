import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SOSButton } from "@/components/SOSButton";
import { StatusBadge } from "@/components/StatusBadge";
import { useColors } from "@/hooks/useColors";
import { useJobs } from "@/context/JobContext";
import { useLang } from "@/context/LanguageContext";

const MILESTONES = [
  { id: 1, label: "Worker en route", icon: "navigation", done: true },
  { id: 2, label: "Arrived on site", icon: "map-pin", done: true },
  { id: 3, label: "Job started", icon: "play", done: true },
  { id: 4, label: "In progress", icon: "tool", done: false },
  { id: 5, label: "Completed", icon: "check-circle", done: false },
];

export default function ActiveJobScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { jobs, completeJob } = useJobs();
  const { t } = useLang();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [elapsed, setElapsed] = useState(0);

  const job = jobs.find((j) => j.id === id);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();

    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);

    return () => {
      pulse.stop();
      clearInterval(timer);
    };
  }, []);

  const formatElapsed = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  if (!job) return null;

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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>{t("job.track")}</Text>
        <SOSButton />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Map Placeholder */}
        <View style={[styles.mapPlaceholder, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <View style={styles.mapGrid}>
            {Array.from({ length: 25 }).map((_, i) => (
              <View key={i} style={[styles.mapDot, { backgroundColor: `${colors.border}` }]} />
            ))}
          </View>
          <Animated.View style={[styles.workerPin, { transform: [{ scale: pulseAnim }] }]}>
            <View style={[styles.pinOuter, { backgroundColor: `${colors.primary}30` }]}>
              <View style={[styles.pinInner, { backgroundColor: colors.primary }]}>
                <Feather name="user" size={14} color="#fff" />
              </View>
            </View>
          </Animated.View>
          <View style={[styles.jobPin]}>
            <View style={[styles.pinOuter, { backgroundColor: `${colors.accent}30` }]}>
              <View style={[styles.pinInner, { backgroundColor: colors.accent }]}>
                <Feather name="home" size={14} color="#fff" />
              </View>
            </View>
          </View>
          <View style={[styles.mapBadge, { backgroundColor: colors.card }]}>
            <Feather name="map" size={14} color={colors.mutedForeground} />
            <Text style={[styles.mapBadgeText, { color: colors.mutedForeground }]}>Live Tracking</Text>
          </View>
        </View>

        {/* Job Info */}
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.infoHeader}>
            <View style={styles.infoLeft}>
              <Text style={[styles.jobTitle, { color: colors.foreground }]}>{job.title}</Text>
              <Text style={[styles.jobAddress, { color: colors.mutedForeground }]}>{job.location.address}</Text>
            </View>
            <StatusBadge status={job.status} />
          </View>

          <View style={[styles.timerRow, { backgroundColor: `${colors.primary}10`, borderRadius: 12 }]}>
            <View style={styles.timerItem}>
              <Text style={[styles.timerValue, { color: colors.primary }]}>{formatElapsed(elapsed)}</Text>
              <Text style={[styles.timerLabel, { color: colors.mutedForeground }]}>Elapsed</Text>
            </View>
            <View style={[styles.timerDivider, { backgroundColor: `${colors.primary}30` }]} />
            <View style={styles.timerItem}>
              <Text style={[styles.timerValue, { color: colors.foreground }]}>
                {job.workerName?.split(" ")[0] || "Worker"}
              </Text>
              <Text style={[styles.timerLabel, { color: colors.mutedForeground }]}>Assigned To</Text>
            </View>
            <View style={[styles.timerDivider, { backgroundColor: `${colors.primary}30` }]} />
            <View style={styles.timerItem}>
              <Text style={[styles.timerValue, { color: colors.accent }]}>{job.price.toLocaleString()}</Text>
              <Text style={[styles.timerLabel, { color: colors.mutedForeground }]}>ETB</Text>
            </View>
          </View>
        </View>

        {/* Progress Milestones */}
        <View style={[styles.milestonesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Progress</Text>
          {MILESTONES.map((m, i) => (
            <View key={m.id} style={styles.milestone}>
              <View style={styles.milestoneLeft}>
                <View
                  style={[
                    styles.milestoneIcon,
                    {
                      backgroundColor: m.done ? `${colors.success}15` : colors.muted,
                      borderColor: m.done ? colors.success : colors.border,
                    },
                  ]}
                >
                  <Feather
                    name={m.icon as any}
                    size={16}
                    color={m.done ? colors.success : colors.mutedForeground}
                  />
                </View>
                {i < MILESTONES.length - 1 && (
                  <View
                    style={[
                      styles.milestoneLine,
                      { backgroundColor: m.done ? colors.success : colors.border },
                    ]}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.milestoneLabel,
                  { color: m.done ? colors.foreground : colors.mutedForeground },
                  m.done && { fontFamily: "Inter_500Medium" },
                ]}
              >
                {m.label}
              </Text>
              {m.done && <Feather name="check" size={14} color={colors.success} style={styles.milestoneCheck} />}
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={[styles.actionBtn, { backgroundColor: `${colors.info}15`, borderColor: `${colors.info}30` }]}
            onPress={() => router.push({ pathname: "/chat-room", params: { id: "room-001" } })}
          >
            <Feather name="message-circle" size={20} color={colors.info} />
            <Text style={[styles.actionBtnText, { color: colors.info }]}>Chat</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, { backgroundColor: `${colors.success}15`, borderColor: `${colors.success}30`, flex: 2 }]}
            onPress={async () => {
              await completeJob(job.id);
              router.push({ pathname: "/rate-job", params: { id: job.id } });
            }}
          >
            <Feather name="check-circle" size={20} color={colors.success} />
            <Text style={[styles.actionBtnText, { color: colors.success }]}>{t("job.complete")}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={{ marginVertical: 16 }}>
        <Text style={{ color: colors.destructive, fontWeight: 'bold', fontSize: 16 }}>Safety & Emergency</Text>
        <Text style={{ color: colors.mutedForeground, marginBottom: 8 }}>
          If you feel unsafe at any time during a job, press the SOS button below. Your location and job details will be sent instantly to responders and the Federal Police.
        </Text>
        <SOSButton onSOS={() => {
          // TODO: Integrate with backend emergency alert system
          alert('Emergency alert sent to responders!');
        }} />
      </View>
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
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 18, flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, gap: 16 },
  mapPlaceholder: {
    height: 200,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  mapGrid: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 16,
  },
  mapDot: { width: 4, height: 4, borderRadius: 2 },
  workerPin: { position: "absolute", top: "40%", left: "35%" },
  jobPin: { position: "absolute", top: "55%", left: "60%" },
  pinOuter: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  pinInner: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  mapBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  mapBadgeText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  infoCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 14 },
  infoHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  infoLeft: { flex: 1, gap: 3 },
  jobTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  jobAddress: { fontFamily: "Inter_400Regular", fontSize: 13 },
  timerRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 10 },
  timerItem: { flex: 1, alignItems: "center", gap: 3 },
  timerValue: { fontFamily: "Inter_700Bold", fontSize: 18 },
  timerLabel: { fontFamily: "Inter_400Regular", fontSize: 11 },
  timerDivider: { width: 1, height: 36 },
  milestonesCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 0 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 16, marginBottom: 12 },
  milestone: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 0 },
  milestoneLeft: { alignItems: "center", width: 36 },
  milestoneIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  milestoneLine: { width: 2, height: 24, marginTop: 2 },
  milestoneLabel: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 14, paddingVertical: 10 },
  milestoneCheck: { marginLeft: "auto" },
  actions: { flexDirection: "row", gap: 12 },
  actionBtn: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
});
