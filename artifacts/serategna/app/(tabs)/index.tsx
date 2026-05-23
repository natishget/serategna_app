import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { JobCard } from "@/components/JobCard";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useJobs } from "@/context/JobContext";
import { useLang } from "@/context/LanguageContext";

interface FeatureAction { icon: string; label: string; color: string; bg: string; onPress: () => void }

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { jobs, refreshJobs } = useJobs();
  const { t } = useLang();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshJobs();
    setRefreshing(false);
  };

  if (!user) return null;

  const isWorker = user.role === "worker";
  const isEmployer = user.role === "employer";
  const isAgent = user.role === "agent";
  const isMinistry = user.role === "ministry";

  const recentJobs = jobs.slice(0, 3);

  // ─── Worker Feature Grid ───────────────────────────────────────────
  const workerActions: FeatureAction[] = [
    { icon: "search", label: "Find Jobs", color: "#fff", bg: "rgba(255,255,255,0.2)", onPress: () => router.push("/job-feed") },
    { icon: "cpu", label: "AI CV", color: "#fff", bg: "rgba(255,255,255,0.2)", onPress: () => router.push("/ai-cv") },
    { icon: "map-pin", label: "Active Job", color: "#fff", bg: "rgba(255,255,255,0.2)", onPress: () => router.push("/active-job") },
    { icon: "book-open", label: "MoE Verify", color: "#fff", bg: "rgba(255,255,255,0.2)", onPress: () => router.push("/moe-verify") },
    { icon: "alert-triangle", label: "SOS Alert", color: "#fff", bg: "rgba(255,255,255,0.2)", onPress: () => router.push("/active-job") },
    { icon: "message-circle", label: "Messages", color: "#fff", bg: "rgba(255,255,255,0.2)", onPress: () => router.push("/(tabs)/chat") },
  ];

  // ─── Employer Feature Grid ─────────────────────────────────────────
  const employerActions: FeatureAction[] = [
    { icon: "plus-circle", label: "Post Job", color: colors.accent, bg: `${colors.accent}15`, onPress: () => router.push("/post-job") },
    { icon: "users", label: "Find Workers", color: colors.primary, bg: `${colors.primary}15`, onPress: () => router.push("/(tabs)/jobs") },
    { icon: "credit-card", label: "Escrow Pay", color: "#10B981", bg: "#10B98115", onPress: () => router.push("/(tabs)/wallet") },
    { icon: "briefcase", label: "Job History", color: "#F59E0B", bg: "#F59E0B15", onPress: () => router.push("/(tabs)/jobs") },
    { icon: "map-pin", label: "Active Jobs", color: "#EF4444", bg: "#EF444415", onPress: () => router.push("/active-job") },
    { icon: "message-circle", label: "Chat", color: "#0EA5E9", bg: "#0EA5E915", onPress: () => router.push("/(tabs)/chat") },
  ];

  // ─── Agent Feature Grid ────────────────────────────────────────────
  const agentActions: FeatureAction[] = [
    { icon: "user-plus", label: "Register Worker", color: "#fff", bg: "rgba(255,255,255,0.2)", onPress: () => router.push("/register-worker") },
    { icon: "cpu", label: "Build CV", color: "#fff", bg: "rgba(255,255,255,0.2)", onPress: () => router.push("/ai-cv") },
    { icon: "briefcase", label: "Browse Jobs", color: "#fff", bg: "rgba(255,255,255,0.2)", onPress: () => router.push("/(tabs)/jobs") },
    { icon: "credit-card", label: "Commission", color: "#fff", bg: "rgba(255,255,255,0.2)", onPress: () => router.push("/(tabs)/wallet") },
    { icon: "book-open", label: "MoE Verify", color: "#fff", bg: "rgba(255,255,255,0.2)", onPress: () => router.push("/moe-verify") },
    { icon: "message-circle", label: "Messages", color: "#fff", bg: "rgba(255,255,255,0.2)", onPress: () => router.push("/(tabs)/chat") },
  ];

  // ─── Ministry Feature Grid ─────────────────────────────────────────
  const ministryActions: FeatureAction[] = [
    { icon: "plus-circle", label: "Post Job", color: colors.accent, bg: `${colors.accent}15`, onPress: () => router.push("/post-job") },
    { icon: "users", label: "Find Workers", color: colors.primary, bg: `${colors.primary}15`, onPress: () => router.push("/(tabs)/jobs") },
    { icon: "credit-card", label: "Escrow Pay", color: "#10B981", bg: "#10B98115", onPress: () => router.push("/(tabs)/wallet") },
    { icon: "briefcase", label: "Job History", color: "#F59E0B", bg: "#F59E0B15", onPress: () => router.push("/(tabs)/jobs") },
    { icon: "map-pin", label: "Active Jobs", color: "#EF4444", bg: "#EF444415", onPress: () => router.push("/active-job") },
    { icon: "message-circle", label: "Chat", color: "#0EA5E9", bg: "#0EA5E915", onPress: () => router.push("/(tabs)/chat") },
  ];

  const actions = isWorker ? workerActions : isAgent ? agentActions : isMinistry ? ministryActions : employerActions;

  // ─── Hero gradient colours ─────────────────────────────────────────
  const heroGradient: [string, string] = isWorker
    ? ["#1A7F6E", "#0D5C4F"]
    : isEmployer
    ? ["#0F4C81", "#1565C0"]
    : isMinistry
    ? ["#7C2D12", "#EA580C"] // Orange for government
    : ["#5B21B6", "#7C3AED"];

  // ─── Hero stats ────────────────────────────────────────────────────
  const heroStats = isWorker
    ? [
        { value: String(user.trustScore), label: "Trust Score" },
        { value: String(user.completedJobs), label: "Jobs Done" },
        { value: `${user.rating}★`, label: "Rating" },
      ]
    : isEmployer
    ? [
        { value: `${(user.walletBalance / 1000).toFixed(1)}K`, label: "Balance ETB" },
        { value: String(jobs.filter((j) => j.status === "active").length), label: "Active Jobs" },
        { value: "100%", label: "Pay Protected" },
      ]
    : isMinistry
    ? [
        { value: `${(user.walletBalance / 1000).toFixed(1)}K`, label: "Budget ETB" },
        { value: String(jobs.filter((j) => j.status === "active").length), label: "Active Projects" },
        { value: "100%", label: "Verified" },
      ]
    : [
        { value: `${user.walletBalance.toLocaleString()}`, label: "Commission ETB" },
        { value: "12", label: "My Workers" },
        { value: "2%", label: "Rate" },
      ];

  const heroValueLabel = isWorker ? "Trust Score" : isEmployer ? "Wallet Balance" : "Commission";
  const heroValueNum = isWorker
    ? String(user.trustScore)
    : isEmployer
    ? `${user.walletBalance.toLocaleString()} ETB`
    : `${user.walletBalance.toLocaleString()} ETB`;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100) }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* ── Gradient Hero ── */}
      <LinearGradient colors={heroGradient} style={[styles.hero, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
        {/* Top Bar */}
        <View style={styles.heroTopBar}>
          <View style={styles.greetingGroup}>
            <Text style={styles.heroGreet}>
              {new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening"},
            </Text>
            <Text style={styles.heroName}>{user.name.split(" ")[0]} 👋</Text>
          </View>
          <Pressable
            onPress={() => router.push("/(tabs)/profile")}
            style={({ pressed }) => [styles.avatarBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
          </Pressable>
        </View>

        {/* Big Number */}
        <View style={styles.heroBigNum}>
          <Text style={styles.heroBigLabel}>{heroValueLabel}</Text>
          <Text style={styles.heroBigValue}>{heroValueNum}</Text>
          {isWorker && (
            <View style={styles.heroPills}>
              <View style={styles.heroPill}>
                <Feather name="shield" size={11} color="rgba(255,255,255,0.9)" />
                <Text style={styles.heroPillText}>Fayda Verified</Text>
              </View>
              <View style={[styles.heroPill, styles.heroPillGreen]}>
                <View style={styles.heroPillDot} />
                <Text style={styles.heroPillText}>Available</Text>
              </View>
            </View>
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.heroStats}>
          {heroStats.map((s, i) => (
            <Pressable
              key={s.label}
              style={[styles.heroStatBox, i > 0 && styles.heroStatBorder]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (s.label === "Trust Score") router.push("/(tabs)/profile");
                else if (s.label === "Jobs Done" || s.label === "Active Jobs") router.push("/(tabs)/jobs");
                else router.push("/(tabs)/wallet");
              }}
            >
              <Text style={styles.heroStatVal}>{s.value}</Text>
              <Text style={styles.heroStatLabel}>{s.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Feature Grid */}
        <View style={styles.featureGrid}>
          {actions.map((action) => (
            <Pressable
              key={action.label}
              style={({ pressed }) => [styles.featureBtn, { backgroundColor: action.bg, opacity: pressed ? 0.75 : 1 }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                action.onPress();
              }}
            >
              <Feather name={action.icon as any} size={20} color={action.color} />
              <Text style={[styles.featureBtnLabel, { color: action.color }]}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      </LinearGradient>

      {/* ── Body ── */}
      <View style={styles.body}>
        {/* Platform Features (shown only to first-time like hint) */}
        {isWorker && (
          <View style={styles.aiPromo}>
            <LinearGradient colors={["#1A7F6E", "#0D9488"]} style={styles.aiPromoGrad}>
              <View style={styles.aiPromoLeft}>
                <Feather name="cpu" size={22} color="#fff" />
                <View>
                  <Text style={styles.aiPromoTitle}>Your AI CV is ready to generate</Text>
                  <Text style={styles.aiPromoSub}>Psychometry · Skills · KPIs · Bio</Text>
                </View>
              </View>
              <Pressable
                style={styles.aiPromoBtn}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/ai-cv"); }}
              >
                <Text style={styles.aiPromoBtnText}>Build Now</Text>
                <Feather name="arrow-right" size={14} color={colors.primary} />
              </Pressable>
            </LinearGradient>
          </View>
        )}

        {isEmployer && (
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.infoIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Feather name="shield" size={20} color={colors.primary} />
            </View>
            <View style={styles.infoText}>
              <Text style={[styles.infoTitle, { color: colors.foreground }]}>Hire with Confidence</Text>
              <Text style={[styles.infoDesc, { color: colors.mutedForeground }]}>All workers are Fayda-verified. Pay is held in secure escrow until job completion.</Text>
            </View>
            <Pressable onPress={() => router.push("/post-job")}>
              <Feather name="arrow-right" size={18} color={colors.primary} />
            </Pressable>
          </View>
        )}

        {isMinistry && (
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.infoIcon, { backgroundColor: `${colors.accent}15` }]}>
              <Feather name="book-open" size={20} color={colors.accent} />
            </View>
            <View style={styles.infoText}>
              <Text style={[styles.infoTitle, { color: colors.foreground }]}>Government Projects</Text>
              <Text style={[styles.infoDesc, { color: colors.mutedForeground }]}>Post verified government jobs with enhanced security and compliance.</Text>
            </View>
            <Pressable onPress={() => router.push("/post-job")}>
              <Feather name="arrow-right" size={18} color={colors.accent} />
            </Pressable>
          </View>
        )}

        {/* Section Header */}
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {isWorker ? "Jobs Near You" : isEmployer ? "Your Recent Jobs" : isMinistry ? "Government Projects" : "Worker Activity"}
          </Text>
          <Pressable onPress={() => router.push("/(tabs)/jobs")}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>{t("general.see_all")} →</Text>
          </Pressable>
        </View>

        {/* Job Cards */}
        <View style={styles.jobList}>
          {recentJobs.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="briefcase" size={36} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t("job.no_jobs")}</Text>
            </View>
          ) : (
            recentJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onPress={() => router.push({ pathname: "/job-detail", params: { id: job.id } })}
              />
            ))
          )}
        </View>

        {/* Platform pillars (bottom section) */}
        <View style={styles.pillarsSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Why Serategna</Text>
          <View style={styles.pillarsGrid}>
            {[
              { icon: "shield", title: "Fayda ID", desc: "Every worker identity-verified", color: "#10B981" },
              { icon: "cpu", title: "AI CVs", desc: "Auto-generated + psychometry", color: "#8B5CF6" },
              { icon: "alert-triangle", title: "SOS Safety", desc: "24/7 worker protection", color: "#EF4444" },
              { icon: "credit-card", title: "Escrow Pay", desc: "87% to worker, guaranteed", color: "#F59E0B" },
              { icon: "trending-up", title: "Credit Score", desc: "Build your labor credit", color: "#0EA5E9" },
              { icon: "book-open", title: "MoE Degrees", desc: "Verified education records", color: "#1A7F6E" },
            ].map((p) => (
              <Pressable
                key={p.title}
                style={[styles.pillarCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (p.title === "AI CVs") router.push("/ai-cv");
                  else if (p.title === "MoE Degrees") router.push("/moe-verify");
                  else if (p.title === "Escrow Pay") router.push("/(tabs)/wallet");
                  else if (p.title === "SOS Safety") router.push("/active-job");
                }}
              >
                <View style={[styles.pillarIcon, { backgroundColor: `${p.color}15` }]}>
                  <Feather name={p.icon as any} size={20} color={p.color} />
                </View>
                <Text style={[styles.pillarTitle, { color: colors.foreground }]}>{p.title}</Text>
                <Text style={[styles.pillarDesc, { color: colors.mutedForeground }]}>{p.desc}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  // Hero
  hero: { paddingHorizontal: 20, paddingBottom: 24, gap: 18 },
  heroTopBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  greetingGroup: { gap: 2 },
  heroGreet: { fontFamily: "Inter_400Regular", fontSize: 13, color: "rgba(255,255,255,0.7)" },
  heroName: { fontFamily: "Inter_700Bold", fontSize: 22, color: "#fff", letterSpacing: -0.3 },
  avatarBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontFamily: "Inter_700Bold", fontSize: 18, color: "#fff" },
  heroBigNum: { gap: 6 },
  heroBigLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 0.5 },
  heroBigValue: { fontFamily: "Inter_700Bold", fontSize: 48, color: "#fff", letterSpacing: -2 },
  heroPills: { flexDirection: "row", gap: 8 },
  heroPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  heroPillGreen: { backgroundColor: "rgba(16,185,129,0.25)" },
  heroPillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#4ADE80" },
  heroPillText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#fff" },
  heroStats: { flexDirection: "row", borderRadius: 14, overflow: "hidden", backgroundColor: "rgba(0,0,0,0.2)" },
  heroStatBox: { flex: 1, alignItems: "center", paddingVertical: 12, gap: 3 },
  heroStatBorder: { borderLeftWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  heroStatVal: { fontFamily: "Inter_700Bold", fontSize: 18, color: "#fff" },
  heroStatLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: "rgba(255,255,255,0.65)" },
  featureGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  featureBtn: {
    width: "30.5%",
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  featureBtnLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, textAlign: "center" },
  // Body
  body: { padding: 20, gap: 20 },
  aiPromo: { borderRadius: 16, overflow: "hidden" },
  aiPromoGrad: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  aiPromoLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  aiPromoTitle: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#fff" },
  aiPromoSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(255,255,255,0.75)" },
  aiPromoBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
  },
  aiPromoBtnText: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#1A7F6E" },
  infoCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  infoIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  infoText: { flex: 1, gap: 2 },
  infoTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  infoDesc: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 18, letterSpacing: -0.3 },
  seeAll: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  jobList: { gap: 12 },
  emptyState: { alignItems: "center", gap: 12, paddingVertical: 40, borderWidth: 1, borderRadius: 20, borderStyle: "dashed" },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 15 },
  pillarsSection: { gap: 14 },
  pillarsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  pillarCard: { width: "47%", borderWidth: 1, borderRadius: 16, padding: 14, gap: 8 },
  pillarIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  pillarTitle: { fontFamily: "Inter_700Bold", fontSize: 14 },
  pillarDesc: { fontFamily: "Inter_400Regular", fontSize: 12 },
});
