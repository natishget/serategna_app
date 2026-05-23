import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useLang } from "@/context/LanguageContext";

interface Props {
  amount: number;
  status: "pending" | "locked" | "released" | "disputed" | "refunded";
  onFund?: (method: "telebirr" | "cbe") => Promise<void>;
  onRelease?: () => Promise<void>;
}

export function EscrowCard({ amount, status, onFund, onRelease }: Props) {
  const colors = useColors();
  const { t } = useLang();
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<"telebirr" | "cbe">("telebirr");

  const workerShare = Math.round(amount * 0.87);
  const platformShare = Math.round(amount * 0.08);
  const agentShare = Math.round(amount * 0.02);
  const taxShare = Math.round(amount * 0.03);

  const handleFund = async () => {
    if (!onFund) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    await onFund(selectedMethod);
    setLoading(false);
  };

  const handleRelease = async () => {
    if (!onRelease) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(true);
    await onRelease();
    setLoading(false);
  };

  const statusConfig = {
    pending: { icon: "lock", color: colors.warning, label: "Pending" },
    locked: { icon: "shield", color: colors.success, label: t("escrow.funded") },
    released: { icon: "check-circle", color: colors.statusCompleted, label: "Released" },
    disputed: { icon: "alert-triangle", color: colors.destructive, label: "Disputed" },
    refunded: { icon: "refresh-ccw", color: colors.mutedForeground, label: "Refunded" },
  };

  const s = statusConfig[status];

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.iconBg, { backgroundColor: `${s.color}20` }]}>
          <Feather name={s.icon as any} size={20} color={s.color} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.foreground }]}>Escrow</Text>
          <Text style={[styles.statusLabel, { color: s.color }]}>{s.label}</Text>
        </View>
        <View style={[styles.amountBg, { backgroundColor: `${colors.primary}15` }]}>
          <Text style={[styles.amount, { color: colors.primary }]}>
            {amount.toLocaleString()} ETB
          </Text>
        </View>
      </View>

      <View style={[styles.breakdown, { backgroundColor: colors.muted, borderRadius: 12 }]}>
        <Text style={[styles.breakdownTitle, { color: colors.mutedForeground }]}>Payment Partition</Text>
        <Text style={[styles.breakdownLabel, { color: colors.mutedForeground, marginBottom: 4 }]}>
          Every payment is split automatically for compliance and transparency:
        </Text>
        {[
          { label: "Worker (87%)", amount: workerShare, color: colors.success, desc: "Directly to your wallet" },
          { label: "Platform Fee (8%)", amount: platformShare, color: colors.primary, desc: "For platform services & SOS Shield" },
          { label: "Agent Commission (2%)", amount: agentShare, color: colors.accent, desc: "For agent management" },
          { label: "Tax (3%)", amount: taxShare, color: colors.mutedForeground, desc: "For Ministry of Revenues" },
        ].map((item) => (
          <View key={item.label} style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: item.color }]}>{item.label}</Text>
            <Text style={[styles.breakdownAmount, { color: item.color }]}>{item.amount.toLocaleString()} ETB</Text>
            <Text style={[styles.breakdownDesc, { color: colors.mutedForeground, fontSize: 11 }]}>{item.desc}</Text>
          </View>
        ))}
      </View>

      <View style={{ marginTop: 8, marginBottom: 4 }}>
        <Text style={[styles.breakdownTitle, { color: colors.info }]}>Payout Trigger</Text>
        <Text style={[styles.breakdownLabel, { color: colors.mutedForeground }]}>
          Funds are released instantly when the job is marked complete and rated by the employer.
        </Text>
      </View>

      {status === "pending" && onFund && (
        <View style={styles.actions}>
          <View style={styles.methodRow}>
            {(["telebirr", "cbe"] as const).map((method) => (
              <Pressable
                key={method}
                style={[
                  styles.methodBtn,
                  {
                    borderColor: selectedMethod === method ? colors.primary : colors.border,
                    backgroundColor: selectedMethod === method ? `${colors.primary}12` : colors.card,
                  },
                ]}
                onPress={() => setSelectedMethod(method)}
              >
                <Text style={[styles.methodText, { color: selectedMethod === method ? colors.primary : colors.mutedForeground }]}>
                  {method === "telebirr" ? t("escrow.telebirr") : t("escrow.cbe")}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            style={[styles.fundBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={handleFund}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Feather name="lock" size={16} color="#fff" />
                <Text style={styles.fundBtnText}>{t("escrow.fund")} {amount.toLocaleString()} ETB</Text>
              </>
            )}
          </Pressable>
        </View>
      )}

      {status === "locked" && onRelease && (
        <Pressable
          style={[styles.fundBtn, { backgroundColor: colors.success, opacity: loading ? 0.7 : 1 }]}
          onPress={handleRelease}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Feather name="unlock" size={16} color="#fff" />
              <Text style={styles.fundBtnText}>{t("escrow.release")}</Text>
            </>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  statusLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  amountBg: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  amount: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  breakdown: {
    padding: 14,
    gap: 8,
  },
  breakdownTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakdownLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  breakdownAmount: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  breakdownDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  actions: {
    gap: 12,
  },
  methodRow: {
    flexDirection: "row",
    gap: 10,
  },
  methodBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  methodText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  fundBtn: {
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  fundBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#fff",
  },
});
