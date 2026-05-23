import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useLang } from "@/context/LanguageContext";

const INSTITUTIONS = [
  "Addis Ababa University",
  "Jimma University",
  "Hawassa University",
  "Bahir Dar University",
  "Mekelle University",
  "Haramaya University",
  "Arba Minch University",
  "Dire Dawa University",
  "Adama Science & Technology University",
  "Ethiopian Civil Service University",
  "Addis Ababa Polytechnic College",
  "Kotebe Metropolitan University",
];

const MOCK_RESULTS: Record<string, { name: string; degree: string; institution: string; year: string; gpa: string; status: "verified" | "pending" | "not_found" }> = {
  "ETH-2018-00123": {
    name: "Abebe Kebede",
    degree: "BSc in Civil Engineering",
    institution: "Addis Ababa University",
    year: "2018",
    gpa: "3.6",
    status: "verified",
  },
  "ETH-2020-00456": {
    name: "Tigist Alemu",
    degree: "MBA in Business Administration",
    institution: "Ethiopian Civil Service University",
    year: "2020",
    gpa: "3.9",
    status: "verified",
  },
  "ETH-2022-00789": {
    name: "Dawit Haile",
    degree: "BSc in Information Technology",
    institution: "Adama Science & Technology University",
    year: "2022",
    gpa: "3.4",
    status: "pending",
  },
};

type VerifyResult = typeof MOCK_RESULTS[string] | null;

export default function MoEVerifyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useLang();

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult>(null);
  const [searched, setSearched] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!query.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setSearched(false);
    await new Promise((r) => setTimeout(r, 2000));
    const found = MOCK_RESULTS[query.toUpperCase().trim()] || null;
    setResult(found);
    setSearched(true);
    setLoading(false);
    if (found) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const statusConfig = {
    verified: { color: "#10B981", bg: "#10B98115", icon: "shield", label: "Verified by MoE" },
    pending: { color: "#F59E0B", bg: "#F59E0B15", icon: "clock", label: "Pending Review" },
    not_found: { color: "#EF4444", bg: "#EF444415", icon: "x-circle", label: "Not Found in Registry" },
  };

  const tryValues = Object.keys(MOCK_RESULTS);

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient colors={["#0D5C4F", "#1A7F6E"]} style={[styles.hero, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color="rgba(255,255,255,0.9)" />
          </Pressable>
          <View style={styles.heroContent}>
            <View style={styles.moeLogo}>
              <Feather name="book-open" size={28} color="#fff" />
            </View>
            <Text style={styles.heroTitle}>{t("moe.title")}</Text>
            <Text style={styles.heroSub}>{t("moe.subtitle")} · Federal Democratic Republic of Ethiopia</Text>
          </View>
          <View style={styles.statRow}>
            {[
              { value: "42", label: "Universities" },
              { value: "508K+", label: "Graduates" },
              { value: "99.2%", label: "Accuracy" },
            ].map((s) => (
              <View key={s.label} style={styles.statBox}>
                <Text style={styles.statNum}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {/* Search Box */}
          <View style={[styles.searchCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Search Degree Registry</Text>
            <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
              Enter a certificate number (e.g. ETH-2018-00123) to verify
            </Text>
            <View style={[styles.inputWrap, { borderColor: loading || query ? colors.primary : colors.border, backgroundColor: colors.background }]}>
              <Feather name="search" size={18} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={query}
                onChangeText={setQuery}
                placeholder="Certificate number or full name"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="characters"
                returnKeyType="search"
                onSubmitEditing={handleVerify}
              />
              {query.length > 0 && (
                <Pressable onPress={() => { setQuery(""); setSearched(false); setResult(null); }}>
                  <Feather name="x" size={16} color={colors.mutedForeground} />
                </Pressable>
              )}
            </View>

            <Text style={[styles.tryLabel, { color: colors.mutedForeground }]}>Try demo values:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.tryRow}>
                {tryValues.map((v) => (
                  <Pressable
                    key={v}
                    style={[styles.tryChip, { borderColor: colors.primary, backgroundColor: `${colors.primary}10` }]}
                    onPress={() => setQuery(v)}
                  >
                    <Text style={[styles.tryChipText, { color: colors.primary }]}>{v}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Pressable
              style={[styles.verifyBtn, { backgroundColor: loading ? `${colors.primary}70` : colors.primary }]}
              onPress={handleVerify}
              disabled={loading || !query.trim()}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Feather name="shield" size={18} color="#fff" />
                  <Text style={styles.verifyBtnText}>{t("moe.verify")}</Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Result */}
          {searched && result && (
            <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: statusConfig[result.status].color + "40" }]}>
              <View style={[styles.resultStatus, { backgroundColor: statusConfig[result.status].bg }]}>
                <Feather name={statusConfig[result.status].icon as any} size={16} color={statusConfig[result.status].color} />
                <Text style={[styles.resultStatusText, { color: statusConfig[result.status].color }]}>
                  {statusConfig[result.status].label}
                </Text>
              </View>
              <Text style={[styles.resultName, { color: colors.foreground }]}>{result.name}</Text>
              <View style={styles.resultFields}>
                {[
                  { label: t("moe.degree"), value: result.degree, icon: "award" },
                  { label: t("moe.institution"), value: result.institution, icon: "home" },
                  { label: t("moe.year"), value: result.year, icon: "calendar" },
                  { label: "GPA", value: result.gpa, icon: "bar-chart-2" },
                ].map((f) => (
                  <View key={f.label} style={[styles.resultField, { borderColor: colors.border }]}>
                    <View style={[styles.resultFieldIcon, { backgroundColor: `${colors.primary}12` }]}>
                      <Feather name={f.icon as any} size={14} color={colors.primary} />
                    </View>
                    <View style={styles.resultFieldText}>
                      <Text style={[styles.resultFieldLabel, { color: colors.mutedForeground }]}>{f.label}</Text>
                      <Text style={[styles.resultFieldValue, { color: colors.foreground }]}>{f.value}</Text>
                    </View>
                  </View>
                ))}
              </View>
              {result.status === "verified" && (
                <Pressable
                  style={[styles.addToProfileBtn, { backgroundColor: colors.primary }]}
                  onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); router.back(); }}
                >
                  <Feather name="plus-circle" size={18} color="#fff" />
                  <Text style={styles.addToProfileText}>Add to My CV Profile</Text>
                </Pressable>
              )}
            </View>
          )}

          {searched && !result && (
            <View style={[styles.notFoundCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="alert-circle" size={36} color={colors.mutedForeground} />
              <Text style={[styles.notFoundTitle, { color: colors.foreground }]}>Not Found in Registry</Text>
              <Text style={[styles.notFoundDesc, { color: colors.mutedForeground }]}>
                This certificate was not found in the MoE national registry. Please check the certificate number or contact your institution.
              </Text>
            </View>
          )}

          {/* Institutions Grid */}
          <View style={styles.instSection}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Registered Institutions</Text>
            <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>{INSTITUTIONS.length} institutions in the national registry</Text>
            <View style={styles.instGrid}>
              {INSTITUTIONS.map((inst, i) => (
                <Pressable
                  key={i}
                  style={[styles.instChip, {
                    backgroundColor: selectedInstitution === inst ? `${colors.primary}15` : colors.card,
                    borderColor: selectedInstitution === inst ? colors.primary : colors.border,
                  }]}
                  onPress={() => setSelectedInstitution(selectedInstitution === inst ? null : inst)}
                >
                  <Feather name="home" size={12} color={selectedInstitution === inst ? colors.primary : colors.mutedForeground} />
                  <Text style={[styles.instChipText, { color: selectedInstitution === inst ? colors.primary : colors.foreground }]}>
                    {inst}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Info card */}
          <View style={[styles.infoCard, { backgroundColor: `${colors.info}10`, borderColor: `${colors.info}30` }]}>
            <Feather name="info" size={16} color={colors.info} />
            <View style={styles.infoText}>
              <Text style={[styles.infoTitle, { color: colors.foreground }]}>About MoE Verification</Text>
              <Text style={[styles.infoDesc, { color: colors.mutedForeground }]}>
                Serategna is an official partner of Ethiopia's Ministry of Education. Verified degrees are added to your Fayda-linked credential wallet and increase your trust score.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: { paddingHorizontal: 20, paddingBottom: 24, gap: 16 },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  heroContent: { gap: 8 },
  moeLogo: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  heroTitle: { fontFamily: "Inter_700Bold", fontSize: 26, color: "#fff", letterSpacing: -0.5 },
  heroSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: "rgba(255,255,255,0.7)" },
  statRow: { flexDirection: "row", borderRadius: 14, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.1)" },
  statBox: { flex: 1, alignItems: "center", paddingVertical: 12, gap: 3 },
  statNum: { fontFamily: "Inter_700Bold", fontSize: 18, color: "#fff" },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: "rgba(255,255,255,0.7)" },
  body: { padding: 20, gap: 16 },
  searchCard: { borderWidth: 1, borderRadius: 20, padding: 20, gap: 14 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  sectionSub: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: -8 },
  inputWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, height: 52,
  },
  input: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15 },
  tryLabel: { fontFamily: "Inter_500Medium", fontSize: 12, marginBottom: -6 },
  tryRow: { flexDirection: "row", gap: 8 },
  tryChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  tryChipText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  verifyBtn: { height: 52, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  verifyBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
  resultCard: { borderWidth: 1.5, borderRadius: 20, padding: 20, gap: 14 },
  resultStatus: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  resultStatusText: { fontFamily: "Inter_700Bold", fontSize: 13 },
  resultName: { fontFamily: "Inter_700Bold", fontSize: 20, letterSpacing: -0.3 },
  resultFields: { gap: 10 },
  resultField: { flexDirection: "row", alignItems: "center", gap: 12, paddingBottom: 10, borderBottomWidth: 1 },
  resultFieldIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  resultFieldText: { flex: 1, gap: 2 },
  resultFieldLabel: { fontFamily: "Inter_400Regular", fontSize: 11 },
  resultFieldValue: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  addToProfileBtn: { height: 50, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  addToProfileText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },
  notFoundCard: { borderWidth: 1, borderRadius: 20, padding: 32, alignItems: "center", gap: 12 },
  notFoundTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  notFoundDesc: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, textAlign: "center" },
  instSection: { gap: 12 },
  instGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  instChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  instChipText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  infoCard: { flexDirection: "row", gap: 12, padding: 16, borderRadius: 16, borderWidth: 1 },
  infoText: { flex: 1, gap: 4 },
  infoTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  infoDesc: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
});
