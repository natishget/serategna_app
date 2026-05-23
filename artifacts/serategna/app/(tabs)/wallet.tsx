import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LanguageContext";

const MOCK_TRANSACTIONS = [
  { id: "t1", type: "credit", label: "Job payment received", amount: 870, date: "Today", jobTitle: "Plumbing repair" },
  { id: "t2", type: "debit", label: "Escrow funded", amount: 600, date: "Yesterday", jobTitle: "Cleaning service" },
  { id: "t3", type: "credit", label: "Job payment received", amount: 1300, date: "Mar 18", jobTitle: "Electrical wiring" },
  { id: "t4", type: "debit", label: "Withdrawal", amount: 2000, date: "Mar 15", jobTitle: "" },
  { id: "t5", type: "credit", label: "Bonus", amount: 150, date: "Mar 10", jobTitle: "Loyalty bonus" },
];

export default function WalletScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useLang();

  if (!user) return null;

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
      <Text style={[styles.title, { color: colors.foreground }]}>{t("nav.wallet")}</Text>

      {/* Balance Card */}
      <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
        <Text style={styles.balanceLabel}>{t("wallet.balance")}</Text>
        <Text style={styles.balanceAmount}>{user.walletBalance.toLocaleString()}</Text>
        <Text style={styles.balanceCurrency}>ETB</Text>

        <View style={styles.balanceActions}>
          <Pressable style={styles.balanceBtn}>
            <Feather name="arrow-down-circle" size={20} color="#fff" />
            <Text style={styles.balanceBtnText}>{t("wallet.withdraw")}</Text>
          </Pressable>
          <View style={styles.balanceDivider} />
          <Pressable style={styles.balanceBtn}>
            <Feather name="plus-circle" size={20} color="#fff" />
            <Text style={styles.balanceBtnText}>{t("wallet.add_funds")}</Text>
          </Pressable>
        </View>
      </View>

      {/* Financial Access Hub Banner */}
      <Pressable
        style={[styles.financeHubCard, { backgroundColor: user.trustScore >= 600 ? '#0F4C81' : '#888' }]}
        onPress={() => {
          if (user.trustScore >= 600) {
            router.push('/finance-hub');
          } else {
            alert('Reach a Trust Score of 600 to unlock loans and insurance products.');
          }
        }}
      >
        <View style={styles.financeHubLeft}>
          <View style={styles.financeHubIcon}>
            <Feather name="trending-up" size={22} color="#fff" />
          </View>
          <View style={styles.financeHubText}>
            <Text style={styles.financeHubTitle}>Financial Access Hub</Text>
            <Text style={styles.financeHubSub}>
              Trust Score {user.trustScore} · {user.trustScore >= 600 ? 'Loans & Insurance available' : `${600 - user.trustScore} pts to unlock`}
            </Text>
          </View>
        </View>
        <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.7)" />
      </Pressable>

      {user.trustScore >= 600 && (
        <View style={[styles.financeProducts, { backgroundColor: '#E3F2FD', borderRadius: 10, marginVertical: 12, padding: 12 }]}> 
          <Text style={{ color: '#0F4C81', fontWeight: 'bold', marginBottom: 4 }}>Eligible Financial Products</Text>
          <Text style={{ color: '#0F4C81', marginBottom: 8 }}>You can now apply for:</Text>
          <Text style={{ color: '#0F4C81' }}>• Micro-Loans (Salary-Linked)</Text>
          <Text style={{ color: '#0F4C81' }}>• Gig Worker Advances</Text>
          <Text style={{ color: '#0F4C81' }}>• Equipment & Trade Finance</Text>
          <Text style={{ color: '#0F4C81' }}>• Worker Accident Insurance</Text>
          <Text style={{ color: '#0F4C81', marginTop: 8, fontStyle: 'italic' }}>All products are linked to your Trust Score and Fayda ID.</Text>
        </View>
      )}

      {/* Payment Methods */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Payment Methods</Text>
      <View style={styles.methodsGrid}>
        {[
          { name: "Telebirr", icon: "smartphone", color: "#E91E63" },
          { name: "CBE Birr", icon: "credit-card", color: "#1976D2" },
        ].map((method) => (
          <Pressable
            key={method.name}
            style={({ pressed }) => [
              styles.methodCard,
              { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <View style={[styles.methodIcon, { backgroundColor: `${method.color}15` }]}>
              <Feather name={method.icon as any} size={22} color={method.color} />
            </View>
            <Text style={[styles.methodName, { color: colors.foreground }]}>{method.name}</Text>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </Pressable>
        ))}
      </View>

      {/* Escrow Dispute */}
      <Pressable
        style={[styles.disputeCard, { backgroundColor: `${colors.destructive}10`, borderColor: `${colors.destructive}25` }]}
        onPress={() => router.push("/escrow-dispute")}
      >
        <Feather name="alert-circle" size={18} color={colors.destructive} />
        <View style={styles.disputeText}>
          <Text style={[styles.disputeTitle, { color: colors.foreground }]}>Raise an Escrow Dispute</Text>
          <Text style={[styles.disputeSub, { color: colors.mutedForeground }]}>Payment issue, work dispute or no-show?</Text>
        </View>
        <Feather name="chevron-right" size={16} color={colors.destructive} />
      </Pressable>

      {/* Transactions */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t("wallet.transactions")}</Text>
      <View style={styles.txList}>
        {MOCK_TRANSACTIONS.map((tx) => (
          <View
            key={tx.id}
            style={[styles.txRow, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View
              style={[
                styles.txIcon,
                { backgroundColor: tx.type === "credit" ? `${colors.success}15` : `${colors.destructive}15` },
              ]}
            >
              <Feather
                name={tx.type === "credit" ? "arrow-down-left" : "arrow-up-right"}
                size={18}
                color={tx.type === "credit" ? colors.success : colors.destructive}
              />
            </View>
            <View style={styles.txInfo}>
              <Text style={[styles.txLabel, { color: colors.foreground }]}>{tx.label}</Text>
              {tx.jobTitle ? (
                <Text style={[styles.txJob, { color: colors.mutedForeground }]}>{tx.jobTitle}</Text>
              ) : null}
            </View>
            <View style={styles.txRight}>
              <Text
                style={[
                  styles.txAmount,
                  { color: tx.type === "credit" ? colors.success : colors.destructive },
                ]}
              >
                {tx.type === "credit" ? "+" : "-"}{tx.amount.toLocaleString()} ETB
              </Text>
              <Text style={[styles.txDate, { color: colors.mutedForeground }]}>{tx.date}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { paddingHorizontal: 20, gap: 20 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, letterSpacing: -0.5 },
  balanceCard: {
    borderRadius: 24,
    padding: 24,
    gap: 4,
  },
  balanceLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 0.5 },
  balanceAmount: { fontFamily: "Inter_700Bold", fontSize: 48, color: "#fff", letterSpacing: -2 },
  balanceCurrency: { fontFamily: "Inter_400Regular", fontSize: 16, color: "rgba(255,255,255,0.75)", marginTop: -4 },
  balanceActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
    overflow: "hidden",
  },
  balanceBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  balanceBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#fff" },
  balanceDivider: { width: 1, height: 40, backgroundColor: "rgba(255,255,255,0.2)" },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 18, letterSpacing: -0.3 },
  methodsGrid: { gap: 10 },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  methodName: { fontFamily: "Inter_600SemiBold", fontSize: 15, flex: 1 },
  txList: { gap: 8 },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  txInfo: { flex: 1, gap: 2 },
  txLabel: { fontFamily: "Inter_500Medium", fontSize: 14 },
  txJob: { fontFamily: "Inter_400Regular", fontSize: 12 },
  txRight: { alignItems: "flex-end", gap: 2 },
  txAmount: { fontFamily: "Inter_700Bold", fontSize: 14 },
  txDate: { fontFamily: "Inter_400Regular", fontSize: 11 },
  financeHubCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 16, borderRadius: 16,
  },
  financeHubLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  financeHubIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  financeHubText: { flex: 1, gap: 3 },
  financeHubTitle: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },
  financeHubSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(255,255,255,0.7)" },
  disputeCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 14, borderWidth: 1,
  },
  disputeText: { flex: 1, gap: 2 },
  disputeTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  disputeSub: { fontFamily: "Inter_400Regular", fontSize: 12 },
  financeProducts: {},
});
