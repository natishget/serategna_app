import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/context/AuthContext";
import { ChatProvider } from "@/context/ChatContext";
import { JobProvider } from "@/context/JobContext";
import { LanguageProvider } from "@/context/LanguageContext";

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="job-detail" options={{ presentation: "card" }} />
      <Stack.Screen name="post-job" options={{ presentation: "card" }} />
      <Stack.Screen name="chat-room" options={{ presentation: "card" }} />
      <Stack.Screen name="active-job" options={{ presentation: "card" }} />
      <Stack.Screen name="rate-job" options={{ presentation: "card" }} />
      <Stack.Screen name="register-worker" options={{ presentation: "card" }} />
      <Stack.Screen name="job-feed" options={{ presentation: "card" }} />
      <Stack.Screen name="ai-cv" options={{ presentation: "card" }} />
      <Stack.Screen name="ai-employer-cv" options={{ presentation: "card" }} />
      <Stack.Screen name="moe-verify" options={{ presentation: "card" }} />
      <Stack.Screen name="finance-hub" options={{ presentation: "card" }} />
      <Stack.Screen name="escrow-dispute" options={{ presentation: "card" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <LanguageProvider>
            <AuthProvider>
              <JobProvider>
                <ChatProvider>
                  <GestureHandlerRootView style={{ flex: 1 }}>
                    <RootLayoutNav />
                  </GestureHandlerRootView>
                </ChatProvider>
              </JobProvider>
            </AuthProvider>
          </LanguageProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
