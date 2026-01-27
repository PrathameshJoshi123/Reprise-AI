import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import {
  validateEmail,
  validatePassword,
  validatePhone,
  validatePAN,
  validateGST,
  validatePincodes,
  validateRequired,
} from "../../utils/validation";
import { parsePincodes } from "../../utils/formatting";

export default function PartnerLoginScreen() {
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    company_name: "",
    business_address: "",
    gst_number: "",
    pan_number: "",
    serviceable_pincodes: "",
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Common validations
    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    // Signup-only validations
    if (!isLogin) {
      const nameError = validateRequired(formData.full_name, "Full Name");
      if (nameError) newErrors.full_name = nameError;

      const phoneError = validatePhone(formData.phone);
      if (phoneError) newErrors.phone = phoneError;

      const companyError = validateRequired(
        formData.company_name,
        "Company Name",
      );
      if (companyError) newErrors.company_name = companyError;

      const addressError = validateRequired(
        formData.business_address,
        "Business Address",
      );
      if (addressError) newErrors.business_address = addressError;

      const panError = validatePAN(formData.pan_number);
      if (panError) newErrors.pan_number = panError;

      const gstError = validateGST(formData.gst_number);
      if (gstError) newErrors.gst_number = gstError;

      const pincodesError = validatePincodes(formData.serviceable_pincodes);
      if (pincodesError) newErrors.serviceable_pincodes = pincodesError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (isLogin) {
        await login(formData.email, formData.password, "partner");
        router.replace("/(tabs)/dashboard");
      } else {
        const pincodes = parsePincodes(formData.serviceable_pincodes);
        await signup(
          formData.full_name,
          formData.email,
          formData.password,
          formData.phone,
          formData.company_name,
          formData.business_address,
          formData.gst_number,
          formData.pan_number,
          pincodes,
        );
        router.replace("/(tabs)/dashboard");
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.detail || "An error occurred. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
  };

  // For Login Mode - Simple form
  if (isLogin) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Checkered Pattern Background */}
            <View style={styles.checkeredBackground} />

            <View style={styles.contentContainer}>
              {/* Back Button */}
              <TouchableOpacity onPress={()=>router.push("/")} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color="#475569" />
              </TouchableOpacity>

              {/* Logo/Icon */}
              <View style={styles.logoContainer}>
                <View style={styles.iconBox}>
                  <MaterialCommunityIcons
                    name="briefcase-outline"
                    size={48}
                    color="#2563eb"
                  />
                </View>
              </View>

              {/* Title Section */}
              <View style={styles.titleContainer}>
                <Text style={styles.title}>Partner Login</Text>
                <Text style={styles.subtitle}>
                  Log in to manage your leads and agents
                </Text>
              </View>

              {/* Form Container */}
              <View style={styles.formCard}>
                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color="#64748b"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email"
                      placeholderTextColor="#94a3b8"
                      value={formData.email}
                      onChangeText={(text) =>
                        setFormData({ ...formData, email: text })
                      }
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                    />
                  </View>
                  {errors.email && (
                    <Text style={styles.errorText}>{errors.email}</Text>
                  )}
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#64748b"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Enter your password"
                      placeholderTextColor="#94a3b8"
                      value={formData.password}
                      onChangeText={(text) =>
                        setFormData({ ...formData, password: text })
                      }
                      secureTextEntry
                      autoCapitalize="none"
                      autoComplete="password"
                    />
                  </View>
                  {errors.password && (
                    <Text style={styles.errorText}>{errors.password}</Text>
                  )}
                </View>

                {/* Login Button */}
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={handleSubmit}
                  activeOpacity={0.8}
                  disabled={loading}
                >
                  <Text style={styles.loginButtonText}>
                    {loading ? "Logging in..." : "Login"}
                  </Text>
                </TouchableOpacity>

      
              </View>

              {/* Toggle to Signup */}
              <TouchableOpacity
                onPress={toggleMode}
                style={styles.toggleButton}
              >
                <Text style={styles.toggleText}>
                  Do not have an account?{" "}
                  <Text style={styles.toggleTextBold}>Apply now</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // For Signup Mode - Full form
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20 }}>
          <View style={{ marginTop: 20, marginBottom: 30 }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "bold",
                color: "#111827",
                textAlign: "center",
              }}
            >
              Partner Application
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "#6b7280",
                textAlign: "center",
                marginTop: 8,
              }}
            >
              Apply to become a verified partner. Your application will be
              reviewed by our team.
            </Text>
          </View>

          {/* Form Fields */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: "500", marginBottom: 6 }}>
              Full Name *
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: errors.full_name ? "#dc2626" : "#d1d5db",
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                backgroundColor: "#fff",
              }}
              value={formData.full_name}
              onChangeText={(text) =>
                setFormData({ ...formData, full_name: text })
              }
              placeholder="Enter your full name"
            />
            {errors.full_name && (
              <Text style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>
                {errors.full_name}
              </Text>
            )}
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: "500", marginBottom: 6 }}>
              Phone Number *
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: errors.phone ? "#dc2626" : "#d1d5db",
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                backgroundColor: "#fff",
              }}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="10-digit mobile number"
              keyboardType="phone-pad"
              maxLength={10}
            />
            {errors.phone && (
              <Text style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>
                {errors.phone}
              </Text>
            )}
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: "500", marginBottom: 6 }}>
              Company/Business Name *
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: errors.company_name ? "#dc2626" : "#d1d5db",
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                backgroundColor: "#fff",
              }}
              value={formData.company_name}
              onChangeText={(text) =>
                setFormData({ ...formData, company_name: text })
              }
              placeholder="Enter company name"
            />
            {errors.company_name && (
              <Text style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>
                {errors.company_name}
              </Text>
            )}
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: "500", marginBottom: 6 }}>
              Business Address *
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: errors.business_address ? "#dc2626" : "#d1d5db",
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                backgroundColor: "#fff",
                minHeight: 80,
                textAlignVertical: "top",
              }}
              value={formData.business_address}
              onChangeText={(text) =>
                setFormData({ ...formData, business_address: text })
              }
              placeholder="Complete business address"
              multiline
              numberOfLines={3}
            />
            {errors.business_address && (
              <Text style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>
                {errors.business_address}
              </Text>
            )}
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: "500", marginBottom: 6 }}>
              PAN Number *
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: errors.pan_number ? "#dc2626" : "#d1d5db",
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                backgroundColor: "#fff",
              }}
              value={formData.pan_number}
              onChangeText={(text) =>
                setFormData({ ...formData, pan_number: text.toUpperCase() })
              }
              placeholder="ABCDE1234F"
              maxLength={10}
              autoCapitalize="characters"
            />
            {errors.pan_number && (
              <Text style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>
                {errors.pan_number}
              </Text>
            )}
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: "500", marginBottom: 6 }}>
              GST Number (Optional)
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: errors.gst_number ? "#dc2626" : "#d1d5db",
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                backgroundColor: "#fff",
              }}
              value={formData.gst_number}
              onChangeText={(text) =>
                setFormData({ ...formData, gst_number: text.toUpperCase() })
              }
              placeholder="15-digit GST number"
              maxLength={15}
              autoCapitalize="characters"
            />
            {errors.gst_number && (
              <Text style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>
                {errors.gst_number}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={toggleMode}
            style={{ alignItems: "center" }}
          >
            <Text style={{ color: "#2563eb", fontSize: 14 }}>
              Already have an account? Login
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  checkeredBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: "#f1f5f9",
    opacity: 0.5,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconBox: {
    width: 100,
    height: 100,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: "#2563eb",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#334155",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#0f172a",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 12,
    marginTop: 4,
  },
  loginButton: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  forgotPassword: {
    alignItems: "center",
    marginTop: 16,
  },
  forgotPasswordText: {
    color: "#64748b",
    fontSize: 14,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e2e8f0",
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#94a3b8",
    fontSize: 14,
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  toggleButton: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  toggleText: {
    fontSize: 14,
    color: "#64748b",
  },
  toggleTextBold: {
    color: "#2563eb",
    fontWeight: "600",
  },
});
