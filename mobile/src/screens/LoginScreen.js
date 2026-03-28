import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES, SHADOWS } from "../constants/theme";
import useAuthStore from "../store/authStore";

const LoginScreen = ({ navigation }) => {
  const {
    isAuthenticated,
    phoneNumber,
    otpCode,
    otpSent,
    otpDebugCode,
    isLoading,
    errorMessage,
    requestOtp,
    verifyOtp,
    setOtpCode,
    logout,
    profileCompleted,
    completeProfile,
  } = useAuthStore();

  const [countdown, setCountdown] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState("phone");

  useEffect(() => {
    if (isAuthenticated && profileCompleted) {
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    }
    if (isAuthenticated && !profileCompleted) {
      setStep("profile");
    }
  }, [isAuthenticated, profileCompleted]);

  useEffect(() => {
    let timer;
    if (otpSent && countdown > 0) {
      timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpSent, countdown]);

  const sendOtp = async () => {
    const success = await requestOtp(phoneNumber);
    if (success) {
      setCountdown(30);
    }
  };

  const isResendCooldown = countdown > 0;
  const isSendDisabled = isLoading || isResendCooldown;

  const submitOtp = async () => {
    const success = await verifyOtp(otpCode);
    if (success) {
      if (useAuthStore.getState().profileCompleted) {
        navigation.reset({ index: 0, routes: [{ name: "Home" }] });
      } else {
        setStep("profile");
      }
    }
  };

  const submitProfile = async () => {
    const success = await completeProfile(name, email);
    if (success) {
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Login</Text>
          <Text style={styles.subtitle}>Sign in with your phone number</Text>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.phoneRow}>
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                value={phoneNumber}
                onChangeText={(value) =>
                  useAuthStore.setState({
                    phoneNumber: value.replace(/\D/g, ""),
                  })
                }
                placeholder="Enter 10-digit number"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="number-pad"
                maxLength={10}
                style={styles.input}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, isSendDisabled && styles.buttonDisabled]}
              onPress={sendOtp}
              disabled={isSendDisabled}
            >
              <Text style={styles.buttonText}>
                {isLoading
                  ? "Sending OTP..."
                  : otpSent && !isResendCooldown
                  ? "Resend OTP"
                  : isResendCooldown
                  ? `Resend in ${countdown}s`
                  : "Send OTP"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* OTP */}
          {otpSent && !isAuthenticated && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>OTP</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={otpCode}
                  onChangeText={setOtpCode}
                  placeholder="Enter 4-digit OTP"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="number-pad"
                  maxLength={4}
                  style={styles.input}
                />
              </View>

              <Text style={styles.debugText}>
                Debug OTP (dev): {otpDebugCode}
              </Text>

              <TouchableOpacity
                style={styles.button}
                onPress={submitOtp}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>Verify OTP</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Profile */}
          {step === "profile" && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  placeholderTextColor={COLORS.textMuted}
                  style={styles.input}
                />
              </View>

              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email address"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>

              <TouchableOpacity
                style={styles.button}
                onPress={submitProfile}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>Save Profile & Continue</Text>
              </TouchableOpacity>
            </View>
          )}

          {errorMessage ? (
            <Text style={styles.error}>{errorMessage}</Text>
          ) : null}

          {isAuthenticated && (
            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
              <Ionicons name="log-out-outline" size={20} color="white" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 20,
    ...SHADOWS.card,
  },
  title: {
    fontSize: SIZES.xxl,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 6,
  },
  subtitle: {
    color: COLORS.textLight,
    marginBottom: 18,
  },
  inputGroup: { marginBottom: 16 },
  label: { color: COLORS.textLight, marginBottom: 6 },

  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 8,
  },

  countryCode: {
    paddingHorizontal: 10,
    color: "#000",
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },

  inputWrapper: {
    borderWidth: 1,
    borderColor: "#BCCCDC",
    borderRadius: 10,
    backgroundColor: "#fff",
  },

  input: {
    height: 48,
    paddingHorizontal: 12,
    fontSize: SIZES.md,
    color: "#000",
  },

  button: {
    marginTop: 10,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonDisabled: { backgroundColor: COLORS.border },

  buttonText: { color: "#fff", fontWeight: "700" },

  error: { marginTop: 10, color: "#f00" },

  debugText: {
    marginTop: 8,
    fontSize: SIZES.xs,
    color: COLORS.textLight,
  },

  logoutBtn: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.secondary,
    borderRadius: 10,
    padding: 10,
  },

  logoutText: {
    color: "#fff",
    fontSize: SIZES.base,
    marginLeft: 8,
  },
});

export default LoginScreen;
