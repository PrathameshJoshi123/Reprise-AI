import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";

function RootLayoutNav() {
  const { user, userType, isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inPartnerTabs = segments[0] === "(tabs)";
    const inAgentTabs = segments[0] === "(agent-tabs)";
    const atRoot = !segments[0];

    if (!isAuthenticated) {
      // Not authenticated - redirect to home if trying to access protected routes
      if (inPartnerTabs || inAgentTabs) {
        router.replace("/");
      }
      // If at root or auth pages, allow it
    } else if (isAuthenticated && user) {
      // Check for partner verification status
      if (userType === "partner") {
        const status = (user as any).verification_status;
        const isApproved = status === "approved";
        const isOnStatusPage =
          segments[0] === "(auth)" && segments[1] === "verification-status";

        if (!isApproved) {
          // If not approved, force redirection to status page
          if (!isOnStatusPage) {
            router.replace("/(auth)/verification-status");
          }
          return;
        }

        // If approved but on status page, redirect to dashboard
        if (isOnStatusPage) {
          router.replace("/(tabs)");
          return;
        }
      }

      // Authenticated - route based on userType
      if (atRoot) {
        // At root while authenticated, redirect to appropriate dashboard
        if (userType === "partner") {
          router.replace("/(tabs)");
        } else if (userType === "agent") {
          router.replace("/(agent-tabs)");
        }
      } else if (inAuthGroup) {
        // Already logged in, redirect to appropriate dashboard
        if (userType === "partner") {
          router.replace("/(tabs)");
        } else if (userType === "agent") {
          router.replace("/(agent-tabs)");
        }
      } else if (inPartnerTabs && userType !== "partner") {
        // Wrong user type trying to access partner dashboard
        router.replace("/(agent-tabs)");
      } else if (inAgentTabs && userType !== "agent") {
        // Wrong user type trying to access agent dashboard
        router.replace("/(tabs)");
      }
    }
  }, [isAuthenticated, isLoading, segments, user, userType]);

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
