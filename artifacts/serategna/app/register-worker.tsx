import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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
import { registerWorkerSchema } from "@workspace/api-zod";

const SKILL_OPTIONS = [
  "Plumbing",
  "Electrical",
  "Construction",
  "Cleaning",
  "Driving",
  "Cooking",
  "Gardening",
  "Moving",
  "Security",
  "Painting",
];

export default function RegisterWorkerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useLang();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+251");
  const [faydaId, setFaydaId] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const toggleSkill = (skill: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  };

  const handleRegister = async () => {
    const validation = registerWorkerSchema.safeParse({
      name,
      phone,
      faydaId,
      skills: selectedSkills,
    });

    if (!validation.success) {
      setError(
        validation.error.issues[0]?.message ??
          "Please check the form for errors",
      );
      return;
    }

    setError("");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setDone(true);
  };

  if (done) {
    return (
      <View
        style={[
          styles.root,
          styles.doneCenter,
          { backgroundColor: colors.background },
        ]}
      >
        <View
          style={[styles.doneIcon, { backgroundColor: `${colors.success}15` }]}
        >
          <Feather name="user-check" size={48} color={colors.success} />
        </View>
        <Text style={[styles.doneTitle, { color: colors.foreground }]}>
          Worker Registered!
        </Text>
        <Text style={[styles.doneText, { color: colors.mutedForeground }]}>
          {name} has been registered. Your 2% commission will apply to their
          jobs.
        </Text>
        <Pressable
          style={[styles.homeBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Text style={styles.homeBtnText}>Register Another</Text>
        </Pressable>
        <Pressable onPress={() => router.replace("/(tabs)")}>
          <Text style={[styles.skipText, { color: colors.mutedForeground }]}>
            Back to Home
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      const [error, setError] = useState("");
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
        setError(validation.error.issues[0]?.message ?? "Please check the form
        for errors");
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        setError("");
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {t("agent.register_worker")}
        </Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView
        style={[styles.root, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={[styles.heading, { color: colors.primary, marginBottom: 12 }]}
        >
          Agent Worker Registration
        </Text>
        <View
          style={{
            backgroundColor: "#E3F2FD",
            borderRadius: 10,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <Text
            style={{ color: "#0F4C81", fontWeight: "bold", marginBottom: 4 }}
          >
            How It Works
          </Text>
          <Text style={{ color: "#0F4C81", marginBottom: 4 }}>
            • You (the agent) are registering a worker under your management.
          </Text>
          <Text style={{ color: "#0F4C81", marginBottom: 4 }}>
            • For every job this worker completes, you automatically earn a 2%
            commission.
          </Text>
          <Text style={{ color: "#0F4C81" }}>
            • The worker will be linked to your agent profile for compliance and
            payout tracking.
          </Text>
        </View>

        {/* Commission Info */}
        <View
          style={[
            styles.commissionBanner,
            {
              backgroundColor: `${colors.primary}12`,
              borderColor: `${colors.primary}30`,
            },
          ]}
        >
          <Feather name="award" size={20} color={colors.primary} />
          <View style={styles.commissionInfo}>
            <Text style={[styles.commissionTitle, { color: colors.primary }]}>
              2% Commission
            </Text>
            <Text
              style={[styles.commissionDesc, { color: colors.mutedForeground }]}
            >
              You earn 2% of every job completed by workers you register
            </Text>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Full Name
            </Text>
            <View
              style={[
                styles.inputRow,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
            >
              <Feather name="user" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={name}
                onChangeText={setName}
                placeholder="Worker full name"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Phone Number
            </Text>
            <View
              style={[
                styles.inputRow,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
            >
              <Feather name="phone" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="+251"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Fayda ID
            </Text>
            <View
              style={[
                styles.inputRow,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
            >
              <Feather
                name="credit-card"
                size={16}
                color={colors.mutedForeground}
              />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={faydaId}
                onChangeText={setFaydaId}
                placeholder="National ID number"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="characters"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Skills (select all that apply)
            </Text>
            <View style={styles.skillsGrid}>
              {SKILL_OPTIONS.map((skill) => {
                const selected = selectedSkills.includes(skill);
                return (
                  <Pressable
                    key={skill}
                    style={[
                      styles.skillBtn,
                      {
                        borderColor: selected ? colors.primary : colors.border,
                        backgroundColor: selected
                          ? `${colors.primary}12`
                          : colors.card,
                      },
                    ]}
                    onPress={() => toggleSkill(skill)}
                  >
                    {selected && (
                      <Feather name="check" size={13} color={colors.primary} />
                    )}
                    <Text
                      style={[
                        styles.skillText,
                        {
                          color: selected
                            ? colors.primary
                            : colors.mutedForeground,
                        },
                      ]}
                    >
                      {skill}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Pressable
            style={[
              styles.submitBtn,
              {
                backgroundColor: colors.primary,
                opacity:
                  name &&
                  phone &&
                  faydaId &&
                  selectedSkills.length > 0 &&
                  !loading
                    ? 1
                    : 0.5,
              },
            ]}
            onPress={handleRegister}
            disabled={
              !name ||
              !phone ||
              !faydaId ||
              selectedSkills.length === 0 ||
              loading
            }
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Feather name="user-plus" size={18} color="#fff" />
                <Text style={styles.submitBtnText}>Register Worker</Text>
              </>
            )}
          </Pressable>
          {error ? (
            <Text
              style={{
                color: colors.destructive,
                fontFamily: "Inter_500Medium",
              }}
            >
              {error}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  doneCenter: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  doneIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  doneTitle: { fontFamily: "Inter_700Bold", fontSize: 28 },
  doneText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  homeBtn: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  homeBtnText: { fontFamily: "Inter_700Bold", fontSize: 17, color: "#fff" },
  skipText: { fontFamily: "Inter_500Medium", fontSize: 15 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    flex: 1,
    textAlign: "center",
  },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  commissionBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 4,
  },
  commissionInfo: { flex: 1, gap: 3 },
  commissionTitle: { fontFamily: "Inter_700Bold", fontSize: 15 },
  commissionDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },
  form: { gap: 20 },
  field: { gap: 8 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  input: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 16 },
  skillsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  skillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  skillText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  submitBtn: {
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
  },
  submitBtnText: { fontFamily: "Inter_700Bold", fontSize: 17, color: "#fff" },
  heading: { fontFamily: "Inter_700Bold", fontSize: 24 },
});
