import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
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
import { useAuth, type UserRole } from "@/context/AuthContext";
import { useLang } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { LANGUAGES, type Language } from "@/constants/i18n";

const expertiseOptions = [
  "Plumbing",
  "Electrical",
  "Construction",
  "Cleaning",
  "Cooking",
  "Driving",
];

const initialOtpDigits = Array(6).fill("");

type OnboardingStep =
  | "language"
  | "role"
  | "phone"
  | "otp"
  | "age"
  | "fayda"
  | "profile"
  | "guidance"
  | "pending";

export default function Onboarding() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language, setLanguage, t } = useLang();
  const { login, sendOtp, updateProfile, verifyFayda } = useAuth();

  const [step, setStep] = useState<OnboardingStep>("language");
  const [role, setRole] = useState<UserRole>("worker");
  const [phone, setPhone] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(initialOtpDigits);
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [faydaId, setFaydaId] = useState("");
  const [expertise, setExpertise] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 12,
      tension: 120,
    }).start();
  }, [step, slideAnim]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const goTo = (nextStep: OnboardingStep) => {
    setError("");
    setStep(nextStep);
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      await sendOtp(phone);
      setResendCooldown(60);
      setError("");
    } catch {
      setError("Failed to resend OTP. Please try again.");
    }
  };

  const handleLogin = async () => {
    const code = otpDigits.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login(phone, code, role);
      goTo("age");
    } catch {
      setError("Invalid OTP. Please check and try again");
    } finally {
      setLoading(false);
    }
  };

  const handleAgeConfirm = () => {
    const day = parseInt(dobDay, 10);
    const month = parseInt(dobMonth, 10);
    const year = parseInt(dobYear, 10);
    if (!dobDay || !dobMonth || !dobYear || Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) {
      setError("Please enter your full date of birth");
      return;
    }
    if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1940 || year > new Date().getFullYear()) {
      setError("Please enter a valid date of birth");
      return;
    }
    const dob = new Date(year, month - 1, day);
    const today = new Date();
    const ageMs = today.getTime() - dob.getTime();
    const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365.25);
    if (ageYears < 18) {
      setError("You must be at least 18 years old to use Serategna");
      return;
    }
    if (ageYears > 65) {
      setError("Serategna currently supports workers and employers up to age 65");
      return;
    }
    setError("");
    goTo("fayda");
  };

  const handleFayda = async () => {
    setLoading(true);
    setError("");
    try {
      const ok = await verifyFayda(faydaId);
      if (ok) {
        goTo("profile");
      } else {
        setError("Invalid Fayda ID");
      }
    } catch {
      setError("Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSkipFayda = () => {
    goTo("profile");
  };

  const handleProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const updates: Record<string, unknown> = {};
      if (role === "worker") {
        if (expertise.length === 0) {
          setError("Please select at least one area of expertise");
          setLoading(false);
          return;
        }
        if (!hourlyRate) {
          setError("Please set your hourly rate");
          setLoading(false);
          return;
        }
        updates.skills = expertise;
        updates.hourlyRate = parseInt(hourlyRate, 10);
        updates.isAvailable = isAvailable;
      }

      updates.verificationStatus = "pending";
      updateProfile(updates as any);
      goTo("guidance");
    } catch {
      setError("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20), paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
          {step === "language" && (
            <View style={styles.step}>
              <View style={[styles.logoMark, { backgroundColor: `${colors.primary}20` }]}> 
                <Feather name="briefcase" size={32} color={colors.primary} />
              </View>
              <Text style={[styles.appName, { color: colors.foreground }]}>ሰራተኛ</Text>
              <Text style={[styles.appNameLatin, { color: colors.primary }]}>Serategna</Text>
              <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
                {t("auth.tagline")}
              </Text>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Choose Language / ቋንቋ ምረጥ</Text>
              <View style={styles.langGrid}>
                {LANGUAGES.map((lang) => (
                  <Pressable
                    key={lang.code}
                    style={[
                      styles.langBtn,
                      {
                        borderColor: language === lang.code ? colors.primary : colors.border,
                        backgroundColor: language === lang.code ? `${colors.primary}12` : colors.card,
                      },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setLanguage(lang.code);
                    }}
                  >
                    <Text style={styles.langFlag}>{lang.flag}</Text>
                    <Text style={[styles.langNative, { color: language === lang.code ? colors.primary : colors.foreground }]}>
                      {lang.nativeLabel}
                    </Text>
                    <Text style={[styles.langEnglish, { color: colors.mutedForeground }]}>
                      {lang.label}
                    </Text>
                    {language === lang.code && (
                      <View style={[styles.langCheck, { backgroundColor: colors.primary }]}> 
                        <Feather name="check" size={10} color="#fff" />
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
              <Pressable style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={() => goTo("role")}> 
                <Text style={styles.primaryBtnText}>{t("auth.continue")}</Text>
                <Feather name="arrow-right" size={18} color="#fff" />
              </Pressable>
            </View>
          )}

          {step === "role" && (
            <View style={styles.step}>
              <Pressable onPress={() => goTo("language")} style={styles.backBtn}>
                <Feather name="arrow-left" size={20} color={colors.mutedForeground} />
              </Pressable>
              <Text style={[styles.heading, { color: colors.foreground }]}>{t("auth.role.select")}</Text>
              <View style={styles.roleGrid}>
                {[
                  { role: "worker" as UserRole, icon: "briefcase", color: colors.primary, descKey: "auth.role.worker.desc" },
                  { role: "employer" as UserRole, icon: "users", color: colors.accent, descKey: "auth.role.employer.desc" },
                  { role: "agent" as UserRole, icon: "award", color: "#7C3AED", descKey: "auth.role.agent.desc" },
                  { role: "ministry" as UserRole, icon: "shield", color: "#10B981", descKey: "auth.role.ministry.desc" },
                ].map((opt) => (
                  <Pressable
                    key={opt.role}
                    style={[
                      styles.roleCard,
                      {
                        borderColor: role === opt.role ? opt.color : colors.border,
                        backgroundColor: role === opt.role ? `${opt.color}10` : colors.card,
                        borderWidth: role === opt.role ? 2 : 1,
                      },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setRole(opt.role);
                    }}
                  >
                    <View style={[styles.roleIcon, { backgroundColor: `${opt.color}20` }]}> 
                      <Feather name={opt.icon as any} size={28} color={opt.color} />
                    </View>
                    <Text style={[styles.roleLabel, { color: colors.foreground }]}>{t(`auth.role.${opt.role}`)}</Text>
                    <Text style={[styles.roleDesc, { color: colors.mutedForeground }]}>
                      {t(opt.descKey)}
                    </Text>
                    {role === opt.role && (
                      <View style={[styles.checkMark, { backgroundColor: opt.color }]}> 
                        <Feather name="check" size={12} color="#fff" />
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
              <Pressable style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={() => goTo("phone")}> 
                <Text style={styles.primaryBtnText}>{t("auth.continue")}</Text>
                <Feather name="arrow-right" size={18} color="#fff" />
              </Pressable>
            </View>
          )}

          {step === "phone" && (
            <View style={styles.step}>
              <Pressable onPress={() => goTo("role")} style={styles.backBtn}>
                <Feather name="arrow-left" size={20} color={colors.mutedForeground} />
              </Pressable>
              <Text style={[styles.heading, { color: colors.foreground }]}>{t("auth.phone")}</Text>
              <Text style={[styles.subheading, { color: colors.mutedForeground }]}>We&apos;ll send a verification code</Text>
              <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.card }]}> 
                <Feather name="phone" size={18} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder={t("auth.phone.placeholder")}
                  placeholderTextColor={colors.mutedForeground}
                  autoFocus
                />
              </View>
              {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
              <Pressable
                style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                onPress={async () => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  try {
                    await sendOtp(phone);
                    setResendCooldown(60);
                    setStep("otp");
                    setError("");
                  } catch {
                    setError("Failed to send OTP. Please try again.");
                  }
                }}
              >
                <Text style={styles.primaryBtnText}>{t("auth.continue")}</Text>
                <Feather name="arrow-right" size={18} color="#fff" />
              </Pressable>
            </View>
          )}

          {step === "otp" && (
            <View style={styles.step}>
              <Pressable onPress={() => goTo("phone")} style={styles.backBtn}>
                <Feather name="arrow-left" size={20} color={colors.mutedForeground} />
              </Pressable>
              <Text style={[styles.heading, { color: colors.foreground }]}>{t("auth.otp")}</Text>
              <Text style={[styles.subheading, { color: colors.mutedForeground }]}>
                {t("auth.otp.sent")} {phone}
              </Text>
              <View style={styles.otpContainer}>
                {otpDigits.map((digit, index) => (
                  <TextInput
                    key={index}
                    style={[styles.otpInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]}
                    value={digit}
                    onChangeText={(value) => {
                      const sanitized = value.replace(/[^0-9]/g, "").slice(0, 1);
                      setOtpDigits((prev) => {
                        const next = [...prev];
                        next[index] = sanitized;
                        return next;
                      });
                    }}
                    keyboardType="number-pad"
                    maxLength={1}
                  />
                ))}
              </View>
              <Pressable
                style={[styles.resendBtn, { opacity: resendCooldown > 0 ? 0.5 : 1 }]}
                onPress={handleResendOtp}
                disabled={resendCooldown > 0}
              >
                <Text style={[styles.resendText, { color: resendCooldown > 0 ? colors.mutedForeground : colors.primary }]}> 
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                </Text>
              </Pressable>
              {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
              <Pressable
                style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.primaryBtnText}>{t("auth.verify")}</Text>
                    <Feather name="arrow-right" size={18} color="#fff" />
                  </>
                )}
              </Pressable>
            </View>
          )}

          {step === "age" && (
            <View style={styles.step}>
              <Pressable onPress={() => goTo("otp")} style={styles.backBtn}>
                <Feather name="arrow-left" size={20} color={colors.mutedForeground} />
              </Pressable>
              <View style={[styles.faydaIcon, { backgroundColor: `${colors.info}20` }]}> 
                <Feather name="calendar" size={36} color={colors.info} />
              </View>
              <Text style={[styles.heading, { color: colors.foreground }]}>Date of Birth</Text>
              <Text style={[styles.subheading, { color: colors.mutedForeground }]}>You must be 18–65 years old.</Text>
              <View style={styles.dobRow}>
                <View style={[styles.dobField, { flex: 1 }]}> 
                  <Text style={[styles.dobLabel, { color: colors.mutedForeground }]}>Day</Text>
                  <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.card }]}> 
                    <TextInput
                      style={[styles.input, { color: colors.foreground, textAlign: "center" }]}
                      value={dobDay}
                      onChangeText={(v) => setDobDay(v.replace(/[^0-9]/g, "").slice(0, 2))}
                      placeholder="DD"
                      placeholderTextColor={colors.mutedForeground}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                  </View>
                </View>
                <View style={[styles.dobField, { flex: 1 }]}> 
                  <Text style={[styles.dobLabel, { color: colors.mutedForeground }]}>Month</Text>
                  <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.card }]}> 
                    <TextInput
                      style={[styles.input, { color: colors.foreground, textAlign: "center" }]}
                      value={dobMonth}
                      onChangeText={(v) => setDobMonth(v.replace(/[^0-9]/g, "").slice(0, 2))}
                      placeholder="MM"
                      placeholderTextColor={colors.mutedForeground}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                  </View>
                </View>
                <View style={[styles.dobField, { flex: 2 }]}> 
                  <Text style={[styles.dobLabel, { color: colors.mutedForeground }]}>Year</Text>
                  <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.card }]}> 
                    <TextInput
                      style={[styles.input, { color: colors.foreground, textAlign: "center" }]}
                      value={dobYear}
                      onChangeText={(v) => setDobYear(v.replace(/[^0-9]/g, "").slice(0, 4))}
                      placeholder="YYYY"
                      placeholderTextColor={colors.mutedForeground}
                      keyboardType="number-pad"
                      maxLength={4}
                      autoFocus
                    />
                  </View>
                </View>
              </View>
              {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
              <View style={[styles.ageGuardrail, { backgroundColor: `${colors.warning}12`, borderColor: `${colors.warning}30` }]}> 
                <Feather name="shield" size={14} color={colors.warning} />
                <Text style={[styles.ageGuardrailText, { color: colors.warning }]}>Serategna prohibits child labour. Only ages 18–65 can register as workers or employers.</Text>
              </View>
              <Pressable style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={handleAgeConfirm}> 
                <Text style={styles.primaryBtnText}>Confirm Age</Text>
                <Feather name="arrow-right" size={18} color="#fff" />
              </Pressable>
            </View>
          )}

          {step === "fayda" && (
            <View style={styles.step}>
              <View style={[styles.faydaIcon, { backgroundColor: `${colors.success}20` }]}> 
                <Feather name="shield" size={36} color={colors.success} />
              </View>
              <Text style={[styles.heading, { color: colors.foreground }]}>{t("auth.fayda.verify")}</Text>
              <Text style={[styles.subheading, { color: colors.mutedForeground }]}>Verify your identity with your national Fayda ID.</Text>
              <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.card }]}> 
                <Feather name="credit-card" size={18} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  value={faydaId}
                  onChangeText={setFaydaId}
                  placeholder={t("auth.fayda.id")}
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="characters"
                />
              </View>
              {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
              <Pressable
                style={[styles.primaryBtn, { backgroundColor: colors.success, opacity: loading ? 0.7 : 1 }]}
                onPress={handleFayda}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Feather name="shield" size={18} color="#fff" />
                    <Text style={styles.primaryBtnText}>{t("auth.fayda.verify")}</Text>
                  </>
                )}
              </Pressable>
              <Pressable style={styles.skipBtn} onPress={handleSkipFayda}>
                <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Skip for now</Text>
              </Pressable>
            </View>
          )}

          {step === "profile" && (
            <View style={styles.step}>
              <Pressable onPress={() => goTo("fayda")} style={styles.backBtn}>
                <Feather name="arrow-left" size={20} color={colors.mutedForeground} />
              </Pressable>
              <Text style={[styles.heading, { color: colors.foreground }]}>Complete Your Profile</Text>
              <Text style={[styles.subheading, { color: colors.mutedForeground }]}>Set up your profile to start using Serategna.</Text>
              {role === "worker" && (
                <View style={styles.profileSection}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Areas of Expertise</Text>
                  <Text style={[styles.sectionDesc, { color: colors.mutedForeground }]}>Choose up to 3 areas you specialize in</Text>
                  <View style={styles.expertiseGrid}>
                    {expertiseOptions.map((skill) => (
                      <Pressable
                        key={skill}
                        style={[
                          styles.skillChip,
                          {
                            backgroundColor: expertise.includes(skill) ? colors.primary : colors.card,
                            borderColor: expertise.includes(skill) ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => {
                          setExpertise((prev) =>
                            prev.includes(skill)
                              ? prev.filter((item) => item !== skill)
                              : prev.length < 3
                              ? [...prev, skill]
                              : prev,
                          );
                        }}
                      >
                        <Text style={[styles.skillText, { color: expertise.includes(skill) ? "#fff" : colors.foreground }]}>{skill}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Hourly Rate (ETB)</Text>
                  <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.card }]}> 
                    <Feather name="dollar-sign" size={18} color={colors.mutedForeground} />
                    <TextInput
                      style={[styles.input, { color: colors.foreground }]}
                      value={hourlyRate}
                      onChangeText={(value) => setHourlyRate(value.replace(/[^0-9]/g, ""))}
                      placeholder="e.g. 150"
                      placeholderTextColor={colors.mutedForeground}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.availabilityRow}>
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Available for Work</Text>
                    <Pressable
                      style={[styles.toggle, { backgroundColor: isAvailable ? colors.primary : colors.border }]}
                      onPress={() => setIsAvailable((prev) => !prev)}
                    >
                      <View style={[styles.toggleKnob, { transform: [{ translateX: isAvailable ? 20 : 0 }] }]} />
                    </Pressable>
                  </View>
                </View>
              )}
              {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
              <Pressable style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]} onPress={handleProfile} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.primaryBtnText}>Complete Setup</Text>
                    <Feather name="check" size={18} color="#fff" />
                  </>
                )}
              </Pressable>
            </View>
          )}

          {step === "guidance" && (
            <View style={styles.step}>
              <Text style={[styles.heading, { color: colors.primary }]}>Welcome to Serategna!</Text>
              <Text style={[styles.sectionDesc, { color: colors.foreground }]}>Here’s how we keep you safe and empowered:</Text>
              <View style={{ marginVertical: 12 }}>
                <Text style={[styles.sectionTitle, { color: colors.success }]}>Escrow Security</Text>
                <Text style={[styles.sectionDesc, { color: colors.mutedForeground }]}>Your pay is locked in a digital vault before you start. You always get paid for completed work.</Text>
              </View>
              <View style={{ marginVertical: 12 }}>
                <Text style={[styles.sectionTitle, { color: colors.info }]}>SOS & Safety</Text>
                <Text style={[styles.sectionDesc, { color: colors.mutedForeground }]}>If you ever feel unsafe, use the SOS button to alert responders instantly with your location and job details.</Text>
              </View>
              <Pressable style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={() => goTo("pending")}>
                <Text style={styles.primaryBtnText}>Continue</Text>
                <Feather name="arrow-right" size={18} color="#fff" />
              </Pressable>
            </View>
          )}

          {step === "pending" && (
            <View style={styles.step}>
              <View style={[styles.faydaIcon, { backgroundColor: `${colors.info}20` }]}> 
                <Feather name="clock" size={36} color={colors.info} />
              </View>
              <Text style={[styles.heading, { color: colors.foreground }]}>Profile Pending Verification</Text>
              <Text style={[styles.subheading, { color: colors.mutedForeground }]}>Your digital registration is complete. Please visit a Serategna office or kiosk for in-person verification to activate your account.</Text>
              <Text style={[styles.sectionDesc, { color: colors.mutedForeground }]}>Bring your original Fayda ID and any certificates for review. After approval, your account will be activated and you can start working or hiring.</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: {
    paddingHorizontal: 24,
  },
  step: {
    gap: 20,
  },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 4,
  },
  appName: {
    fontFamily: "Inter_700Bold",
    fontSize: 36,
    textAlign: "center",
    letterSpacing: -1,
  },
  appNameLatin: {
    fontFamily: "Inter_400Regular",
    fontSize: 18,
    textAlign: "center",
    letterSpacing: 2,
    marginTop: -8,
  },
  tagline: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 8,
  },
  sectionLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    textAlign: "center",
    marginBottom: -8,
  },
  langGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  langBtn: {
    width: "30.5%",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 4,
    alignItems: "center",
    position: "relative",
  },
  langFlag: {
    fontSize: 22,
  },
  langNative: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    textAlign: "center",
  },
  langEnglish: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    textAlign: "center",
  },
  langCheck: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subheading: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
    marginTop: -8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: -8,
  },
  roleGrid: {
    gap: 12,
  },
  roleCard: {
    borderRadius: 16,
    padding: 18,
    gap: 6,
    position: "relative",
  },
  roleIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  roleLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  roleDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  checkMark: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
  },
  primaryBtn: {
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: "#fff",
  },
  error: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    textAlign: "center",
  },
  faydaIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  skipBtn: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  skipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  },
  dobRow: {
    flexDirection: "row",
    gap: 10,
  },
  dobField: {
    gap: 6,
  },
  dobLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  ageGuardrail: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  ageGuardrailText: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    lineHeight: 18,
  },
  otpContainer: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginVertical: 20,
  },
  otpInput: {
    width: 45,
    height: 56,
    borderWidth: 1.5,
    borderRadius: 12,
    textAlign: "center",
    fontFamily: "Inter_700Bold",
    fontSize: 24,
  },
  resendBtn: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  profileSection: {
    gap: 16,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
  },
  sectionDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    marginTop: -4,
  },
  expertiseGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  skillText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  availabilityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
});
