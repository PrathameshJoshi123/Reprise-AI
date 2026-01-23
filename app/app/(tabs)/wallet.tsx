import React, { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import "../../global.css";

interface CreditPlan {
  id: number;
  plan_name: string;
  credit_amount: number;
  price: number;
  bonus_percentage: number;
  description: string;
  is_active: boolean;
}

const Wallet = () => {
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState<CreditPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  const currentBalance = (user as any)?.credit_balance || 0;

  const fetchPlans = async () => {
    try {
      const response = await api.get('/partner/credit-plans');
      setPlans(response.data || []);
    } catch (error: any) {
      if (error.response?.status !== 401) {
        Alert.alert('Error', 'Failed to load credit plans');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPlans();
    refreshUser();
  };

  const handlePurchasePlan = async (planId: number, planName: string, price: number) => {
    Alert.alert(
      'Purchase Credits',
      `Purchase ${planName} for ₹${price.toLocaleString('en-IN')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: async () => {
            setPurchasing(true);
            try {
              const response = await api.post('/partner/purchase-credits', {
                plan_id: planId,
                payment_method: 'manual',
              });
              Alert.alert('Success', response.data?.message || 'Credits purchased successfully!');
              await refreshUser();
              await fetchPlans();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to purchase credits');
            } finally {
              setPurchasing(false);
            }
          },
        },
      ]
    );
  }

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
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0d9488"]} />
        }
      >
        {/* Header */}
        <View className="px-6 pt-4 pb-2">
          <Text className="text-2xl font-bold text-slate-900">Buy Credits</Text>
        </View>

        {/* Balance Card */}
        <View className="px-6 py-4">
          <View className="bg-teal-600 rounded-3xl p-6 shadow-xl">
            <View className="flex-row items-center mb-2">
              <Text className="text-teal-100 text-sm font-semibold">
                CURRENT BALANCE
              </Text>
              <View className="ml-auto w-10 h-10 bg-teal-500 rounded-full items-center justify-center">
                <Text className="text-2xl">💰</Text>
              </View>
            </View>

            <Text className="text-white text-5xl font-bold mb-3">
              {currentBalance.toLocaleString('en-IN')}
              <Text className="text-2xl text-teal-100"> CR</Text>
            </Text>

            <View className="flex-row items-center justify-between">
              <Text className="text-teal-100 text-xs">
                Use credits to purchase leads
              </Text>
            </View>
          </View>
        </View>

        {/* Credit Plans */}
        <View className="px-6 py-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-slate-900">
              Available Credit Plans
            </Text>
          </View>

          {plans.length === 0 ? (
            <View className="bg-white rounded-2xl p-6 items-center">
              <Text className="text-slate-500 text-center">No credit plans available</Text>
            </View>
          ) : (
            <View className="gap-4">
              {plans.map((plan, index) => {
                const bonusCredits = Math.floor((plan.credit_amount * plan.bonus_percentage) / 100);
                const totalCredits = plan.credit_amount + bonusCredits;

                return (
                  <View
                    key={plan.id}
                    className="bg-white border-2 border-slate-100 rounded-2xl p-5 shadow-sm"
                  >
                    {index === 1 && (
                      <View className="absolute -top-2 right-4 bg-orange-500 px-3 py-1 rounded-full">
                        <Text className="text-white text-xs font-bold">
                          🔥 Popular
                        </Text>
                      </View>
                    )}

                    <View className="flex-row items-start justify-between mb-4">
                      <View className="flex-1">
                        <Text className="text-slate-900 font-bold text-xl mb-2">
                          {plan.plan_name}
                        </Text>
                        <Text className="text-slate-500 text-sm mb-1">
                          {plan.description}
                        </Text>
                        <Text className="text-slate-600 text-base font-semibold mt-2">
                          ₹{plan.price.toLocaleString('en-IN')}
                        </Text>
                      </View>

                      <View className="items-end ml-4">
                        <View className="bg-teal-50 px-4 py-3 rounded-xl">
                          <Text className="text-teal-600 font-bold text-2xl">
                            {plan.credit_amount}
                          </Text>
                          <Text className="text-teal-600 text-xs text-center">Credits</Text>
                        </View>
                      </View>
                    </View>

                    {plan.bonus_percentage > 0 && (
                      <View className="bg-green-50 rounded-lg p-3 mb-4">
                        <Text className="text-green-700 text-sm font-semibold">
                          ✨ +{bonusCredits} Bonus Credits ({plan.bonus_percentage}% bonus)
                        </Text>
                        <Text className="text-green-600 text-xs mt-1">
                          Total: {totalCredits} credits
                        </Text>
                      </View>
                    )}

                    <TouchableOpacity
                      className="bg-teal-600 rounded-xl py-4 items-center"
                      onPress={() => handlePurchasePlan(plan.id, plan.plan_name, plan.price)}
                      disabled={purchasing}
                      activeOpacity={0.8}
                    >
                      <Text className="text-white font-bold text-base">
                        {purchasing ? 'Processing...' : 'Purchase Plan'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Information */}
        <View className="px-6 py-4 mb-6">
          <View className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <Text className="text-blue-900 font-semibold mb-2">ℹ️ How it works</Text>
            <Text className="text-blue-700 text-sm mb-2">
              • Purchase credits to unlock leads from the marketplace
            </Text>
            <Text className="text-blue-700 text-sm mb-2">
              • Each lead has a specific credit cost
            </Text>
            <Text className="text-blue-700 text-sm">
              • Bonus credits are automatically added to your balance
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Wallet;
