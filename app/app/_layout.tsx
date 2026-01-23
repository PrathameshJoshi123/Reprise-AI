import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { View, ActivityIndicator, StyleSheet } from "react-native";

function RootLayoutNav() {
  const { user, userType, isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inPartnerTabs = segments[0] === "(tabs)";
    const inAgentTabs = segments[0] === "(agent-tabs)";

    if (!isAuthenticated) {
      // Not authenticated - allow home and auth screens
      if (inPartnerTabs || inAgentTabs) {
        router.replace("/");
      }
    } else if (isAuthenticated && user) {
      // Authenticated - route based on userType
      if (inAuthGroup) {
        // Already logged in, redirect to appropriate dashboard
        if (userType === "partner") {
          router.replace("/(tabs)");
        } else if (userType === "agent") {
          router.replace("/(agent-tabs)");
        }
      } else if (inPartnerTabs && userType !== "partner") {
        // Partner trying to access agent dashboard
        router.replace("/(agent-tabs)");
      } else if (inAgentTabs && userType !== "agent") {
        // Agent trying to access partner dashboard
        router.replace("/(tabs)");
      }
    }
  }, [isAuthenticated, isLoading, segments, user]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
});
