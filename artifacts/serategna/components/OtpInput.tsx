import React, { useEffect, useMemo, useRef } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputKeyPressEventData,
  type NativeSyntheticEvent,
} from "react-native";

interface OtpInputProps {
  value: string;
  onChange: (nextValue: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  onComplete?: (value: string) => void;
}

function sanitizeDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled,
  autoFocus,
  onComplete,
}: OtpInputProps) {
  const inputsRef = useRef<Array<TextInput | null>>([]);
  const digits = useMemo(() => {
    const sanitized = sanitizeDigits(value).slice(0, length);
    return Array.from({ length }, (_, index) => sanitized[index] ?? "");
  }, [length, value]);

  useEffect(() => {
    if (!autoFocus || disabled) {
      return;
    }

    const firstEmptyIndex = digits.findIndex((digit) => !digit);
    const focusIndex = firstEmptyIndex === -1 ? length - 1 : firstEmptyIndex;
    inputsRef.current[focusIndex]?.focus();
  }, [autoFocus, disabled, digits, length]);

  const commitDigits = (nextDigits: string[]) => {
    const nextValue = nextDigits.join("").slice(0, length);
    onChange(nextValue);
    if (nextValue.length === length && onComplete) {
      onComplete(nextValue);
    }
  };

  const handleChangeText = (index: number, inputValue: string) => {
    const nextText = sanitizeDigits(inputValue);
    if (!nextText) {
      const nextDigits = [...digits];
      nextDigits[index] = "";
      commitDigits(nextDigits);
      return;
    }

    const nextDigits = [...digits];
    let cursor = index;
    for (const character of nextText.slice(0, length - index)) {
      nextDigits[cursor] = character;
      cursor += 1;
    }
    commitDigits(nextDigits);

    const nextIndex = Math.min(index + nextText.length, length - 1);
    if (nextIndex < length - 1 || nextDigits[length - 1]) {
      inputsRef.current[Math.min(index + nextText.length, length - 1)]?.focus();
    }
  };

  const handleKeyPress = (
    index: number,
    event: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ) => {
    if (event.nativeEvent.key !== "Backspace") {
      return;
    }

    if (digits[index]) {
      const nextDigits = [...digits];
      nextDigits[index] = "";
      commitDigits(nextDigits);
      return;
    }

    const previousIndex = index - 1;
    if (previousIndex >= 0) {
      const nextDigits = [...digits];
      nextDigits[previousIndex] = "";
      commitDigits(nextDigits);
      inputsRef.current[previousIndex]?.focus();
    }
  };

  return (
    <View style={styles.row}>
      {digits.map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            inputsRef.current[index] = ref;
          }}
          style={styles.input}
          value={digit}
          editable={!disabled}
          onChangeText={(text) => handleChangeText(index, text)}
          onKeyPress={(event) => handleKeyPress(index, event)}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          returnKeyType="next"
          blurOnSubmit={false}
          maxLength={length}
          selectTextOnFocus
          importantForAutofill="yes"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
  },
  input: {
    width: 48,
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    textAlign: "center",
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
});
