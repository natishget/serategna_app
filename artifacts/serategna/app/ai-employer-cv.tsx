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

const MOCK_EMPLOYER_CV = {
  bio: "A reputable employer with a proven track record of fair hiring practices and timely payments. Committed to supporting local workforce development through Serategna's escrow system. Verified business entity with strong community ties and positive worker feedback.",
  skills: [
    { label: "Project Management", score: 88, color: "#1A7F6E" },
    { label: "Budget Control", score: 92, color: "#0EA5E9" },
    { label: "Worker Relations", score: 85, color: "#F59E0B" },
    { label: "Quality Assurance", score: 90, color: "#8B5CF6" },
    { label: "Compliance", score: 87, color: "#EC4899" },
    { label: "Payment Reliability", score: 95, color: "#10B981" },
  ] as SkillBar[],
  psychometry: {
    overall: 892,
    dimensions: [
      { label: "Fairness", score: 92 },
      { label: "Reliability", score: 94 },
      { label: "Communication", score: 88 },
      { label: "Professionalism", score: 86 },
      { label: "Community Support", score: 82 },
    ] as PsychDimension[],
  },
  kpis: [
    { label: "Payment Rate", value: "100%", icon: "credit-card", color: "#1A7F6E" },
    { label: "Worker Rating", value: "4.7★", icon: "star", color: "#F59E0B" },
    { label: "Jobs Posted", value: "89", icon: "briefcase", color: "#0EA5E9" },
    { label: "Repeat Workers", value: "72%", icon: "refresh-cw", color: "#8B5CF6" },
    { label: "Response Time", value: "<15min", icon: "zap", color: "#EC4899" },
    { label: "Trust Score", value: "892", icon: "shield", color: "#10B981" },
  ] as KPI[],
  certifications: [
    { title: "Business License Verified", issuer: "Ethiopian Investment Commission", year: "2022", verified: true },
    { title: "Tax Compliance Certificate", issuer: "Ethiopian Revenue Authority", year: "2023", verified: true },
  ],
};

export default function AIEmployerCVScreen() {
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
          <Text style={styles.heroTitle}>AI Employer Profile</Text>
          <Text style={styles.heroSub}>Powered by Serategna AI · 6 dimensions</Text>
          {generated && (
            <View style={styles.heroBadge}>
              <Feather name="check-circle" size={14} color="#fff" />
              <Text style={styles.heroBadgeText}>Profile Generated</Text>
            </View>
          )}
        </View>

        {generated && (
          <View style={styles.scoreRow}>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreNum}>{MOCK_EMPLOYER_CV.psychometry.overall}</Text>
              <Text style={styles.scoreLabel}>Trust Score</Text>
            </View>
            <View style={[styles.scoreBox, styles.scoreBoxMid]}>
              <Text style={styles.scoreNum}>100%</Text>
              <Text style={styles.scoreLabel}>Payment Rate</Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreNum}>4.7</Text>
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
            <Text style={[styles.preTitle, { color: colors.foreground }]}>AI-Powered Employer Profile</Text>
            <Text style={[styles.preDesc, { color: colors.mutedForeground }]}>
              Our AI analyzes your hiring history, payment records, worker feedback, and business verification to generate a professional employer profile, psychometry score, and KPIs in seconds.
            </Text>

            <View style={styles.featureList}>
              {[
                { icon: "file-text", label: "Professional bio & summary" },
                { icon: "bar-chart-2", label: "Management skills assessment" },
                { icon: "activity", label: "Employer psychometry profile" },
                { icon: "trending-up", label: "Performance KPIs & benchmarks" },
                { icon: "award", label: "Certifications & licenses" },
                { icon: "share-2", label: "Share-ready profile export" },
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
              <Text style={styles.generateBtnText}>Generate Profile</Text>
            </Pressable>
          </View>
        )}

        {generating && (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingTitle, { color: colors.foreground }]}>Generating Profile...</Text>
            {["Analyzing hiring history...", "Scoring management skills...", "Running psychometry model...", "Calculating KPIs...", "Composing bio..."].map((step, i) => (
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
                <Text style={[styles.bioText, { color: colors.mutedForeground }]}>{MOCK_EMPLOYER_CV.bio}</Text>
                <View style={styles.eduList}>
                  <Text style={[styles.cardTitle, { color: colors.foreground, marginBottom: 12 }]}>Certifications & Licenses</Text>
                  {MOCK_EMPLOYER_CV.certifications.map((cert, i) => (
                    <View key={i} style={[styles.eduRow, { borderColor: colors.border }]}>
                      <View style={[styles.eduIcon, { backgroundColor: `${colors.primary}15` }]}>
                        <Feather name="award" size={16} color={colors.primary} />
                      </View>
                      <View style={styles.eduInfo}>
                        <Text style={[styles.eduDegree, { color: colors.foreground }]}>{cert.title}</Text>
                        <Text style={[styles.eduInst, { color: colors.mutedForeground }]}>{cert.issuer} · {cert.year}</Text>
                      </View>
                      {cert.verified && <Feather name="shield" size={16} color={colors.success} />}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {activeTab === "skills" && (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Management Skills Assessment</Text>
                <View style={styles.skillsList}>
                  {MOCK_EMPLOYER_CV.skills.map((skill) => (
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
                    <Text style={[styles.cardTitle, { color: colors.foreground }]}>Employer Psychometry</Text>
                    <Text style={[styles.psychSub, { color: colors.mutedForeground }]}>5-dimensional assessment</Text>
                  </View>
                  <View style={[styles.psychScore, { backgroundColor: `${colors.primary}15` }]}>
                    <Text style={[styles.psychScoreNum, { color: colors.primary }]}>{MOCK_EMPLOYER_CV.psychometry.overall}</Text>
                    <Text style={[styles.psychScoreLabel, { color: colors.mutedForeground }]}>Overall</Text>
                  </View>
                </View>
                <View style={styles.psychList}>
                  {MOCK_EMPLOYER_CV.psychometry.dimensions.map((d) => (
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
                    Top 10% fairness among all Serategna employers
                  </Text>
                </View>
              </View>
            )}

            {activeTab === "kpi" && (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Performance KPIs</Text>
                <View style={styles.kpiGrid}>
                  {MOCK_EMPLOYER_CV.kpis.map((kpi) => (
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
                onPress={() => router.push("/post-job")}
              >
                <Feather name="plus" size={18} color="#fff" />
                <Text style={styles.actionBtnText}>Post New Job</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, styles.actionBtnOutline, { borderColor: colors.primary }]}
                onPress={() => {/* Share logic */}}
              >
                <Feather name="share-2" size={18} color={colors.primary} />
                <Text style={[styles.actionBtnText, { color: colors.primary }]}>Share Profile</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: { paddingHorizontal: 20, paddingBottom: 24 },
  backBtn: { position: "absolute", top: 16, left: 20, padding: 8, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.1)" },
  heroContent: { alignItems: "center", marginBottom: 20 },
  aiIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  heroTitle: { fontSize: 24, fontWeight: "700", color: "#fff", marginBottom: 4 },
  heroSub: { fontSize: 14, color: "rgba(255,255,255,0.8)", textAlign: "center" },
  heroBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(16,185,129,0.2)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginTop: 12 },
  heroBadgeText: { fontSize: 12, color: "#fff", marginLeft: 6, fontWeight: "600" },
  scoreRow: { flexDirection: "row", justifyContent: "space-between" },
  scoreBox: { alignItems: "center", flex: 1 },
  scoreBoxMid: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  scoreNum: { fontSize: 20, fontWeight: "700", color: "#fff" },
  scoreLabel: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  body: { paddingHorizontal: 20 },
  preGenerate: { alignItems: "center", paddingTop: 40 },
  preIconWrap: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  preTitle: { fontSize: 24, fontWeight: "700", textAlign: "center", marginBottom: 12 },
  preDesc: { fontSize: 16, lineHeight: 24, textAlign: "center", marginBottom: 32, paddingHorizontal: 20 },
  featureList: { width: "100%", marginBottom: 32 },
  featureRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, borderRadius: 12, marginBottom: 8 },
  featureIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", marginRight: 12 },
  featureLabel: { flex: 1, fontSize: 14, fontWeight: "500" },
  generateBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#1A7F6E", paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12 },
  generateBtnText: { fontSize: 16, fontWeight: "600", color: "#fff", marginLeft: 8 },
  loadingState: { alignItems: "center", paddingTop: 60 },
  loadingTitle: { fontSize: 18, fontWeight: "600", marginTop: 16, marginBottom: 32 },
  loadingStep: { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 16, borderWidth: 1, borderRadius: 8, marginBottom: 8, width: "100%" },
  loadingStepText: { fontSize: 14, marginLeft: 12 },
  tabBar: { flexDirection: "row", borderWidth: 1, borderRadius: 12, marginBottom: 20, padding: 4 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 },
  tabText: { fontSize: 12, fontWeight: "500", marginLeft: 6 },
  card: { borderWidth: 1, borderRadius: 16, padding: 20, marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: "600", marginBottom: 16 },
  bioText: { fontSize: 14, lineHeight: 22, marginBottom: 24 },
  eduList: {},
  eduRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1 },
  eduIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginRight: 12 },
  eduInfo: { flex: 1 },
  eduDegree: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  eduInst: { fontSize: 12 },
  addEduBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, borderRadius: 8, marginTop: 12 },
  addEduText: { fontSize: 14, fontWeight: "500", marginLeft: 8 },
  skillsList: {},
  skillItem: { marginBottom: 16 },
  skillHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  skillLabel: { fontSize: 14, fontWeight: "500" },
  skillScore: { fontSize: 14, fontWeight: "600" },
  skillTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  skillFill: { height: "100%" },
  psychHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  psychSub: { fontSize: 14, marginTop: 4 },
  psychScore: { alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  psychScoreNum: { fontSize: 24, fontWeight: "700" },
  psychScoreLabel: { fontSize: 12, marginTop: 2 },
  psychList: {},
  psychRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  psychDimLabel: { flex: 1, fontSize: 14, fontWeight: "500" },
  psychBarWrap: { flexDirection: "row", alignItems: "center", flex: 1, marginLeft: 12 },
  psychTrack: { flex: 1, height: 6, borderRadius: 3, marginRight: 12 },
  psychFill: { height: "100%" },
  psychDimScore: { fontSize: 12, fontWeight: "600", width: 30, textAlign: "right" },
  psychInsight: { flexDirection: "row", alignItems: "center", padding: 12, borderWidth: 1, borderRadius: 8, marginTop: 16 },
  psychInsightText: { fontSize: 14, marginLeft: 8 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  kpiCard: { width: "48%", borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 12, alignItems: "center" },
  kpiIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  kpiValue: { fontSize: 20, fontWeight: "700", marginBottom: 4 },
  kpiLabel: { fontSize: 12, textAlign: "center" },
  actions: { flexDirection: "row", gap: 12 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 12 },
  actionBtnOutline: { backgroundColor: "transparent" },
  actionBtnText: { fontSize: 16, fontWeight: "600", marginLeft: 8 },
});