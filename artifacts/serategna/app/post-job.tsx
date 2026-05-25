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
import { useJobs } from "@/context/JobContext";
import type { JobCategory, JobType } from "@/lib/api";
import { useLang } from "@/context/LanguageContext";
import { jobCreateSchema } from "@workspace/api-zod";

const JOB_TYPES: {
  key: JobType;
  label: string;
  icon: string;
  color: string;
  description: string;
}[] = [
  {
    key: "gig",
    label: "Gig",
    icon: "zap",
    color: "#8B5CF6",
    description: "Single task / deliverable",
  },
  {
    key: "informal",
    label: "Informal",
    icon: "sun",
    color: "#F59E0B",
    description: "Day labour, no contract",
  },
  {
    key: "formal",
    label: "Formal",
    icon: "briefcase",
    color: "#0EA5E9",
    description: "Structured employment",
  },
  {
    key: "short_run",
    label: "Short-run",
    icon: "clock",
    color: "#10B981",
    description: "Up to one week",
  },
  {
    key: "contract",
    label: "Contract",
    icon: "file-text",
    color: "#6366F1",
    description: "Fixed-term agreement",
  },
  {
    key: "seasonal",
    label: "Seasonal",
    icon: "calendar",
    color: "#22C55E",
    description: "Harvest / events / peaks",
  },
  {
    key: "professional",
    label: "Professional",
    icon: "award",
    color: "#EC4899",
    description: "Certified skill required",
  },
  {
    key: "emergency",
    label: "Emergency",
    icon: "alert-circle",
    color: "#EF4444",
    description: "Immediate / premium rate",
  },
  {
    key: "remote",
    label: "Remote",
    icon: "wifi",
    color: "#14B8A6",
    description: "Location-independent",
  },
  {
    key: "internship",
    label: "Internship",
    icon: "book",
    color: "#F97316",
    description: "Learning placement",
  },
  {
    key: "mass_hire",
    label: "Mass Hire",
    icon: "users",
    color: "#64748B",
    description: "10+ workers at once",
  },
];

const CATEGORIES: {
  key: JobCategory;
  icon: string;
  label: string;
  color: string;
}[] = [
  { key: "plumbing", icon: "droplet", label: "Plumbing", color: "#0EA5E9" },
  { key: "electrical", icon: "zap", label: "Electrical", color: "#F59E0B" },
  { key: "cleaning", icon: "wind", label: "Cleaning", color: "#10B981" },
  {
    key: "construction",
    icon: "tool",
    label: "Construction",
    color: "#EF4444",
  },
  { key: "driving", icon: "truck", label: "Driving", color: "#8B5CF6" },
  { key: "cooking", icon: "coffee", label: "Cooking", color: "#EC4899" },
  { key: "gardening", icon: "feather", label: "Gardening", color: "#22C55E" },
  { key: "moving", icon: "package", label: "Moving", color: "#F97316" },
  { key: "security", icon: "shield", label: "Security", color: "#6366F1" },
  { key: "healthcare", icon: "heart", label: "Healthcare", color: "#EF4444" },
  { key: "education", icon: "book", label: "Education", color: "#0EA5E9" },
  { key: "it_tech", icon: "monitor", label: "IT / Tech", color: "#8B5CF6" },
  { key: "agriculture", icon: "sun", label: "Agriculture", color: "#84CC16" },
  {
    key: "finance_admin",
    icon: "dollar-sign",
    label: "Finance",
    color: "#14B8A6",
  },
  {
    key: "hospitality",
    icon: "coffee",
    label: "Hospitality",
    color: "#F97316",
  },
  { key: "logistics", icon: "box", label: "Logistics", color: "#64748B" },
  { key: "childcare", icon: "smile", label: "Childcare", color: "#EC4899" },
  { key: "delivery", icon: "map-pin", label: "Delivery", color: "#F59E0B" },
  { key: "carpentry", icon: "scissors", label: "Carpentry", color: "#92400E" },
  {
    key: "manufacturing",
    icon: "cpu",
    label: "Manufacturing",
    color: "#374151",
  },
  { key: "tailoring", icon: "scissors", label: "Tailoring", color: "#DB2777" },
  { key: "other", icon: "briefcase", label: "Other", color: "#64748B" },
];

// Market-rate AI suggestions per category
type AISuggestion = {
  title: string;
  description: string;
  minBudget: number;
  maxBudget: number;
  duration: string;
  skills: string[];
};
const AI_SUGGESTIONS: Partial<Record<JobCategory, AISuggestion>> & {
  other: AISuggestion;
} = {
  plumbing: {
    title: "Plumbing Repair & Installation",
    description:
      "Repair or replace leaking pipes, fix blocked drains, install new taps or toilet fixtures. Includes all standard plumbing work in residential or commercial premises. Worker should have TVET certification and own basic tools.",
    minBudget: 400,
    maxBudget: 1500,
    duration: "Half day – 1 day",
    skills: [
      "Pipe repair",
      "Drainage",
      "Fixture installation",
      "TVET certified",
    ],
  },
  electrical: {
    title: "Electrical Wiring & Repair",
    description:
      "Install or repair electrical wiring, sockets, switches, and circuit breakers. Troubleshoot electrical faults and ensure all work complies with Ethiopian Electrical Code. Must present valid electrician certification.",
    minBudget: 600,
    maxBudget: 3000,
    duration: "1–2 days",
    skills: [
      "Wiring",
      "Circuit breaker",
      "Safety compliance",
      "Certification required",
    ],
  },
  cleaning: {
    title: "Deep Cleaning Service",
    description:
      "Full deep-clean of residential or office space including bathrooms, kitchen, living areas, and windows. Bring own equipment and eco-friendly cleaning supplies.",
    minBudget: 250,
    maxBudget: 800,
    duration: "4–8 hours",
    skills: ["Deep cleaning", "Own equipment", "Eco-friendly supplies"],
  },
  construction: {
    title: "General Construction Work",
    description:
      "Skilled construction work including masonry, plastering, tiling, and painting. Suitable for renovation, extension, or new build projects. Must have proven experience and safety awareness.",
    minBudget: 800,
    maxBudget: 5000,
    duration: "3–14 days",
    skills: ["Masonry", "Plastering", "Tiling", "Safety awareness"],
  },
  driving: {
    title: "Driver with Own Vehicle",
    description:
      "Professional driving service for personal, business, or delivery needs. Valid Ethiopian driving license required. Vehicle must be clean and roadworthy.",
    minBudget: 300,
    maxBudget: 1200,
    duration: "Per day",
    skills: ["Valid license", "Clean vehicle", "City navigation", "Punctual"],
  },
  cooking: {
    title: "Personal / Event Chef",
    description:
      "Prepare traditional Ethiopian or international cuisine for household or event catering. Experience with injera, tibs, kitfo, and festive dishes. Includes shopping for ingredients if required.",
    minBudget: 500,
    maxBudget: 3000,
    duration: "Per event/day",
    skills: ["Ethiopian cuisine", "Catering", "Food hygiene", "Event cooking"],
  },
  gardening: {
    title: "Garden & Landscape Maintenance",
    description:
      "Mowing, pruning, weeding, planting, and general garden care. Experience with Ethiopian plant varieties and irrigation systems preferred.",
    minBudget: 200,
    maxBudget: 700,
    duration: "Half day",
    skills: ["Pruning", "Irrigation", "Planting", "Garden design"],
  },
  moving: {
    title: "Household Moving & Packing",
    description:
      "Careful packing, moving, and unpacking of household belongings. Includes furniture disassembly/reassembly. Team of 2–3 workers with a vehicle is preferred.",
    minBudget: 600,
    maxBudget: 3000,
    duration: "1–2 days",
    skills: [
      "Packing",
      "Furniture assembly",
      "Heavy lifting",
      "Vehicle required",
    ],
  },
  security: {
    title: "Security Guard Service",
    description:
      "Provide site, event, or property security. Must have prior security training, be physically fit, and present a clean police record from local kebele.",
    minBudget: 500,
    maxBudget: 1500,
    duration: "Per shift / per day",
    skills: [
      "Security training",
      "Physical fitness",
      "Police clearance",
      "Night shift capable",
    ],
  },
  other: {
    title: "General Labour Task",
    description:
      "Assistance with general tasks requiring physical labour or manual skills. Please describe the specific requirements so the right worker can be matched.",
    minBudget: 200,
    maxBudget: 1000,
    duration: "TBD",
    skills: ["Physical fitness", "Reliability", "Own tools a plus"],
  },
};

const MIN_BUDGET = 150; // Minimum wage guardrail (ETB per day)

export default function PostJobScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { createJob } = useJobs();
  const { t } = useLang();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [jobType, setJobType] = useState<JobType>("gig");
  const [category, setCategory] = useState<JobCategory>("plumbing");
  const [price, setPrice] = useState("");
  const [address, setAddress] = useState("");
  const [isRemote, setIsRemote] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiUsed, setAiUsed] = useState(false);
  const [error, setError] = useState("");
  const [urgency, setUrgency] = useState<"normal" | "urgent" | "flexible">(
    "normal",
  );
  const [workerCount, setWorkerCount] = useState("1");

  const suggestedBudget =
    (AI_SUGGESTIONS as any)[category] ?? AI_SUGGESTIONS["other"];
  const budgetNum = parseInt(price || "0");
  const isBelowMin = budgetNum > 0 && budgetNum < MIN_BUDGET;

  const handleAISuggest = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAiLoading(true);
    await new Promise((r) => setTimeout(r, 1800));
    const suggestion = AI_SUGGESTIONS[category] ?? AI_SUGGESTIONS.other;
    setTitle(suggestion.title);
    setDescription(suggestion.description);
    setPrice(
      String(Math.round((suggestion.minBudget + suggestion.maxBudget) / 2)),
    );
    setAiUsed(true);
    setAiLoading(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSubmit = async () => {
    const validation = jobCreateSchema.safeParse({
      title,
      description,
      jobType,
      category,
      price: parseInt(price || "0", 10),
      location: { lat: 9.0245, lng: 38.7468, address },
      isRemote,
      urgency,
      workerCount: parseInt(workerCount || "1", 10),
    });

    if (!validation.success) {
      setError(
        validation.error.issues[0]?.message ??
          "Please check the form for errors",
      );
      return;
    }

    if (isBelowMin) {
      setError(
        `Minimum budget is ${MIN_BUDGET} ETB (Ethiopia minimum wage guardrail)`,
      );
      return;
    }

    setLoading(true);
    setError("");
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const job = await createJob(validation.data);
      router.push({ pathname: "/job-detail", params: { id: job.id } });
    } catch {
      setError("Failed to post job");
    } finally {
      setLoading(false);
    }
  };

  const selectedCat = CATEGORIES.find((c) => c.key === category)!;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Hero Header */}
      <LinearGradient
        colors={["#0F4C81", "#1565C0"]}
        style={[
          styles.hero,
          { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="rgba(255,255,255,0.9)" />
        </Pressable>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Post a Job</Text>
          <Text style={styles.heroSub}>
            Fayda-verified workers · Escrow protected · Fair wages
          </Text>
        </View>

        {/* AI Assist Button */}
        <Pressable
          style={[styles.aiBtn, { opacity: aiLoading ? 0.7 : 1 }]}
          onPress={handleAISuggest}
          disabled={aiLoading}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
            style={styles.aiBtnGrad}
          >
            {aiLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="cpu" size={18} color="#fff" />
            )}
            <View>
              <Text style={styles.aiBtnTitle}>
                {aiLoading
                  ? "AI is writing..."
                  : aiUsed
                    ? "AI Filled ✓ Tap to Re-generate"
                    : "AI Auto-Fill"}
              </Text>
              <Text style={styles.aiBtnSub}>
                Suggest title, description & fair rate for {selectedCat.label}
              </Text>
            </View>
            {!aiLoading && (
              <Feather
                name="arrow-right"
                size={16}
                color="rgba(255,255,255,0.7)"
              />
            )}
          </LinearGradient>
        </Pressable>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Job Type */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            Job Type{" "}
            <Text style={[styles.required, { color: colors.destructive }]}>
              *
            </Text>
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.catRow}>
              {JOB_TYPES.map((jt) => (
                <Pressable
                  key={jt.key}
                  style={[
                    styles.jobTypeBtn,
                    {
                      borderColor:
                        jobType === jt.key ? jt.color : colors.border,
                      backgroundColor:
                        jobType === jt.key ? `${jt.color}15` : colors.card,
                      borderWidth: jobType === jt.key ? 2 : 1,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setJobType(jt.key);
                  }}
                >
                  <Feather
                    name={jt.icon as any}
                    size={14}
                    color={
                      jobType === jt.key ? jt.color : colors.mutedForeground
                    }
                  />
                  <View>
                    <Text
                      style={[
                        styles.catLabel,
                        {
                          color:
                            jobType === jt.key
                              ? jt.color
                              : colors.mutedForeground,
                        },
                      ]}
                    >
                      {jt.label}
                    </Text>
                    <Text
                      style={[
                        styles.jobTypeDesc,
                        {
                          color:
                            jobType === jt.key
                              ? `${jt.color}CC`
                              : `${colors.mutedForeground}80`,
                        },
                      ]}
                    >
                      {jt.description}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Category */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            {t("job.category")}{" "}
            <Text style={[styles.required, { color: colors.destructive }]}>
              *
            </Text>
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.catRow}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.key}
                  style={[
                    styles.catBtn,
                    {
                      borderColor:
                        category === cat.key ? cat.color : colors.border,
                      backgroundColor:
                        category === cat.key ? `${cat.color}12` : colors.card,
                      borderWidth: category === cat.key ? 2 : 1,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCategory(cat.key);
                    setAiUsed(false);
                  }}
                >
                  <Feather
                    name={cat.icon as any}
                    size={16}
                    color={
                      category === cat.key ? cat.color : colors.mutedForeground
                    }
                  />
                  <Text
                    style={[
                      styles.catLabel,
                      {
                        color:
                          category === cat.key
                            ? cat.color
                            : colors.mutedForeground,
                      },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Market rate hint */}
        <View
          style={[
            styles.marketHint,
            {
              backgroundColor: `${colors.primary}08`,
              borderColor: `${colors.primary}25`,
            },
          ]}
        >
          <Feather name="bar-chart-2" size={14} color={colors.primary} />
          <Text style={[styles.marketHintText, { color: colors.primary }]}>
            Market rate for {selectedCat.label}:{" "}
            {suggestedBudget.minBudget.toLocaleString()}–
            {suggestedBudget.maxBudget.toLocaleString()} ETB · Duration:{" "}
            {suggestedBudget.duration}
          </Text>
        </View>

        {/* Title */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            {t("job.title")}{" "}
            <Text style={[styles.required, { color: colors.destructive }]}>
              *
            </Text>
          </Text>
          <View
            style={[
              styles.inputRow,
              {
                borderColor: title ? colors.primary : colors.border,
                backgroundColor: colors.card,
              },
            ]}
          >
            <Feather name="edit-2" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Fix kitchen sink leak"
              placeholderTextColor={colors.mutedForeground}
            />
            {aiUsed && title && (
              <Feather name="cpu" size={14} color={colors.primary} />
            )}
          </View>
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            {t("job.description")}{" "}
            <Text style={[styles.required, { color: colors.destructive }]}>
              *
            </Text>
          </Text>
          <View
            style={[
              styles.textAreaContainer,
              {
                borderColor: description ? colors.primary : colors.border,
                backgroundColor: colors.card,
              },
            ]}
          >
            <TextInput
              style={[styles.textArea, { color: colors.foreground }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the job in detail — scope, materials, required skills..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>
          {aiUsed && description && (
            <View style={styles.aiTag}>
              <Feather name="cpu" size={11} color={colors.primary} />
              <Text style={[styles.aiTagText, { color: colors.primary }]}>
                AI-generated — edit as needed
              </Text>
            </View>
          )}
        </View>

        {/* Required Skills (AI populated) */}
        {aiUsed && (
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Suggested Required Skills
            </Text>
            <View style={styles.skillChips}>
              {(AI_SUGGESTIONS[category] ?? AI_SUGGESTIONS.other).skills.map(
                (s) => (
                  <View
                    key={s}
                    style={[
                      styles.skillChip,
                      {
                        backgroundColor: `${colors.primary}12`,
                        borderColor: `${colors.primary}30`,
                      },
                    ]}
                  >
                    <Feather name="check" size={12} color={colors.primary} />
                    <Text
                      style={[styles.skillChipText, { color: colors.primary }]}
                    >
                      {s}
                    </Text>
                  </View>
                ),
              )}
            </View>
          </View>
        )}

        {/* Budget + Urgency Row */}
        <View style={styles.twoCol}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              {t("job.budget")} (ETB){" "}
              <Text style={[styles.required, { color: colors.destructive }]}>
                *
              </Text>
            </Text>
            <View
              style={[
                styles.inputRow,
                {
                  borderColor: isBelowMin
                    ? colors.destructive
                    : price
                      ? colors.primary
                      : colors.border,
                  backgroundColor: colors.card,
                },
              ]}
            >
              <Text style={[styles.currency, { color: colors.primary }]}>
                ETB
              </Text>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={price}
                onChangeText={(v) => setPrice(v.replace(/[^0-9]/g, ""))}
                placeholder="500"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="number-pad"
              />
            </View>
            {isBelowMin && (
              <Text style={[styles.fieldError, { color: colors.destructive }]}>
                Min: {MIN_BUDGET} ETB (wage guardrail)
              </Text>
            )}
          </View>

          <View style={[styles.field, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Workers Needed
            </Text>
            <View
              style={[
                styles.inputRow,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
            >
              <Feather name="users" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={workerCount}
                onChangeText={(v) => setWorkerCount(v.replace(/[^0-9]/g, ""))}
                placeholder="1"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </View>

        {/* Urgency */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            Urgency
          </Text>
          <View style={styles.urgencyRow}>
            {(["flexible", "normal", "urgent"] as const).map((u) => (
              <Pressable
                key={u}
                style={[
                  styles.urgencyBtn,
                  {
                    backgroundColor:
                      urgency === u
                        ? (u === "urgent"
                            ? "#EF4444"
                            : u === "normal"
                              ? colors.primary
                              : colors.success) + "15"
                        : colors.card,
                    borderColor:
                      urgency === u
                        ? u === "urgent"
                          ? "#EF4444"
                          : u === "normal"
                            ? colors.primary
                            : colors.success
                        : colors.border,
                    borderWidth: urgency === u ? 2 : 1,
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setUrgency(u);
                }}
              >
                <Feather
                  name={
                    u === "urgent"
                      ? "zap"
                      : u === "normal"
                        ? "clock"
                        : "calendar"
                  }
                  size={15}
                  color={
                    urgency === u
                      ? u === "urgent"
                        ? "#EF4444"
                        : u === "normal"
                          ? colors.primary
                          : colors.success
                      : colors.mutedForeground
                  }
                />
                <Text
                  style={[
                    styles.urgencyLabel,
                    {
                      color:
                        urgency === u
                          ? u === "urgent"
                            ? "#EF4444"
                            : u === "normal"
                              ? colors.primary
                              : colors.success
                          : colors.mutedForeground,
                    },
                  ]}
                >
                  {u.charAt(0).toUpperCase() + u.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Location */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            {t("job.location")}{" "}
            <Text style={[styles.required, { color: colors.destructive }]}>
              *
            </Text>
          </Text>
          <View
            style={[
              styles.inputRow,
              {
                borderColor: address ? colors.primary : colors.border,
                backgroundColor: colors.card,
              },
            ]}
          >
            <Feather name="map-pin" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter address or neighbourhood"
              placeholderTextColor={colors.mutedForeground}
            />
          </View>
        </View>

        {/* Remote toggle */}
        <Pressable
          style={[
            styles.remoteToggle,
            {
              borderColor: isRemote ? "#14B8A6" : colors.border,
              backgroundColor: isRemote ? "#14B8A615" : colors.card,
            },
          ]}
          onPress={() => {
            Haptics.selectionAsync();
            setIsRemote(!isRemote);
          }}
        >
          <Feather
            name="wifi"
            size={16}
            color={isRemote ? "#14B8A6" : colors.mutedForeground}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.remoteLabel,
                { color: isRemote ? "#14B8A6" : colors.foreground },
              ]}
            >
              Remote / Virtual Job
            </Text>
            <Text style={[styles.remoteSub, { color: colors.mutedForeground }]}>
              Worker can deliver from any location
            </Text>
          </View>
          <View
            style={[
              styles.checkbox,
              {
                borderColor: isRemote ? "#14B8A6" : colors.border,
                backgroundColor: isRemote ? "#14B8A6" : "transparent",
              },
            ]}
          >
            {isRemote && <Feather name="check" size={12} color="#fff" />}
          </View>
        </Pressable>

        {/* Age guardrail notice */}
        <View
          style={[
            styles.guardrailCard,
            {
              backgroundColor: `${colors.info}08`,
              borderColor: `${colors.info}25`,
            },
          ]}
        >
          <Feather name="shield" size={14} color={colors.info} />
          <Text style={[styles.guardrailText, { color: colors.info }]}>
            Only workers aged 18–65 with valid Fayda ID will be matched to this
            job. Child labour is strictly prohibited on Serategna.
          </Text>
        </View>

        {/* Payment Breakdown */}
        {price && parseInt(price) >= MIN_BUDGET ? (
          <View
            style={[
              styles.preview,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.previewTitle, { color: colors.foreground }]}>
              Escrow Breakdown
            </Text>
            {[
              {
                label: "Worker receives (87%)",
                amount: Math.round(parseInt(price) * 0.87),
                color: colors.success,
              },
              {
                label: "Platform fee (8%)",
                amount: Math.round(parseInt(price) * 0.08),
                color: colors.mutedForeground,
              },
              {
                label: "Agent commission (2%)",
                amount: Math.round(parseInt(price) * 0.02),
                color: colors.mutedForeground,
              },
              {
                label: "Tax / withholding (3%)",
                amount: Math.round(parseInt(price) * 0.03),
                color: colors.mutedForeground,
              },
            ].map((item) => (
              <View
                key={item.label}
                style={[styles.previewRow, { borderColor: colors.border }]}
              >
                <Text style={[styles.previewLabel, { color: item.color }]}>
                  {item.label}
                </Text>
                <Text style={[styles.previewAmount, { color: item.color }]}>
                  {item.amount.toLocaleString()} ETB
                </Text>
              </View>
            ))}
            <View style={[styles.totalRow, { borderColor: colors.border }]}>
              <Text style={[styles.totalLabel, { color: colors.foreground }]}>
                Total You Pay
              </Text>
              <Text style={[styles.totalAmount, { color: colors.primary }]}>
                {parseInt(price).toLocaleString()} ETB
              </Text>
            </View>
            <Pressable
              style={[styles.disputeLink, { borderColor: colors.border }]}
              onPress={() => router.push("/escrow-dispute")}
            >
              <Feather
                name="alert-circle"
                size={13}
                color={colors.mutedForeground}
              />
              <Text
                style={[
                  styles.disputeLinkText,
                  { color: colors.mutedForeground },
                ]}
              >
                Understand escrow disputes
              </Text>
              <Feather
                name="chevron-right"
                size={13}
                color={colors.mutedForeground}
              />
            </Pressable>
          </View>
        ) : null}

        {error ? (
          <Text style={[styles.error, { color: colors.destructive }]}>
            {error}
          </Text>
        ) : null}

        <Pressable
          style={[
            styles.submitBtn,
            {
              backgroundColor: loading ? `${colors.primary}70` : colors.primary,
            },
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Feather name="check" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>Post Job & Fund Escrow</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: { paddingHorizontal: 20, paddingBottom: 20, gap: 12 },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  heroContent: { gap: 4 },
  heroTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: "#fff",
    letterSpacing: -0.4,
  },
  heroSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  aiBtn: {},
  aiBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
  },
  aiBtnTitle: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#fff" },
  aiBtnSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
  },
  content: { padding: 20, gap: 18 },
  field: { gap: 8 },
  twoCol: { flexDirection: "row", gap: 12 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  required: {},
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
  currency: { fontFamily: "Inter_700Bold", fontSize: 15 },
  textAreaContainer: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    minHeight: 110,
  },
  textArea: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21 },
  aiTag: { flexDirection: "row", alignItems: "center", gap: 5 },
  aiTagText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  catRow: { flexDirection: "row", gap: 8, paddingBottom: 4 },
  catBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 10,
  },
  catLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  jobTypeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 120,
  },
  jobTypeDesc: { fontFamily: "Inter_400Regular", fontSize: 10, marginTop: 1 },
  remoteToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  remoteLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  remoteSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  marketHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  marketHintText: { fontFamily: "Inter_500Medium", fontSize: 12, flex: 1 },
  skillChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  skillChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  skillChipText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  urgencyRow: { flexDirection: "row", gap: 10 },
  urgencyBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
  },
  urgencyLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  fieldError: { fontFamily: "Inter_500Medium", fontSize: 12, marginTop: -4 },
  fieldWarn: { fontFamily: "Inter_500Medium", fontSize: 12, marginTop: -4 },
  guardrailCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  guardrailText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  preview: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 },
  previewTitle: { fontFamily: "Inter_700Bold", fontSize: 15, marginBottom: 4 },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  previewLabel: { fontFamily: "Inter_400Regular", fontSize: 13 },
  previewAmount: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 6,
    borderTopWidth: 1.5,
  },
  totalLabel: { fontFamily: "Inter_700Bold", fontSize: 15 },
  totalAmount: { fontFamily: "Inter_700Bold", fontSize: 17 },
  disputeLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  disputeLinkText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 12 },
  error: { fontFamily: "Inter_500Medium", fontSize: 14, textAlign: "center" },
  submitBtn: {
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitBtnText: { fontFamily: "Inter_700Bold", fontSize: 17, color: "#fff" },
});
