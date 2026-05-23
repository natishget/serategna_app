import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { JobCard } from "@/components/JobCard";
import { useColors } from "@/hooks/useColors";
import { useJobs } from "@/context/JobContext";
import { useLang } from "@/context/LanguageContext";

export default function JobFeedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { jobs, acceptJob } = useJobs();
  const { t } = useLang();
  const [search, setSearch] = useState("");

  const availableJobs = jobs.filter((j) =>
    (j.status === "requested" || j.status === "matched") &&
    (search === "" ||
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.category.toLowerCase().includes(search.toLowerCase()))
  );

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
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>{t("job.nearby")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.searchContainer, { paddingHorizontal: 20, paddingVertical: 12 }]}>
        <View style={[styles.searchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            value={search}
            onChangeText={setSearch}
            placeholder={t("general.search")}
            placeholderTextColor={colors.mutedForeground}
          />
          {search ? (
            <Pressable onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        data={availableJobs}
        keyExtractor={(j) => j.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 40) },
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: job }) => (
          <JobCard
            job={job}
            showActions={job.status === "requested"}
            onPress={() => router.push({ pathname: "/job-detail", params: { id: job.id } })}
            onAccept={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              acceptJob(job.id, "w-001");
            }}
            onDecline={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="map-pin" size={40} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No jobs nearby</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Check back soon for new opportunities
            </Text>
          </View>
        }
        scrollEnabled={!!availableJobs.length}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "Inter_700Bold", fontSize: 20, flex: 1, textAlign: "center" },
  searchContainer: {},
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15 },
  list: { paddingHorizontal: 20, paddingTop: 4, gap: 12 },
  empty: { alignItems: "center", gap: 10, paddingVertical: 60 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 17 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14 },
});
