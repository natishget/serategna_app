import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
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
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useLang } from "@/context/LanguageContext";

interface SkillBar { label: string; score: number; color: string }
interface KPI { label: string; value: string; icon: string; color: string }
interface PsychDimension { label: string; score: number }

const MOCK_CV = {
  bio: "A highly motivated and results-driven skilled tradesperson with 5+ years of hands-on experience in residential and commercial construction. Proven ability to deliver quality work under tight deadlines with a strong safety record and excellent client communication skills. Fayda-verified identity and fully insured.",
  skills: [
    { label: "Plumbing", score: 92, color: "#1A7F6E" },
    { label: "Electrical Work", score: 78, color: "#0EA5E9" },
    { label: "Construction", score: 88, color: "#F59E0B" },
    { label: "Problem Solving", score: 85, color: "#8B5CF6" },
    { label: "Communication", score: 80, color: "#EC4899" },
    { label: "Safety Compliance", score: 95, color: "#10B981" },
  ] as SkillBar[],
  psychometry: {
    overall: 847,
    dimensions: [
      { label: "Conscientiousness", score: 88 },
      { label: "Reliability", score: 94 },
      { label: "Adaptability", score: 76 },
      { label: "Teamwork", score: 82 },
      { label: "Initiative", score: 79 },
    ] as PsychDimension[],
  },
  kpis: [
    { label: "On-Time Rate", value: "97%", icon: "clock", color: "#1A7F6E" },
    { label: "Client Rating", value: "4.8★", icon: "star", color: "#F59E0B" },
    { label: "Jobs Done", value: "142", icon: "briefcase", color: "#0EA5E9" },
    { label: "Repeat Hire", value: "68%", icon: "refresh-cw", color: "#8B5CF6" },
    { label: "Response Time", value: "<30min", icon: "zap", color: "#EC4899" },
    { label: "Trust Score", value: "847", icon: "shield", color: "#10B981" },
  ] as KPI[],
  education: [
    { degree: "TVET Certificate — Plumbing & Sanitation", institution: "Addis Ababa Polytechnic College", year: "2018", verified: true },
    { degree: "Safety Training Certificate", institution: "Ethiopian Contractors Association", year: "2020", verified: true },
  ],
};

export default function AICVScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useLang();

  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"bio" | "skills" | "psych" | "kpi">("bio");

  const handleGenerate = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 2800));
    setGenerating(false);
    setGenerated(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  if (!user) return null;

  const tabs = [
    { id: "bio", label: "Bio", icon: "user" },
    { id: "skills", label: "Skills", icon: "bar-chart-2" },
    { id: "psych", label: "Psych", icon: "activity" },
    { id: "kpi", label: "KPIs", icon: "trending-up" },
  ] as const;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient colors={["#1A7F6E", "#0D5C4F"]} style={[styles.hero, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="rgba(255,255,255,0.9)" />
        </Pressable>
        <View style={styles.heroContent}>
          <View style={styles.aiIcon}>
            <Feather name="cpu" size={28} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>{t("cv.title")}</Text>
          <Text style={styles.heroSub}>Powered by Serategna AI · 6 dimensions</Text>
          {generated && (
            <View style={styles.heroBadge}>
              <Feather name="check-circle" size={14} color="#fff" />
              <Text style={styles.heroBadgeText}>CV Generated</Text>
            </View>
          )}
        </View>

        {generated && (
          <View style={styles.scoreRow}>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreNum}>{MOCK_CV.psychometry.overall}</Text>
              <Text style={styles.scoreLabel}>Trust Score</Text>
            </View>
            <View style={[styles.scoreBox, styles.scoreBoxMid]}>
              <Text style={styles.scoreNum}>97%</Text>
              <Text style={styles.scoreLabel}>On-Time Rate</Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreNum}>4.8</Text>
              <Text style={styles.scoreLabel}>Avg Rating</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.body}>
        {!generated && !generating && (
          <View style={styles.preGenerate}>
            <View style={[styles.preIconWrap, { backgroundColor: `${colors.primary}15` }]}>
              <Feather name="cpu" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.preTitle, { color: colors.foreground }]}>AI-Powered CV Builder</Text>
            <Text style={[styles.preDesc, { color: colors.mutedForeground }]}>
              Our AI analyzes your job history, skills, trust score, and Fayda-verified identity to generate a professional CV, psychometry score, and KPIs in seconds.
            </Text>

            <View style={styles.featureList}>
              {[
                { icon: "file-text", label: "Professional bio & summary" },
                { icon: "bar-chart-2", label: "Skills assessment with scores" },
                { icon: "activity", label: "Psychometry profile (5 dimensions)" },
                { icon: "trending-up", label: "Performance KPIs & benchmarks" },
                { icon: "graduation-cap", label: "Education & certifications" },
                { icon: "share-2", label: "Share-ready PDF export" },
              ].map((f) => (
                <View key={f.label} style={[styles.featureRow, { borderColor: colors.border }]}>
                  <View style={[styles.featureIcon, { backgroundColor: `${colors.primary}15` }]}>
                    <Feather name={f.icon as any} size={16} color={colors.primary} />
                  </View>
                  <Text style={[styles.featureLabel, { color: colors.foreground }]}>{f.label}</Text>
                  <Feather name="check" size={16} color={colors.success} />
                </View>
              ))}
            </View>

            <Pressable
              style={[styles.generateBtn, { backgroundColor: colors.primary }]}
              onPress={handleGenerate}
            >
              <Feather name="cpu" size={20} color="#fff" />
              <Text style={styles.generateBtnText}>{t("cv.generate")}</Text>
            </Pressable>
          </View>
        )}

        {generating && (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingTitle, { color: colors.foreground }]}>{t("cv.generating")}</Text>
            {["Analyzing job history...", "Scoring 6 skill dimensions...", "Running psychometry model...", "Calculating KPIs...", "Composing bio..."].map((step, i) => (
              <View key={i} style={[styles.loadingStep, { borderColor: colors.border }]}>
                <Feather name="check-circle" size={14} color={colors.success} />
                <Text style={[styles.loadingStepText, { color: colors.mutedForeground }]}>{step}</Text>
              </View>
            ))}
          </View>
        )}

        {generated && (
          <>
            {/* Tab bar */}
            <View style={[styles.tabBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {tabs.map((tab) => (
                <Pressable
                  key={tab.id}
                  style={[styles.tab, activeTab === tab.id && { backgroundColor: colors.primary }]}
                  onPress={() => { Haptics.selectionAsync(); setActiveTab(tab.id); }}
                >
                  <Feather name={tab.icon as any} size={14} color={activeTab === tab.id ? "#fff" : colors.mutedForeground} />
                  <Text style={[styles.tabText, { color: activeTab === tab.id ? "#fff" : colors.mutedForeground }]}>{tab.label}</Text>
                </Pressable>
              ))}
            </View>

            {activeTab === "bio" && (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Professional Bio</Text>
                <Text style={[styles.bioText, { color: colors.mutedForeground }]}>{MOCK_CV.bio}</Text>
                <View style={styles.eduList}>
                  <Text style={[styles.cardTitle, { color: colors.foreground, marginBottom: 12 }]}>Education & Certifications</Text>
                  {MOCK_CV.education.map((edu, i) => (
                    <View key={i} style={[styles.eduRow, { borderColor: colors.border }]}>
                      <View style={[styles.eduIcon, { backgroundColor: `${colors.primary}15` }]}>
                        <Feather name="book" size={16} color={colors.primary} />
                      </View>
                      <View style={styles.eduInfo}>
                        <Text style={[styles.eduDegree, { color: colors.foreground }]}>{edu.degree}</Text>
                        <Text style={[styles.eduInst, { color: colors.mutedForeground }]}>{edu.institution} · {edu.year}</Text>
                      </View>
                      {edu.verified && <Feather name="shield" size={16} color={colors.success} />}
                    </View>
                  ))}
                  <Pressable
                    style={[styles.addEduBtn, { borderColor: colors.primary }]}
                    onPress={() => router.push("/moe-verify")}
                  >
                    <Feather name="plus" size={16} color={colors.primary} />
                    <Text style={[styles.addEduText, { color: colors.primary }]}>Verify Degree via MoE</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {activeTab === "skills" && (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>{t("cv.skills_assessment")}</Text>
                <View style={styles.skillsList}>
                  {MOCK_CV.skills.map((skill) => (
                    <View key={skill.label} style={styles.skillItem}>
                      <View style={styles.skillHeader}>
                        <Text style={[styles.skillLabel, { color: colors.foreground }]}>{skill.label}</Text>
                        <Text style={[styles.skillScore, { color: skill.color }]}>{skill.score}/100</Text>
                      </View>
                      <View style={[styles.skillTrack, { backgroundColor: `${skill.color}20` }]}>
                        <View style={[styles.skillFill, { width: `${skill.score}%` as any, backgroundColor: skill.color }]} />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {activeTab === "psych" && (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.psychHeader}>
                  <View>
                    <Text style={[styles.cardTitle, { color: colors.foreground }]}>{t("cv.psychometry")}</Text>
                    <Text style={[styles.psychSub, { color: colors.mutedForeground }]}>5-dimensional personality assessment</Text>
                  </View>
                  <View style={[styles.psychScore, { backgroundColor: `${colors.primary}15` }]}>
                    <Text style={[styles.psychScoreNum, { color: colors.primary }]}>{MOCK_CV.psychometry.overall}</Text>
                    <Text style={[styles.psychScoreLabel, { color: colors.mutedForeground }]}>Overall</Text>
                  </View>
                </View>
                <View style={styles.psychList}>
                  {MOCK_CV.psychometry.dimensions.map((d) => (
                    <View key={d.label} style={styles.psychRow}>
                      <Text style={[styles.psychDimLabel, { color: colors.foreground }]}>{d.label}</Text>
                      <View style={styles.psychBarWrap}>
                        <View style={[styles.psychTrack, { backgroundColor: `${colors.primary}15` }]}>
                          <View style={[styles.psychFill, { width: `${d.score}%` as any, backgroundColor: colors.primary }]} />
                        </View>
                        <Text style={[styles.psychDimScore, { color: colors.primary }]}>{d.score}</Text>
                      </View>
                    </View>
                  ))}
                </View>
                <View style={[styles.psychInsight, { backgroundColor: `${colors.success}10`, borderColor: `${colors.success}30` }]}>
                  <Feather name="trending-up" size={16} color={colors.success} />
                  <Text style={[styles.psychInsightText, { color: colors.success }]}>
                    Top 15% reliability among all Serategna workers
                  </Text>
                </View>
              </View>
            )}

            {activeTab === "kpi" && (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>{t("cv.kpi")}</Text>
                <View style={styles.kpiGrid}>
                  {MOCK_CV.kpis.map((kpi) => (
                    <View key={kpi.label} style={[styles.kpiCard, { backgroundColor: `${kpi.color}10`, borderColor: `${kpi.color}25` }]}>
                      <View style={[styles.kpiIcon, { backgroundColor: `${kpi.color}20` }]}>
                        <Feather name={kpi.icon as any} size={18} color={kpi.color} />
                      </View>
                      <Text style={[styles.kpiValue, { color: kpi.color }]}>{kpi.value}</Text>
                      <Text style={[styles.kpiLabel, { color: colors.mutedForeground }]}>{kpi.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actions}>
              <Pressable
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                onPress={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)}
              >
                <Feather name="download" size={18} color="#fff" />
                <Text style={styles.actionBtnText}>{t("cv.download")}</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtnSecondary, { borderColor: colors.primary }]}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              >
                <Feather name="share-2" size={18} color={colors.primary} />
                <Text style={[styles.actionBtnSecText, { color: colors.primary }]}>{t("cv.share")}</Text>
              </Pressable>
            </View>

            <Pressable
              style={[styles.regenerateBtn, { borderColor: colors.border }]}
              onPress={() => { setGenerated(false); handleGenerate(); }}
            >
              <Feather name="refresh-cw" size={16} color={colors.mutedForeground} />
              <Text style={[styles.regenerateText, { color: colors.mutedForeground }]}>{t("cv.regenerate")}</Text>
            </Pressable>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: { paddingHorizontal: 20, paddingBottom: 24, gap: 16 },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  heroContent: { gap: 8 },
  aiIcon: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  heroTitle: { fontFamily: "Inter_700Bold", fontSize: 26, color: "#fff", letterSpacing: -0.5 },
  heroSub: { fontFamily: "Inter_400Regular", fontSize: 14, color: "rgba(255,255,255,0.7)" },
  heroBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  heroBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#fff" },
  scoreRow: { flexDirection: "row", gap: 1, borderRadius: 16, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.1)" },
  scoreBox: { flex: 1, alignItems: "center", paddingVertical: 12, gap: 4 },
  scoreBoxMid: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  scoreNum: { fontFamily: "Inter_700Bold", fontSize: 22, color: "#fff" },
  scoreLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: "rgba(255,255,255,0.7)" },
  body: { padding: 20, gap: 16 },
  preGenerate: { gap: 20 },
  preIconWrap: { width: 88, height: 88, borderRadius: 24, alignItems: "center", justifyContent: "center", alignSelf: "center" },
  preTitle: { fontFamily: "Inter_700Bold", fontSize: 22, letterSpacing: -0.3, textAlign: "center" },
  preDesc: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22, textAlign: "center" },
  featureList: { gap: 10 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderRadius: 12 },
  featureIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  featureLabel: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 14 },
  generateBtn: { height: 56, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  generateBtnText: { fontFamily: "Inter_700Bold", fontSize: 17, color: "#fff" },
  loadingState: { gap: 16, paddingVertical: 32, alignItems: "center" },
  loadingTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18, textAlign: "center" },
  loadingStep: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, paddingHorizontal: 16, borderWidth: 1, borderRadius: 10, alignSelf: "stretch" },
  loadingStepText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  tabBar: { flexDirection: "row", borderWidth: 1, borderRadius: 14, overflow: "hidden", padding: 4, gap: 4 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 9, borderRadius: 10 },
  tabText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  card: { borderWidth: 1, borderRadius: 20, padding: 20, gap: 16 },
  cardTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  bioText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22 },
  eduList: { gap: 12, paddingTop: 8 },
  eduRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: 1 },
  eduIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  eduInfo: { flex: 1, gap: 2 },
  eduDegree: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  eduInst: { fontFamily: "Inter_400Regular", fontSize: 12 },
  addEduBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1.5, borderRadius: 12, borderStyle: "dashed", justifyContent: "center" },
  addEduText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  skillsList: { gap: 14 },
  skillItem: { gap: 8 },
  skillHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  skillLabel: { fontFamily: "Inter_500Medium", fontSize: 14 },
  skillScore: { fontFamily: "Inter_700Bold", fontSize: 14 },
  skillTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  skillFill: { height: "100%", borderRadius: 4 },
  psychHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  psychSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  psychScore: { alignItems: "center", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10, gap: 2 },
  psychScoreNum: { fontFamily: "Inter_700Bold", fontSize: 24 },
  psychScoreLabel: { fontFamily: "Inter_400Regular", fontSize: 11 },
  psychList: { gap: 12 },
  psychRow: { gap: 6 },
  psychDimLabel: { fontFamily: "Inter_500Medium", fontSize: 13 },
  psychBarWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  psychTrack: { flex: 1, height: 8, borderRadius: 4, overflow: "hidden" },
  psychFill: { height: "100%", borderRadius: 4 },
  psychDimScore: { fontFamily: "Inter_700Bold", fontSize: 13, width: 28, textAlign: "right" },
  psychInsight: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  psychInsightText: { fontFamily: "Inter_500Medium", fontSize: 13, flex: 1 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  kpiCard: { width: "47%", borderWidth: 1, borderRadius: 16, padding: 14, gap: 8 },
  kpiIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  kpiValue: { fontFamily: "Inter_700Bold", fontSize: 20 },
  kpiLabel: { fontFamily: "Inter_400Regular", fontSize: 12 },
  actions: { flexDirection: "row", gap: 12 },
  actionBtn: { flex: 1, height: 52, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  actionBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },
  actionBtnSecondary: { flex: 1, height: 52, borderRadius: 14, borderWidth: 1.5, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  actionBtnSecText: { fontFamily: "Inter_700Bold", fontSize: 15 },
  regenerateBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderWidth: 1, borderRadius: 14 },
  regenerateText: { fontFamily: "Inter_500Medium", fontSize: 14 },
});
