import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EscrowCard } from "@/components/EscrowCard";
import { StatusBadge } from "@/components/StatusBadge";
import { WorkerCard } from "@/components/WorkerCard";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useJobs } from "@/context/JobContext";
import { useLang } from "@/context/LanguageContext";

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { jobs, fundEscrow, startJob, completeJob, acceptJob, nearbyWorkers, findWorkers } = useJobs();
  const { t } = useLang();
  const [loading, setLoading] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null);
  const [loadingWorkers, setLoadingWorkers] = useState(false);

  const job = jobs.find((j) => j.id === id);
  if (!job) return (
    <View style={[styles.root, { backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }]}>
      <Text style={[styles.errorText, { color: colors.mutedForeground }]}>Job not found</Text>
    </View>
  );

  const handleFindWorkers = async () => {
    setLoadingWorkers(true);
    await findWorkers(job.category, job.location);
    setLoadingWorkers(false);
  };

  const handleAcceptWorker = async () => {
    if (!selectedWorker) return;
    setLoading(true);
    await acceptJob(job.id, selectedWorker);
    setLoading(false);
  };

  const handleFundEscrow = async (method: "telebirr" | "cbe") => {
    await fundEscrow(job.id, method);
  };

  const handleStartJob = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(true);
    await startJob(job.id);
    setLoading(false);
  };

  const handleCompleteJob = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(true);
    await completeJob(job.id);
    setLoading(false);
    router.push({ pathname: "/rate-job", params: { id: job.id } });
  };

  const isEmployer = user?.role === "employer";
  const isWorker = user?.role === "worker";

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
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
          Job Detail
        </Text>
        <Pressable
          onPress={() => router.push({ pathname: "/chat-room", params: { id: "room-001" } })}
          style={[styles.chatBtn, { backgroundColor: `${colors.primary}15` }]}
        >
          <Feather name="message-circle" size={20} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Job Info */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={styles.titleGroup}>
              <Text style={[styles.jobTitle, { color: colors.foreground }]}>{job.title}</Text>
              <Text style={[styles.employer, { color: colors.mutedForeground }]}>{job.employerName}</Text>
            </View>
            <StatusBadge status={job.status} />
          </View>

          <Text style={[styles.description, { color: colors.mutedForeground }]}>
            {job.description}
          </Text>

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Feather name="map-pin" size={15} color={colors.primary} />
              <Text style={[styles.metaText, { color: colors.foreground }]}>{job.location.address}</Text>
            </View>
            <View style={styles.metaItem}>
              <Feather name="tag" size={15} color={colors.primary} />
              <Text style={[styles.metaText, { color: colors.foreground }]}>{job.category}</Text>
            </View>
            <View style={styles.metaItem}>
              <Feather name="clock" size={15} color={colors.primary} />
              <Text style={[styles.metaText, { color: colors.foreground }]}>
                {new Date(job.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={[styles.metaItem, styles.priceItem]}>
              <Feather name="dollar-sign" size={15} color={colors.accent} />
              <Text style={[styles.priceText, { color: colors.accent }]}>
                {job.price.toLocaleString()} ETB
              </Text>
            </View>
          </View>
        </View>

        {/* Escrow */}
        <EscrowCard
          amount={job.price}
          status={job.escrowStatus || "pending"}
          onFund={job.status === "matched" && isEmployer ? handleFundEscrow : undefined}
          onRelease={job.status === "active" && isEmployer ? async () => { await completeJob(job.id); } : undefined}
        />

        {/* Worker Selection (employer + requested) */}
        {isEmployer && job.status === "requested" && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Find Workers</Text>
              <Pressable
                style={[styles.refreshBtn, { backgroundColor: `${colors.primary}15` }]}
                onPress={handleFindWorkers}
              >
                {loadingWorkers ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Feather name="refresh-cw" size={16} color={colors.primary} />
                )}
              </Pressable>
            </View>
            {nearbyWorkers.length > 0 ? (
              <>
                {nearbyWorkers.map((w, i) => (
                  <WorkerCard
                    key={w.id}
                    worker={w}
                    rank={i + 1}
                    selected={selectedWorker === w.id}
                    onSelect={() => setSelectedWorker(w.id)}
                  />
                ))}
                {selectedWorker && (
                  <Pressable
                    style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
                    onPress={handleAcceptWorker}
                    disabled={loading}
                  >
                    {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                      <>
                        <Feather name="user-check" size={18} color="#fff" />
                        <Text style={styles.primaryBtnText}>{t("worker.select")}</Text>
                      </>
                    )}
                  </Pressable>
                )}
              </>
            ) : (
              <Pressable
                style={[styles.findBtn, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}30` }]}
                onPress={handleFindWorkers}
              >
                <Feather name="search" size={18} color={colors.primary} />
                <Text style={[styles.findBtnText, { color: colors.primary }]}>Find Available Workers</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Worker – Accept/Start/Complete */}
        {isWorker && job.status === "requested" && (
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={() => acceptJob(job.id, user!.id)}
          >
            <Feather name="check" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>{t("job.accept")}</Text>
          </Pressable>
        )}

        {isWorker && job.status === "funded" && (
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: colors.success, opacity: loading ? 0.7 : 1 }]}
            onPress={handleStartJob}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" size="small" /> : (
              <>
                <Feather name="play" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>{t("job.start")}</Text>
              </>
            )}
          </Pressable>
        )}

        {isWorker && job.status === "active" && (
          <View style={styles.activeActions}>
            <Pressable
              style={[styles.primaryBtn, { backgroundColor: colors.success, flex: 1, opacity: loading ? 0.7 : 1 }]}
              onPress={handleCompleteJob}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                <>
                  <Feather name="check-circle" size={18} color="#fff" />
                  <Text style={styles.primaryBtnText}>{t("job.complete")}</Text>
                </>
              )}
            </Pressable>
            <Pressable
              style={[styles.trackBtn, { backgroundColor: `${colors.info}15`, borderColor: `${colors.info}30` }]}
              onPress={() => router.push({ pathname: "/active-job", params: { id: job.id } })}
            >
              <Feather name="map" size={20} color={colors.info} />
            </Pressable>
          </View>
        )}
      </ScrollView>
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
  chatBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 20, paddingTop: 16, gap: 16 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  titleGroup: { flex: 1, gap: 3 },
  jobTitle: { fontFamily: "Inter_700Bold", fontSize: 20 },
  employer: { fontFamily: "Inter_400Regular", fontSize: 14 },
  description: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22 },
  metaGrid: { gap: 10 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  metaText: { fontFamily: "Inter_500Medium", fontSize: 14 },
  priceItem: {},
  priceText: { fontFamily: "Inter_700Bold", fontSize: 16 },
  section: { gap: 12 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  refreshBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  findBtn: {
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  findBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  primaryBtn: {
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
  activeActions: { flexDirection: "row", gap: 10 },
  trackBtn: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: { fontFamily: "Inter_500Medium", fontSize: 16 },
});
