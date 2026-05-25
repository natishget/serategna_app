import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Redirect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useChat } from "@/context/ChatContext";
import { useLang } from "@/context/LanguageContext";

export default function TabLayout() {
  const colors = useColors();
  const { isAuthenticated, isLoading } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const { totalUnread } = useChat();
  const { t } = useLang();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          height: isWeb ? 84 : undefined,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.background },
              ]}
            />
          ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("nav.home"),
          tabBarIcon: ({ color }) => (
            <Feather name="home" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: t("nav.jobs"),
          tabBarIcon: ({ color }) => (
            <Feather name="briefcase" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: t("nav.chat"),
          tabBarBadge: totalUnread > 0 ? totalUnread : undefined,
          tabBarIcon: ({ color }) => (
            <Feather name="message-circle" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: t("nav.wallet"),
          tabBarIcon: ({ color }) => (
            <Feather name="credit-card" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("nav.profile"),
          tabBarIcon: ({ color }) => (
            <Feather name="user" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
