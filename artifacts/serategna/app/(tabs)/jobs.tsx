import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { JobCard } from "@/components/JobCard";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useJobs, type JobStatus } from "@/context/JobContext";
import { useLang } from "@/context/LanguageContext";

const STATUS_TABS: { key: JobStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "requested", label: "New" },
  { key: "matched", label: "Matched" },
  { key: "funded", label: "Funded" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Done" },
];

export default function JobsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { jobs } = useJobs();
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState<JobStatus | "all">("all");

  const filtered = jobs.filter((j) => activeTab === "all" || j.status === activeTab);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
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
        <Text style={[styles.title, { color: colors.foreground }]}>{t("nav.jobs")}</Text>
        {user?.role === "employer" && (
          <Pressable
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/post-job")}
          >
            <Feather name="plus" size={20} color="#fff" />
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabContent}
      >
        {STATUS_TABS.map((tab) => {
          const count = jobs.filter((j) => tab.key === "all" || j.status === tab.key).length;
          return (
            <Pressable
              key={tab.key}
              style={[
                styles.tab,
                {
                  backgroundColor: activeTab === tab.key ? colors.primary : colors.card,
                  borderColor: activeTab === tab.key ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab.key);
              }}
            >
              <Text style={[styles.tabText, { color: activeTab === tab.key ? "#fff" : colors.mutedForeground }]}>
                {tab.label}
              </Text>
              <View style={[
                styles.tabBadge,
                { backgroundColor: activeTab === tab.key ? "rgba(255,255,255,0.25)" : colors.muted },
              ]}>
                <Text style={[styles.tabBadgeText, { color: activeTab === tab.key ? "#fff" : colors.mutedForeground }]}>
                  {count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(j) => j.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100) },
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <JobCard
            job={item}
            onPress={() => router.push({ pathname: "/job-detail", params: { id: item.id } })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="inbox" size={40} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No jobs found</Text>
          </View>
        }
        scrollEnabled={!!filtered.length}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, letterSpacing: -0.5 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  tabScroll: { maxHeight: 60 },
  tabContent: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  tabBadgeText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  list: { paddingHorizontal: 20, paddingTop: 12, gap: 12 },
  empty: { alignItems: "center", gap: 12, paddingVertical: 60 },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 15 },
});
