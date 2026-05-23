import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
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

interface LoanProduct {
  id: string;
  bank: string;
  bankShort: string;
  type: "bank" | "mfi" | "insurance" | "savings";
  product: string;
  amount: string;
  rate: string;
  term: string;
  minScore: number;
  color: string;
  features: string[];
}

const PRODUCTS: LoanProduct[] = [
  {
    id: "cbe1",
    bank: "Commercial Bank of Ethiopia",
    bankShort: "CBE",
    type: "bank",
    product: "Salary-Linked Micro Loan",
    amount: "Up to 50,000 ETB",
    rate: "12.5% p.a.",
    term: "12 months",
    minScore: 700,
    color: "#1976D2",
    features: ["No collateral required", "Same-day approval", "Linked to Serategna earnings", "Auto-repay from wallet"],
  },
  {
    id: "weg1",
    bank: "Wegagen Bank",
    bankShort: "WB",
    type: "bank",
    product: "Skill Worker Credit Line",
    amount: "Up to 30,000 ETB",
    rate: "14% p.a.",
    term: "6 months",
    minScore: 650,
    color: "#E91E63",
    features: ["Revolving credit line", "Withdraw as needed", "Trust Score as guarantee", "Mobile repayment"],
  },
  {
    id: "das1",
    bank: "Dashen Bank",
    bankShort: "DB",
    type: "bank",
    product: "Trade Finance Advance",
    amount: "Up to 100,000 ETB",
    rate: "13% p.a.",
    term: "24 months",
    minScore: 800,
    color: "#FF6F00",
    features: ["For certified tradespeople", "Tools & equipment purchase", "Fayda-verified only", "Grace period available"],
  },
  {
    id: "awash1",
    bank: "Awash Bank",
    bankShort: "AB",
    type: "bank",
    product: "Worker Savings Loan",
    amount: "Up to 20,000 ETB",
    rate: "11% p.a.",
    term: "6 months",
    minScore: 600,
    color: "#2E7D32",
    features: ["Savings-backed", "Build credit history", "Lowest rate tier", "No processing fee"],
  },
  {
    id: "abyssinia1",
    bank: "Abyssinia Bank",
    bankShort: "BofA",
    type: "bank",
    product: "Gig Worker Advance",
    amount: "Up to 15,000 ETB",
    rate: "15% p.a.",
    term: "3 months",
    minScore: 600,
    color: "#6A1B9A",
    features: ["Instant approval", "Advance on confirmed jobs", "No paperwork", "Repay post-job"],
  },
  {
    id: "acsi1",
    bank: "ACSI Micro Finance",
    bankShort: "ACSI",
    type: "mfi",
    product: "Productive Sector Loan",
    amount: "Up to 10,000 ETB",
    rate: "18% p.a.",
    term: "12 months",
    minScore: 500,
    color: "#00796B",
    features: ["Rural & urban workers", "Group guarantee option", "Business startup support", "Financial literacy training"],
  },
  {
    id: "ocssco1",
    bank: "Oromia Credit & Savings",
    bankShort: "OCSSCO",
    type: "mfi",
    product: "Self-Employment Loan",
    amount: "Up to 8,000 ETB",
    rate: "16% p.a.",
    term: "12 months",
    minScore: 500,
    color: "#F57C00",
    features: ["Oromo region focus", "Skills-based eligibility", "Cooperative model", "Flexible repayment"],
  },
  {
    id: "ins1",
    bank: "Nyala Insurance",
    bankShort: "NIC",
    type: "insurance",
    product: "Worker Accident Cover",
    amount: "Up to 200,000 ETB",
    rate: "2.5% of annual earnings",
    term: "Annual",
    minScore: 600,
    color: "#D32F2F",
    features: ["On-the-job accident cover", "Medical expense cover", "Disability benefit", "Fayda-linked policy"],
  },
  {
    id: "sav1",
    bank: "Lion International Bank",
    bankShort: "LIB",
    type: "savings",
    product: "Goal-Based Savings Account",
    amount: "From 500 ETB/month",
    rate: "7% interest p.a.",
    term: "Open-ended",
    minScore: 550,
    color: "#1565C0",
    features: ["Earmark for tools/training", "Auto-save from wages", "No minimum balance", "Interest on balance"],
  },
];

const TYPE_LABELS = { bank: "Bank", mfi: "Micro Finance", insurance: "Insurance", savings: "Savings" };
const TYPE_COLORS = { bank: "#1976D2", mfi: "#00796B", insurance: "#D32F2F", savings: "#1565C0" };

export default function FinanceHubScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<"all" | "bank" | "mfi" | "insurance" | "savings">("all");
  const [appliedId, setAppliedId] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  if (!user) return null;
  const score = user.trustScore;

  const eligible = PRODUCTS.filter((p) => score >= p.minScore);
  const locked = PRODUCTS.filter((p) => score < p.minScore);
  const filtered = activeFilter === "all"
    ? [...eligible, ...locked]
    : [...eligible, ...locked].filter((p) => p.type === activeFilter);

  const handleApply = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setApplyingId(id);
    await new Promise((r) => setTimeout(r, 1500));
    setApplyingId(null);
    setAppliedId(id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const scoreLevel =
    score >= 800 ? { label: "Gold", color: "#F59E0B", next: null } :
    score >= 700 ? { label: "Silver", color: "#94A3B8", next: 800 } :
    score >= 600 ? { label: "Bronze", color: "#CD7F32", next: 700 } :
    { label: "Basic", color: colors.mutedForeground, next: 600 };

  const progressPct = Math.min((score / 1000) * 100, 100);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <LinearGradient colors={["#0F4C81", "#1565C0"]} style={[styles.hero, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="rgba(255,255,255,0.9)" />
        </Pressable>

        <View style={styles.heroContent}>
          <View style={styles.heroIcon}>
            <Feather name="trending-up" size={28} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>Financial Access Hub</Text>
          <Text style={styles.heroSub}>Your Trust Score is your collateral</Text>
        </View>

        {/* Score Card */}
        <View style={[styles.scoreCard, { backgroundColor: "rgba(255,255,255,0.12)" }]}>
          <View style={styles.scoreRow}>
            <View>
              <Text style={styles.scoreCardLabel}>Your Trust Score</Text>
              <Text style={styles.scoreCardNum}>{score}</Text>
            </View>
            <View style={[styles.levelBadge, { backgroundColor: scoreLevel.color }]}>
              <Feather name="award" size={14} color="#fff" />
              <Text style={styles.levelText}>{scoreLevel.label}</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` as any, backgroundColor: scoreLevel.color }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>0</Text>
            {scoreLevel.next && <Text style={styles.progressLabel}>Next level at {scoreLevel.next}</Text>}
            <Text style={styles.progressLabel}>1000</Text>
          </View>
          <View style={styles.eligibleRow}>
            <Feather name="check-circle" size={14} color="#4ADE80" />
            <Text style={styles.eligibleText}>{eligible.length} products unlocked · {locked.length} more at higher scores</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.heroStats}>
          {[
            { value: `${eligible.length}`, label: "Eligible Now" },
            { value: "9", label: "Partner Institutions" },
            { value: "0", label: "Collateral Required" },
          ].map((s, i) => (
            <View key={s.label} style={[styles.heroStatBox, i > 0 && styles.heroStatBorder]}>
              <Text style={styles.heroStatVal}>{s.value}</Text>
              <Text style={styles.heroStatLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {/* How it works */}
        <View style={[styles.infoCard, { backgroundColor: `${colors.success}10`, borderColor: `${colors.success}30` }]}>
          <Feather name="info" size={16} color={colors.success} />
          <View style={styles.infoText}>
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>How collateral-free lending works</Text>
            <Text style={[styles.infoDesc, { color: colors.mutedForeground }]}>
              Your Serategna Trust Score, Fayda-verified identity, job history, and on-time payment record serve as a digital credit guarantee — no land title or equipment needed.
            </Text>
          </View>
        </View>

        {/* Filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterRow}>
            {(["all", "bank", "mfi", "insurance", "savings"] as const).map((f) => (
              <Pressable
                key={f}
                style={[styles.filterChip, {
                  backgroundColor: activeFilter === f ? colors.primary : colors.card,
                  borderColor: activeFilter === f ? colors.primary : colors.border,
                }]}
                onPress={() => { Haptics.selectionAsync(); setActiveFilter(f); }}
              >
                <Text style={[styles.filterText, { color: activeFilter === f ? "#fff" : colors.mutedForeground }]}>
                  {f === "all" ? "All Products" : TYPE_LABELS[f]}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Products */}
        {filtered.map((product) => {
          const isLocked = score < product.minScore;
          const isApplied = appliedId === product.id;
          const isApplying = applyingId === product.id;
          return (
            <View
              key={product.id}
              style={[styles.productCard, {
                backgroundColor: colors.card,
                borderColor: isApplied ? colors.success : isLocked ? colors.border : colors.border,
                opacity: isLocked ? 0.6 : 1,
              }]}
            >
              {/* Header */}
              <View style={styles.productHeader}>
                <View style={[styles.bankIcon, { backgroundColor: `${product.color}15` }]}>
                  <Text style={[styles.bankInitials, { color: product.color }]}>{product.bankShort}</Text>
                </View>
                <View style={styles.productHeaderText}>
                  <Text style={[styles.bankName, { color: colors.mutedForeground }]}>{product.bank}</Text>
                  <Text style={[styles.productName, { color: colors.foreground }]}>{product.product}</Text>
                </View>
                <View style={[styles.typeTag, { backgroundColor: `${TYPE_COLORS[product.type]}15` }]}>
                  <Text style={[styles.typeTagText, { color: TYPE_COLORS[product.type] }]}>
                    {TYPE_LABELS[product.type]}
                  </Text>
                </View>
              </View>

              {/* Details */}
              <View style={styles.productDetails}>
                <View style={[styles.detailBox, { backgroundColor: colors.background }]}>
                  <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Amount</Text>
                  <Text style={[styles.detailValue, { color: colors.foreground }]}>{product.amount}</Text>
                </View>
                <View style={[styles.detailBox, { backgroundColor: colors.background }]}>
                  <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Rate</Text>
                  <Text style={[styles.detailValue, { color: colors.foreground }]}>{product.rate}</Text>
                </View>
                <View style={[styles.detailBox, { backgroundColor: colors.background }]}>
                  <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Term</Text>
                  <Text style={[styles.detailValue, { color: colors.foreground }]}>{product.term}</Text>
                </View>
              </View>

              {/* Features */}
              <View style={styles.featuresList}>
                {product.features.map((f) => (
                  <View key={f} style={styles.featureRow}>
                    <Feather name="check" size={13} color={colors.success} />
                    <Text style={[styles.featureText, { color: colors.mutedForeground }]}>{f}</Text>
                  </View>
                ))}
              </View>

              {/* Lock / Eligibility */}
              {isLocked ? (
                <View style={[styles.lockedBanner, { backgroundColor: `${colors.warning}10`, borderColor: `${colors.warning}30` }]}>
                  <Feather name="lock" size={14} color={colors.warning} />
                  <Text style={[styles.lockedText, { color: colors.warning }]}>
                    Requires Trust Score {product.minScore}+ (yours: {score})
                  </Text>
                </View>
              ) : isApplied ? (
                <View style={[styles.appliedBanner, { backgroundColor: `${colors.success}10`, borderColor: `${colors.success}30` }]}>
                  <Feather name="check-circle" size={16} color={colors.success} />
                  <Text style={[styles.appliedText, { color: colors.success }]}>Application submitted · Expect call within 24 hours</Text>
                </View>
              ) : (
                <Pressable
                  style={[styles.applyBtn, { backgroundColor: product.color, opacity: isApplying ? 0.7 : 1 }]}
                  onPress={() => handleApply(product.id)}
                  disabled={isApplying}
                >
                  {isApplying ? (
                    <Text style={styles.applyBtnText}>Processing...</Text>
                  ) : (
                    <>
                      <Feather name="arrow-right" size={16} color="#fff" />
                      <Text style={styles.applyBtnText}>Apply Now — Collateral Free</Text>
                    </>
                  )}
                </Pressable>
              )}
            </View>
          );
        })}

        {/* Score boost tip */}
        <View style={[styles.boostCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.boostTitle, { color: colors.foreground }]}>How to raise your score</Text>
          {[
            { icon: "check-circle", tip: "Complete jobs on time — +5 pts each", color: "#10B981" },
            { icon: "shield", tip: "Maintain Fayda ID verification — +20 pts", color: "#1A7F6E" },
            { icon: "star", tip: "Get 5-star ratings — +3 pts each", color: "#F59E0B" },
            { icon: "book-open", tip: "Verify degree with MoE — +50 pts", color: "#8B5CF6" },
            { icon: "cpu", tip: "Complete AI CV assessment — +15 pts", color: "#0EA5E9" },
            { icon: "credit-card", tip: "Zero payment disputes — +10 pts/month", color: "#EC4899" },
          ].map((item) => (
            <View key={item.tip} style={[styles.boostRow, { borderColor: colors.border }]}>
              <View style={[styles.boostIcon, { backgroundColor: `${item.color}15` }]}>
                <Feather name={item.icon as any} size={14} color={item.color} />
              </View>
              <Text style={[styles.boostTip, { color: colors.mutedForeground }]}>{item.tip}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: { paddingHorizontal: 20, paddingBottom: 24, gap: 16 },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  heroContent: { gap: 6 },
  heroIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  heroTitle: { fontFamily: "Inter_700Bold", fontSize: 24, color: "#fff", letterSpacing: -0.4 },
  heroSub: { fontFamily: "Inter_400Regular", fontSize: 14, color: "rgba(255,255,255,0.7)" },
  scoreCard: { borderRadius: 16, padding: 16, gap: 10 },
  scoreRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  scoreCardLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(255,255,255,0.7)" },
  scoreCardNum: { fontFamily: "Inter_700Bold", fontSize: 40, color: "#fff", letterSpacing: -1 },
  levelBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  levelText: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#fff" },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.2)", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  progressLabels: { flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { fontFamily: "Inter_400Regular", fontSize: 10, color: "rgba(255,255,255,0.5)" },
  eligibleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  eligibleText: { fontFamily: "Inter_500Medium", fontSize: 12, color: "rgba(255,255,255,0.8)" },
  heroStats: { flexDirection: "row", borderRadius: 12, overflow: "hidden", backgroundColor: "rgba(0,0,0,0.2)" },
  heroStatBox: { flex: 1, alignItems: "center", paddingVertical: 10, gap: 2 },
  heroStatBorder: { borderLeftWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  heroStatVal: { fontFamily: "Inter_700Bold", fontSize: 18, color: "#fff" },
  heroStatLabel: { fontFamily: "Inter_400Regular", fontSize: 10, color: "rgba(255,255,255,0.65)" },
  body: { padding: 20, gap: 16 },
  infoCard: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 14, borderWidth: 1 },
  infoText: { flex: 1, gap: 4 },
  infoTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  infoDesc: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  filterRow: { flexDirection: "row", gap: 8, paddingBottom: 4 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  productCard: { borderWidth: 1, borderRadius: 20, padding: 18, gap: 14 },
  productHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  bankIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  bankInitials: { fontFamily: "Inter_700Bold", fontSize: 13 },
  productHeaderText: { flex: 1, gap: 2 },
  bankName: { fontFamily: "Inter_400Regular", fontSize: 11 },
  productName: { fontFamily: "Inter_700Bold", fontSize: 15 },
  typeTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeTagText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  productDetails: { flexDirection: "row", gap: 8 },
  detailBox: { flex: 1, borderRadius: 10, padding: 10, gap: 4 },
  detailLabel: { fontFamily: "Inter_400Regular", fontSize: 10 },
  detailValue: { fontFamily: "Inter_700Bold", fontSize: 13 },
  featuresList: { gap: 7 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },
  lockedBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
  lockedText: { fontFamily: "Inter_500Medium", fontSize: 13, flex: 1 },
  appliedBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
  appliedText: { fontFamily: "Inter_500Medium", fontSize: 13, flex: 1 },
  applyBtn: { height: 48, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  applyBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#fff" },
  boostCard: { borderWidth: 1, borderRadius: 20, padding: 18, gap: 12 },
  boostTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  boostRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8, borderBottomWidth: 1 },
  boostIcon: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  boostTip: { fontFamily: "Inter_500Medium", fontSize: 13, flex: 1 },
});
