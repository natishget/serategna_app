import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import { Alert, Animated, Pressable, StyleSheet, Text } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useLang } from "@/context/LanguageContext";

interface Props {
  onSOS?: () => void;
}

export function SOSButton({ onSOS }: Props) {
  const colors = useColors();
  const { t } = useLang();
  const scale = useRef(new Animated.Value(1)).current;
  const [active, setActive] = useState(false);

  const pulse = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.15, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start();
  };

  const handlePress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    pulse();
    Alert.alert(t("sos.activate"), "Send emergency alert to nearby responders?", [
      { text: t("sos.cancel"), style: "cancel" },
      {
        text: t("sos.confirm"),
        style: "destructive",
        onPress: () => {
          setActive(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          onSOS?.();
          setTimeout(() => setActive(false), 3000);
        },
      },
    ]);
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        style={[
          styles.btn,
          { backgroundColor: active ? colors.destructive : `${colors.destructive}20`, borderColor: colors.destructive },
        ]}
        onPress={handlePress}
      >
        <Feather name="alert-triangle" size={22} color={active ? "#fff" : colors.destructive} />
        <Text style={[styles.text, { color: active ? "#fff" : colors.destructive }]}>
          SOS
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  text: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1,
  },
});
