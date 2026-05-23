import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
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
import { useAuth } from "@/context/AuthContext";

type DisputeType =
  | "work_not_done"
  | "work_poor_quality"
  | "payment_not_received"
  | "worker_no_show"
  | "scope_creep"
  | "safety_incident"
  | "other";

type DisputeStep = "type" | "details" | "evidence" | "submitted";

const DISPUTE_TYPES: { id: DisputeType; icon: string; label: string; desc: string; color: string }[] = [
  { id: "work_not_done", icon: "x-circle", label: "Work Not Completed", desc: "Worker did not finish the agreed job", color: "#EF4444" },
  { id: "work_poor_quality", icon: "alert-triangle", label: "Poor Quality Work", desc: "Work was done but below acceptable standard", color: "#F59E0B" },
  { id: "payment_not_received", icon: "credit-card", label: "Payment Not Released", desc: "Job completed but payment still in escrow", color: "#0EA5E9" },
  { id: "worker_no_show", icon: "user-x", label: "Worker No-Show", desc: "Worker accepted job but did not appear", color: "#EF4444" },
  { id: "scope_creep", icon: "expand", label: "Scope Dispute", desc: "Disagreement on what was agreed vs. done", color: "#8B5CF6" },
  { id: "safety_incident", icon: "alert-octagon", label: "Safety Incident", desc: "Injury, damage, or unsafe conduct occurred", color: "#DC2626" },
  { id: "other", icon: "help-circle", label: "Other Issue", desc: "Something not covered above", color: "#6B7280" },
];

const TIMELINE_STEPS = [
  { label: "Dispute Submitted", desc: "Both parties notified", icon: "file-text", time: "Now" },
  { label: "Evidence Collection", desc: "48 hours for both parties to submit evidence", icon: "camera", time: "Day 1–2" },
  { label: "Arbitration Review", desc: "Serategna arbitration panel reviews case", icon: "users", time: "Day 3–5" },
  { label: "Decision Issued", desc: "Binding resolution with escrow instruction", icon: "check-circle", time: "Day 5–7" },
];

export default function EscrowDisputeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ jobId?: string; jobTitle?: string }>();

  const [step, setStep] = useState<DisputeStep>("type");
  const [disputeType, setDisputeType] = useState<DisputeType | null>(null);
  const [description, setDescription] = useState("");
  const [evidenceNotes, setEvidenceNotes] = useState("");
  const [preferredResolution, setPreferredResolution] = useState<"refund" | "partial" | "release" | "redo">("refund");
  const [submitting, setSubmitting] = useState(false);
  const [referenceId] = useState(`DSP-${Date.now().toString().slice(-6)}`);

  const selectedType = DISPUTE_TYPES.find((d) => d.id === disputeType);

  const handleSubmit = async () => {
    if (!description.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 2000));
    setSubmitting(false);
    setStep("submitted");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  const resolutionOptions: { id: "refund" | "partial" | "release" | "redo"; label: string; icon: string }[] = [
    { id: "refund", label: "Full Refund to Employer", icon: "rotate-ccw" },
    { id: "partial", label: "Partial Payment (Negotiated)", icon: "sliders" },
    { id: "release", label: "Release Full Payment to Worker", icon: "arrow-right-circle" },
    { id: "redo", label: "Job to be Redone", icon: "refresh-cw" },
  ];

  if (!user) return null;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient
          colors={step === "submitted" ? ["#065F46", "#10B981"] : ["#7C0A0A", "#DC2626"]}
          style={[styles.hero, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}
        >
          <Pressable onPress={() => step === "type" ? router.back() : setStep(step === "details" ? "type" : "details")} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color="rgba(255,255,255,0.9)" />
          </Pressable>
          <View style={styles.heroContent}>
            <View style={styles.heroIcon}>
              <Feather name={step === "submitted" ? "check-circle" : "alert-circle"} size={28} color="#fff" />
            </View>
            <Text style={styles.heroTitle}>
              {step === "submitted" ? "Dispute Submitted" : "Raise Escrow Dispute"}
            </Text>
            <Text style={styles.heroSub}>
              {step === "submitted"
                ? `Reference: ${referenceId} · Resolved within 7 days`
                : params.jobTitle
                ? `Job: ${params.jobTitle}`
                : "Escrow protection — funds held safely"}
            </Text>
          </View>
          {step !== "submitted" && (
            <View style={styles.stepsRow}>
              {(["type", "details", "evidence"] as const).map((s, i) => (
                <View key={s} style={styles.stepItem}>
                  <View style={[styles.stepDot, {
                    backgroundColor: step === s ? "#fff" : s === "type" && step !== "type" ? "rgba(255,255,255,0.6)" :
                      s === "details" && step === "evidence" ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.25)",
                  }]}>
                    <Text style={[styles.stepNum, { color: step === s ? "#DC2626" : "#fff" }]}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.stepLabel, { color: step === s ? "#fff" : "rgba(255,255,255,0.6)" }]}>
                    {s === "type" ? "Issue" : s === "details" ? "Details" : "Evidence"}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </LinearGradient>

        <View style={styles.body}>
          {/* Step 1: Issue Type */}
          {step === "type" && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>What is the issue?</Text>
              <View style={styles.typeList}>
                {DISPUTE_TYPES.map((dt) => (
                  <Pressable
                    key={dt.id}
                    style={[styles.typeCard, {
                      backgroundColor: disputeType === dt.id ? `${dt.color}12` : colors.card,
                      borderColor: disputeType === dt.id ? dt.color : colors.border,
                      borderWidth: disputeType === dt.id ? 2 : 1,
                    }]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setDisputeType(dt.id); }}
                  >
                    <View style={[styles.typeIcon, { backgroundColor: `${dt.color}15` }]}>
                      <Feather name={dt.icon as any} size={20} color={dt.color} />
                    </View>
                    <View style={styles.typeText}>
                      <Text style={[styles.typeLabel, { color: colors.foreground }]}>{dt.label}</Text>
                      <Text style={[styles.typeDesc, { color: colors.mutedForeground }]}>{dt.desc}</Text>
                    </View>
                    {disputeType === dt.id && <Feather name="check-circle" size={18} color={dt.color} />}
                  </Pressable>
                ))}
              </View>
              <Pressable
                style={[styles.nextBtn, { backgroundColor: disputeType ? colors.primary : colors.border }]}
                onPress={() => disputeType && setStep("details")}
                disabled={!disputeType}
              >
                <Text style={styles.nextBtnText}>Continue</Text>
                <Feather name="arrow-right" size={18} color="#fff" />
              </Pressable>
            </View>
          )}

          {/* Step 2: Details */}
          {step === "details" && selectedType && (
            <View style={styles.section}>
              <View style={[styles.selectedTypeBanner, { backgroundColor: `${selectedType.color}10`, borderColor: `${selectedType.color}30` }]}>
                <Feather name={selectedType.icon as any} size={16} color={selectedType.color} />
                <Text style={[styles.selectedTypeText, { color: selectedType.color }]}>{selectedType.label}</Text>
              </View>

              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Describe the issue</Text>
              <View style={[styles.textAreaWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <TextInput
                  style={[styles.textArea, { color: colors.foreground }]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe what happened in detail — dates, times, what was agreed vs what occurred..."
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />
              </View>

              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Preferred resolution</Text>
              <View style={styles.resolutionList}>
                {resolutionOptions.map((r) => (
                  <Pressable
                    key={r.id}
                    style={[styles.resolutionRow, {
                      backgroundColor: preferredResolution === r.id ? `${colors.primary}10` : colors.card,
                      borderColor: preferredResolution === r.id ? colors.primary : colors.border,
                    }]}
                    onPress={() => { Haptics.selectionAsync(); setPreferredResolution(r.id); }}
                  >
                    <View style={[styles.resolutionIcon, { backgroundColor: preferredResolution === r.id ? `${colors.primary}20` : `${colors.border}50` }]}>
                      <Feather name={r.icon as any} size={16} color={preferredResolution === r.id ? colors.primary : colors.mutedForeground} />
                    </View>
                    <Text style={[styles.resolutionLabel, { color: colors.foreground }]}>{r.label}</Text>
                    {preferredResolution === r.id && <Feather name="check-circle" size={16} color={colors.primary} />}
                  </Pressable>
                ))}
              </View>

              <Pressable
                style={[styles.nextBtn, { backgroundColor: description.trim() ? colors.primary : colors.border }]}
                onPress={() => description.trim() && setStep("evidence")}
                disabled={!description.trim()}
              >
                <Text style={styles.nextBtnText}>Add Evidence</Text>
                <Feather name="arrow-right" size={18} color="#fff" />
              </Pressable>
            </View>
          )}

          {/* Step 3: Evidence */}
          {step === "evidence" && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Supporting Evidence</Text>
              <Text style={[styles.sectionDesc, { color: colors.mutedForeground }]}>
                Attach any photos, videos, or messages that support your case. Evidence is reviewed by our arbitration panel.
              </Text>

              <View style={styles.evidenceGrid}>
                {[
                  { icon: "camera", label: "Photos", desc: "Before/after, damage" },
                  { icon: "video", label: "Video", desc: "Work in progress, result" },
                  { icon: "message-square", label: "Chat Logs", desc: "Auto-attached from chat" },
                  { icon: "file-text", label: "Receipts", desc: "Materials, quotes" },
                ].map((ev) => (
                  <Pressable
                    key={ev.label}
                    style={[styles.evidenceCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                  >
                    <View style={[styles.evidenceIcon, { backgroundColor: `${colors.primary}12` }]}>
                      <Feather name={ev.icon as any} size={20} color={colors.primary} />
                    </View>
                    <Text style={[styles.evidenceLabel, { color: colors.foreground }]}>{ev.label}</Text>
                    <Text style={[styles.evidenceDesc, { color: colors.mutedForeground }]}>{ev.desc}</Text>
                    <View style={[styles.addTag, { borderColor: colors.primary }]}>
                      <Feather name="plus" size={12} color={colors.primary} />
                      <Text style={[styles.addTagText, { color: colors.primary }]}>Add</Text>
                    </View>
                  </Pressable>
                ))}
              </View>

              <View style={[styles.noteBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.noteLabel, { color: colors.mutedForeground }]}>Additional notes (optional)</Text>
                <TextInput
                  style={[styles.noteInput, { color: colors.foreground }]}
                  value={evidenceNotes}
                  onChangeText={setEvidenceNotes}
                  placeholder="Any additional context for the arbitration panel..."
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Note: Chat logs auto-attached */}
              <View style={[styles.autoAttach, { backgroundColor: `${colors.success}10`, borderColor: `${colors.success}30` }]}>
                <Feather name="check-circle" size={14} color={colors.success} />
                <Text style={[styles.autoAttachText, { color: colors.success }]}>
                  In-app chat messages automatically attached to this dispute
                </Text>
              </View>

              <Pressable
                style={[styles.submitDisputeBtn, { backgroundColor: "#DC2626", opacity: submitting ? 0.7 : 1 }]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Feather name="alert-circle" size={18} color="#fff" />
                    <Text style={styles.submitDisputeBtnText}>Submit Dispute</Text>
                  </>
                )}
              </Pressable>
            </View>
          )}

          {/* Submitted */}
          {step === "submitted" && (
            <View style={styles.section}>
              <View style={[styles.refCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.refLabel, { color: colors.mutedForeground }]}>Dispute Reference</Text>
                <Text style={[styles.refNum, { color: colors.foreground }]}>{referenceId}</Text>
                <Text style={[styles.refSub, { color: colors.mutedForeground }]}>Save this number for follow-up</Text>
              </View>

              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>What happens next</Text>
              <View style={styles.timeline}>
                {TIMELINE_STEPS.map((ts, i) => (
                  <View key={ts.label} style={styles.timelineRow}>
                    <View style={styles.timelineLeft}>
                      <View style={[styles.timelineDot, { backgroundColor: i === 0 ? colors.primary : colors.border }]}>
                        <Feather name={ts.icon as any} size={14} color={i === 0 ? "#fff" : colors.mutedForeground} />
                      </View>
                      {i < TIMELINE_STEPS.length - 1 && <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />}
                    </View>
                    <View style={styles.timelineContent}>
                      <View style={styles.timelineHeader}>
                        <Text style={[styles.timelineLabel, { color: colors.foreground }]}>{ts.label}</Text>
                        <Text style={[styles.timelineTime, { color: colors.primary }]}>{ts.time}</Text>
                      </View>
                      <Text style={[styles.timelineDesc, { color: colors.mutedForeground }]}>{ts.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={[styles.escrowNote, { backgroundColor: `${colors.warning}10`, borderColor: `${colors.warning}30` }]}>
                <Feather name="lock" size={16} color={colors.warning} />
                <Text style={[styles.escrowNoteText, { color: colors.warning }]}>
                  Escrow funds are frozen during this dispute and will only be released per the arbitration decision
                </Text>
              </View>

              <View style={{ marginVertical: 16, backgroundColor: '#F3F4F6', borderRadius: 10, padding: 12 }}>
                <Text style={{ color: '#7C0A0A', fontWeight: 'bold', marginBottom: 4 }}>Dispute Resolution Timeline</Text>
                <Text style={{ color: '#374151', marginBottom: 4 }}>1. Dispute Submitted: Both parties notified immediately.</Text>
                <Text style={{ color: '#374151', marginBottom: 4 }}>2. Evidence Collection: 48 hours for both parties to submit evidence (photos, messages, etc.).</Text>
                <Text style={{ color: '#374151', marginBottom: 4 }}>3. Arbitration Review: Serategna panel reviews all evidence (Day 3–5).</Text>
                <Text style={{ color: '#374151', marginBottom: 4 }}>4. Decision Issued: Binding resolution and escrow instruction (Day 5–7).</Text>
                <Text style={{ color: '#065F46', marginTop: 8, fontStyle: 'italic' }}>Upload clear photos, chat screenshots, or documents to support your case.</Text>
              </View>

              <Pressable
                style={[styles.doneBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.replace("/(tabs)")}
              >
                <Feather name="home" size={18} color="#fff" />
                <Text style={styles.doneBtnText}>Back to Home</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: { paddingHorizontal: 20, paddingBottom: 24, gap: 14 },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  heroContent: { gap: 6 },
  heroIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  heroTitle: { fontFamily: "Inter_700Bold", fontSize: 24, color: "#fff", letterSpacing: -0.4 },
  heroSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: "rgba(255,255,255,0.7)" },
  stepsRow: { flexDirection: "row", gap: 24, paddingTop: 4 },
  stepItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepDot: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  stepNum: { fontFamily: "Inter_700Bold", fontSize: 12 },
  stepLabel: { fontFamily: "Inter_500Medium", fontSize: 12 },
  body: { padding: 20 },
  section: { gap: 16 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  sectionDesc: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, marginTop: -10 },
  typeList: { gap: 10 },
  typeCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14 },
  typeIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  typeText: { flex: 1, gap: 2 },
  typeLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  typeDesc: { fontFamily: "Inter_400Regular", fontSize: 12 },
  selectedTypeBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
  selectedTypeText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  textAreaWrap: { borderWidth: 1.5, borderRadius: 14, padding: 14, minHeight: 120 },
  textArea: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21 },
  resolutionList: { gap: 8 },
  resolutionRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1.5 },
  resolutionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  resolutionLabel: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 14 },
  evidenceGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  evidenceCard: { width: "47%", borderWidth: 1, borderRadius: 16, padding: 14, gap: 8 },
  evidenceIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  evidenceLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  evidenceDesc: { fontFamily: "Inter_400Regular", fontSize: 12 },
  addTag: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, alignSelf: "flex-start" },
  addTagText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  noteBubble: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 },
  noteLabel: { fontFamily: "Inter_500Medium", fontSize: 13 },
  noteInput: { fontFamily: "Inter_400Regular", fontSize: 14 },
  autoAttach: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
  autoAttachText: { fontFamily: "Inter_500Medium", fontSize: 13, flex: 1 },
  submitDisputeBtn: { height: 54, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  submitDisputeBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
  refCard: { borderWidth: 1, borderRadius: 16, padding: 20, alignItems: "center", gap: 6 },
  refLabel: { fontFamily: "Inter_400Regular", fontSize: 13 },
  refNum: { fontFamily: "Inter_700Bold", fontSize: 28, letterSpacing: -0.5 },
  refSub: { fontFamily: "Inter_400Regular", fontSize: 12 },
  timeline: { gap: 0 },
  timelineRow: { flexDirection: "row", gap: 14 },
  timelineLeft: { alignItems: "center", width: 40 },
  timelineDot: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  timelineLine: { width: 2, flex: 1, minHeight: 24, marginVertical: 4 },
  timelineContent: { flex: 1, paddingTop: 8, paddingBottom: 20, gap: 4 },
  timelineHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  timelineLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  timelineTime: { fontFamily: "Inter_500Medium", fontSize: 12 },
  timelineDesc: { fontFamily: "Inter_400Regular", fontSize: 13 },
  escrowNote: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 14, borderWidth: 1 },
  escrowNoteText: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 13, lineHeight: 19 },
  nextBtn: { height: 54, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  nextBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
  doneBtn: { height: 54, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  doneBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
});
