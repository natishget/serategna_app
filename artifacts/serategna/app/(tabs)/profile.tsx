import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TrustScoreBadge } from "@/components/TrustScoreBadge";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LanguageContext";
import { LANGUAGES } from "@/constants/i18n";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLang();

  if (!user) return null;

  const roleColor =
    user.role === "worker" ? colors.primary :
    user.role === "employer" ? colors.accent :
    "#7C3AED";

  const stats = [
    { label: "Jobs Done", value: user.completedJobs, icon: "check-circle" },
    { label: "Rating", value: user.rating.toFixed(1), icon: "star" },
    { label: "On Time", value: "94%", icon: "clock" },
  ];

  const menuItems = [
    { icon: "cpu", label: "AI CV Builder", onPress: () => router.push("/ai-cv") },
    { icon: "book-open", label: "Degree Verification (MoE)", onPress: () => router.push("/moe-verify") },
    { icon: "settings", label: "Settings", onPress: () => {} },
    { icon: "shield", label: "Identity (Fayda)", onPress: () => {} },
    { icon: "bell", label: "Notifications", onPress: () => {} },
    { icon: "globe", label: "Language", onPress: null, isLanguage: true },
    { icon: "help-circle", label: "Help & Support", onPress: () => {} },
    { icon: "log-out", label: "Logout", onPress: () => {
      Alert.alert("Logout", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: logout },
      ]);
    }},
  ];

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100),
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>{t("profile.title")}</Text>

      {/* Profile Hero */}
      <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.heroTop}>
          <View style={[styles.avatar, { backgroundColor: `${roleColor}20` }]}>
            <Text style={[styles.avatarText, { color: roleColor }]}>{user.name.charAt(0)}</Text>
          </View>
          <View style={styles.heroInfo}>
            <Text style={[styles.name, { color: colors.foreground }]}>{user.name}</Text>
            <View style={[styles.roleBadge, { backgroundColor: `${roleColor}20` }]}>
              <Text style={[styles.roleText, { color: roleColor }]}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Text>
            </View>
            {user.faydaVerified && (
              <View style={styles.verifiedRow}>
                <Feather name="shield" size={13} color={colors.success} />
                <Text style={[styles.verifiedText, { color: colors.success }]}>Fayda Verified</Text>
              </View>
            )}
          </View>
          <TrustScoreBadge score={user.trustScore} size="md" />
        </View>

        <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
          {stats.map((s, i) => (
            <React.Fragment key={s.label}>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
              </View>
              {i < stats.length - 1 && <View style={[styles.statDivider, { backgroundColor: colors.border }]} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* Skills (worker only) */}
      {user.role === "worker" && user.skills && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t("profile.skills")}</Text>
          <View style={styles.skillsRow}>
            {user.skills.map((skill) => (
              <View key={skill} style={[styles.skillChip, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}30` }]}>
                <Text style={[styles.skillText, { color: colors.primary }]}>{skill}</Text>
              </View>
            ))}
            <Pressable style={[styles.skillChip, { backgroundColor: colors.muted, borderColor: colors.border, borderStyle: "dashed" }]}>
              <Feather name="plus" size={14} color={colors.mutedForeground} />
              <Text style={[styles.skillText, { color: colors.mutedForeground }]}>Add</Text>
            </Pressable>
          </View>
        </>
      )}

      {/* Language Selector */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Language</Text>
      <View style={styles.langGrid}>
        {LANGUAGES.map((lang) => (
          <Pressable
            key={lang.code}
            style={[
              styles.langBtn,
              {
                borderColor: language === lang.code ? colors.primary : colors.border,
                backgroundColor: language === lang.code ? `${colors.primary}12` : colors.card,
              },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setLanguage(lang.code);
            }}
          >
            {language === lang.code && <Feather name="check" size={14} color={colors.primary} />}
            <Text style={[styles.langText, { color: language === lang.code ? colors.primary : colors.foreground }]}>
              {lang.nativeLabel}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Menu */}
      <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {menuItems.map((item, i) => (
          <Pressable
            key={item.label}
            style={({ pressed }) => [
              styles.menuItem,
              {
                borderBottomColor: colors.border,
                borderBottomWidth: i < menuItems.length - 1 ? 1 : 0,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              item.onPress?.();
            }}
          >
            <Feather
              name={item.icon as any}
              size={18}
              color={item.label === "Logout" ? colors.destructive : colors.mutedForeground}
            />
            <Text
              style={[
                styles.menuLabel,
                { color: item.label === "Logout" ? colors.destructive : colors.foreground },
              ]}
            >
              {item.label}
            </Text>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { paddingHorizontal: 20, gap: 20 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, letterSpacing: -0.5 },
  heroCard: { borderRadius: 20, borderWidth: 1, overflow: "hidden" },
  heroTop: { flexDirection: "row", alignItems: "flex-start", gap: 14, padding: 18 },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: "Inter_700Bold", fontSize: 26 },
  heroInfo: { flex: 1, gap: 6 },
  name: { fontFamily: "Inter_700Bold", fontSize: 20 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, alignSelf: "flex-start" },
  roleText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  verifiedRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  verifiedText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  statsRow: { flexDirection: "row", borderTopWidth: 1, paddingTop: 16, paddingHorizontal: 18, paddingBottom: 18 },
  stat: { flex: 1, alignItems: "center", gap: 3 },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 20 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 12 },
  statDivider: { width: 1, height: 40 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 16, letterSpacing: -0.2 },
  skillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  skillChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  skillText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  langGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  langBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  langText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  menuCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 18, paddingVertical: 16 },
  menuLabel: { fontFamily: "Inter_500Medium", fontSize: 15, flex: 1 },
});
