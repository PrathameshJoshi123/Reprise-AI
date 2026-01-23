import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import "../../global.css";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSecureLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      // Navigation will be handled automatically by AuthContext
    } catch (error) {
      Alert.alert("Login Failed", "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricAccess = () => {
    // Biometric authentication logic would go here
    console.log("Biometric access requested");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 py-8">
            {/* Header Section */}
            <View className="items-center mb-12">
              {/* Logo */}
              <View className="bg-teal-500 rounded-2xl h-16 w-16 items-center justify-center mb-6">
                <MaterialCommunityIcons
                  name="truck"
                  color="#ffffff"
                  size={32}
                />
              </View>

              {/* Title */}
              <View className="flex-row items-center">
                <Text className="text-3xl text-slate-900">Reprice </Text>
                <Text className="text-3xl text-teal-600 font-bold">
                  Partner
                </Text>
              </View>

              {/* Subtitle */}
              <Text className="text-slate-500 mt-2">
                Secure Logistics Portal
              </Text>
            </View>

            {/* Form Section */}
            <View className="mb-6">
              {/* Email Input */}
              <View className="mb-6">
                <Text className="text-xs font-bold text-slate-700 mb-2">
                  EMAIL ADDRESS / ID
                </Text>
                <View className="bg-slate-50 border border-slate-200 rounded-xl h-14 flex-row items-center px-4">
                  <Ionicons name="mail" color="#64748b" size={20} />
                  <TextInput
                    className="flex-1 ml-3 text-slate-900"
                    placeholder="partner@reprice.com"
                    placeholderTextColor="#94a3b8"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>
              </View>

              {/* Password Input */}
              <View className="mb-2">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-xs font-bold text-slate-700">
                    PASSWORD
                  </Text>
                  <TouchableOpacity>
                    <Text className="text-xs font-bold text-teal-600">
                      Login via OTP →
                    </Text>
                  </TouchableOpacity>
                </View>
                <View className="bg-slate-50 border border-slate-200 rounded-xl h-14 flex-row items-center px-4">
                  <Ionicons name="lock-closed" color="#64748b" size={20} />
                  <TextInput
                    className="flex-1 ml-3 text-slate-900"
                    placeholder="Enter your password"
                    placeholderTextColor="#94a3b8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    className="ml-2"
                  >
                    {showPassword ? (
                      <Ionicons name="eye-off" color="#64748b" size={20} />
                    ) : (
                      <Ionicons name="eye" color="#64748b" size={20} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot Password */}
              <View className="items-end mt-2">
                <TouchableOpacity>
                  <Text className="text-sm text-slate-500">
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Buttons Section */}
            <View className="mt-8">
              {/* Secure Login Button */}
              <TouchableOpacity
                className="bg-teal-600 rounded-xl h-14 flex-row items-center justify-center shadow-sm"
                onPress={handleSecureLogin}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <Text className="text-white font-bold text-base mr-2">
                  {isLoading ? "Logging in..." : "Secure Login"}
                </Text>
                {!isLoading && (
                  <Ionicons name="arrow-forward" color="#ffffff" size={20} />
                )}
              </TouchableOpacity>

              {/* Biometric Access Button */}
              <TouchableOpacity
                className="bg-slate-50 border border-slate-200 rounded-xl h-14 flex-row items-center justify-center mt-4"
                onPress={handleBiometricAccess}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="fingerprint"
                  color="#334155"
                  size={20}
                />
                <Text className="text-slate-700 font-semibold text-base ml-2">
                  Biometric Access
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View className="flex-1 justify-end items-center mt-8 pb-4">
              <View className="flex-row">
                <Text className="text-slate-500">
                  Not a registered partner?{" "}
                </Text>
                <TouchableOpacity>
                  <Text className="text-teal-600 font-semibold">
                    Apply Here
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
