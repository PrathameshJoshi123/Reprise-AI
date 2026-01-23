import { ScrollView, Text, TouchableOpacity, View, Alert, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect, useCallback } from "react";
import api from "../../lib/api";
import "../../global.css";

interface OrderStats {
  locked: number;
  purchased: number;
  in_progress: number;
  completed: number;
}

export default function PartnerDashboard() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<OrderStats>({
    locked: 0,
    purchased: 0,
    in_progress: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await api.get("/partner/orders");
      const orders = response.data || [];

      const locked = orders.filter((o: any) => o.status === "partner_locked").length;
      const purchased = orders.filter((o: any) => o.status === "lead_purchased").length;
      const inProgress = orders.filter(
        (o: any) =>
          o.status === "assigned_to_agent" ||
          o.status === "accepted_by_agent" ||
          o.status === "pickup_scheduled"
      ).length;
      const completed = orders.filter(
        (o: any) =>
          o.status === "pickup_completed" ||
          o.status === "payment_processed" ||
          o.status === "completed"
      ).length;

      setStats({ locked, purchased, in_progress: inProgress, completed });
    } catch (error: any) {
      if (error.response?.status !== 401) {
        Alert.alert("Error", "Failed to fetch dashboard stats");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats();
    refreshUser();
  }, []);

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/");
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#0d9488" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0d9488"]} />
        }
      >
        {/* Header with Logout */}
        <View className="flex-row justify-between items-center px-6 pt-4 pb-6 bg-white border-b border-gray-200">
          <View className="flex-1">
            <Text className="text-slate-500 text-sm">Welcome back,</Text>
            <Text className="text-2xl font-bold text-slate-900 mt-1">
              {user?.name || user?.email?.split("@")[0] || "Partner"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center bg-red-50 px-4 py-2 rounded-lg"
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color="#dc2626" />
            <Text className="text-red-600 font-semibold ml-2">Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Credit Balance Widget */}
        <View className="px-6 py-4">
          <View className="bg-teal-600 rounded-2xl p-6 shadow-sm">
            <Text className="text-teal-100 text-sm font-medium mb-1">
              AVAILABLE CREDITS
            </Text>
            <Text className="text-white text-4xl font-bold mb-1">
              {(user as any)?.credit_balance || 0}
              <Text className="text-xl text-teal-100"> CR</Text>
            </Text>
            <Text className="text-teal-100 text-xs mb-4">
              Use credits to purchase leads from marketplace
            </Text>
            <TouchableOpacity
              className="bg-white rounded-xl py-3 px-6 self-start"
              activeOpacity={0.8}
              onPress={() => router.push("/(tabs)/wallet")}
            >
              <Text className="text-teal-600 font-bold">💳 Buy Credits</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dashboard Stats */}
        <View className="px-6 py-2">
          <Text className="text-lg font-bold text-slate-900 mb-3">
            Dashboard Overview
          </Text>
          <View className="space-y-3">
            {/* Locked Deals */}
            <TouchableOpacity 
              className="bg-white rounded-xl p-4 shadow-sm border border-purple-100"
              onPress={() => router.push("/(tabs)/dashboard?tab=locked")}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="w-12 h-12 bg-purple-100 rounded-full items-center justify-center mr-3">
                    <Ionicons name="lock-closed" size={24} color="#9333ea" />
                  </View>
                  <View>
                    <Text className="text-slate-500 text-sm font-medium">
                      Locked Deals
                    </Text>
                    <Text className="text-slate-900 text-2xl font-bold">
                      {stats.locked}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
              </View>
            </TouchableOpacity>

            {/* Purchased */}
            <TouchableOpacity 
              className="bg-white rounded-xl p-4 shadow-sm border border-blue-100"
              onPress={() => router.push("/(tabs)/dashboard?tab=purchased")}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-3">
                    <Ionicons name="cart" size={24} color="#2563eb" />
                  </View>
                  <View>
                    <Text className="text-slate-500 text-sm font-medium">
                      Purchased
                    </Text>
                    <Text className="text-slate-900 text-2xl font-bold">
                      {stats.purchased}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
              </View>
            </TouchableOpacity>

            {/* In Progress */}
            <TouchableOpacity 
              className="bg-white rounded-xl p-4 shadow-sm border border-amber-100"
              onPress={() => router.push("/(tabs)/dashboard?tab=in_progress")}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="w-12 h-12 bg-amber-100 rounded-full items-center justify-center mr-3">
                    <Ionicons name="time" size={24} color="#f59e0b" />
                  </View>
                  <View>
                    <Text className="text-slate-500 text-sm font-medium">
                      In Progress
                    </Text>
                    <Text className="text-slate-900 text-2xl font-bold">
                      {stats.in_progress}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
              </View>
            </TouchableOpacity>

            {/* Completed */}
            <TouchableOpacity 
              className="bg-white rounded-xl p-4 shadow-sm border border-green-100"
              onPress={() => router.push("/(tabs)/dashboard?tab=completed")}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-3">
                    <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
                  </View>
                  <View>
                    <Text className="text-slate-500 text-sm font-medium">
                      Completed
                    </Text>
                    <Text className="text-slate-900 text-2xl font-bold">
                      {stats.completed}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-6 py-4 mb-6">
          <Text className="text-lg font-bold text-slate-900 mb-3">
            Quick Actions
          </Text>
          <View className="flex-row justify-between">
            <TouchableOpacity
              className="bg-white rounded-xl p-4 flex-1 mr-2 shadow-sm items-center"
              onPress={() => router.push("/(tabs)/marketplace")}
            >
              <View className="w-12 h-12 bg-teal-100 rounded-full items-center justify-center mb-2">
                <Ionicons name="storefront" size={24} color="#0d9488" />
              </View>
              <Text className="text-slate-900 font-semibold text-sm text-center">
                Browse Leads
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-white rounded-xl p-4 flex-1 ml-2 shadow-sm items-center"
              onPress={() => router.push("/(tabs)/agents")}
            >
              <View className="w-12 h-12 bg-indigo-100 rounded-full items-center justify-center mb-2">
                <Ionicons name="people" size={24} color="#4f46e5" />
              </View>
              <Text className="text-slate-900 font-semibold text-sm text-center">
                Manage Agents
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
