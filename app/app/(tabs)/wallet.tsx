import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";

interface RechargePlan {
  id: string;
  name: string;
  amount: number;
  credits: number;
  popular?: boolean;
  bonus?: number;
}

interface Transaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  date: string;
  icon: string;
}

const Wallet = () => {
  const [customAmount, setCustomAmount] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const currentBalance = 2450;
  const lastUpdated = new Date().toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const rechargePlans: RechargePlan[] = [
    {
      id: "starter",
      name: "Starter Plan",
      amount: 10000,
      credits: 200,
    },
    {
      id: "growth",
      name: "Growth Plan",
      amount: 20000,
      credits: 450,
      popular: true,
      bonus: 50,
    },
    {
      id: "pro",
      name: "Pro Plan",
      amount: 50000,
      credits: 1200,
      bonus: 200,
    },
  ];

  const transactions: Transaction[] = [
    {
      id: "1",
      type: "debit",
      amount: 450,
      description: "Lead Claim: iPhone 15 Pro",
      date: "2h ago",
      icon: "📱",
    },
    {
      id: "2",
      type: "credit",
      amount: 1000,
      description: "Wallet Recharge",
      date: "1d ago",
      icon: "💳",
    },
    {
      id: "3",
      type: "debit",
      amount: 650,
      description: "Lead Claim: MacBook Air M3",
      date: "2d ago",
      icon: "💻",
    },
    {
      id: "4",
      type: "credit",
      amount: 2000,
      description: "Wallet Recharge",
      date: "5d ago",
      icon: "💳",
    },
    {
      id: "5",
      type: "debit",
      amount: 380,
      description: "Lead Claim: Galaxy S24 Ultra",
      date: "6d ago",
      icon: "📱",
    },
  ];

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    // Add payment logic here
    console.log("Selected plan:", planId);
  };

  const handleCustomRecharge = () => {
    if (customAmount) {
      console.log("Custom recharge:", customAmount);
      // Add custom recharge logic
    }
  };

  const calculateCredits = (amount: string) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return 0;
    // Basic calculation: ₹50 = 1 Credit
    return Math.floor(num / 50);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-4 pb-2">
          <Text className="text-2xl font-bold text-slate-900">My Wallet</Text>
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
              {currentBalance.toLocaleString()}
              <Text className="text-2xl text-teal-100"> CR</Text>
            </Text>

            <View className="flex-row items-center justify-between">
              <Text className="text-teal-100 text-xs">
                Last updated: {lastUpdated}
              </Text>
              <View className="flex-row items-center">
                <Text className="text-teal-100 text-xs mr-1">📈 Active</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recharge Plans */}
        <View className="px-6 py-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-slate-900">
              Select a Recharge Plan
            </Text>
            <Text className="text-teal-600 text-sm font-semibold">
              ⚡ Best Value
            </Text>
          </View>

          <View className="gap-3">
            {rechargePlans.map((plan) => (
              <View
                key={plan.id}
                className={`bg-white border-2 rounded-2xl p-4 ${
                  selectedPlan === plan.id
                    ? "border-teal-600"
                    : "border-slate-100"
                }`}
              >
                {plan.popular && (
                  <View className="absolute -top-2 right-4 bg-orange-500 px-3 py-1 rounded-full">
                    <Text className="text-white text-xs font-bold">
                      🔥 Most Popular
                    </Text>
                  </View>
                )}

                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-1">
                    <Text className="text-slate-900 font-bold text-lg mb-1">
                      {plan.name}
                    </Text>
                    <Text className="text-slate-500 text-sm">
                      ₹{plan.amount.toLocaleString()} = {plan.credits} Credits
                    </Text>
                    {plan.bonus && (
                      <Text className="text-green-600 text-xs font-semibold mt-1">
                        ✨ +{plan.bonus} Bonus Credits
                      </Text>
                    )}
                  </View>

                  <View className="items-end">
                    <View className="bg-teal-50 px-3 py-2 rounded-lg mb-2">
                      <Text className="text-teal-600 font-bold text-xl">
                        {plan.credits}
                      </Text>
                      <Text className="text-teal-600 text-xs">Credits</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  className={`rounded-xl py-3 ${
                    selectedPlan === plan.id ? "bg-teal-600" : "bg-teal-600"
                  }`}
                  onPress={() => handleSelectPlan(plan.id)}
                  activeOpacity={0.8}
                >
                  <Text className="text-white font-bold text-center">
                    {selectedPlan === plan.id ? "✓ Selected" : "Select Plan"}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Custom Recharge */}
        <View className="px-6 py-4">
          <View className="bg-white border-2 border-slate-100 rounded-2xl p-4">
            <View className="flex-row items-center mb-3">
              <Text className="text-slate-900 font-bold text-base flex-1">
                Custom Amount
              </Text>
              <Text className="text-slate-500 text-sm">₹50 = 1 Credit</Text>
            </View>

            <View className="flex-row gap-2 mb-3">
              <View className="flex-1 bg-gray-50 rounded-xl px-4 py-4 border border-gray-200">
                <TextInput
                  className="text-slate-900 text-lg font-semibold"
                  placeholder="Enter amount"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={customAmount}
                  onChangeText={setCustomAmount}
                />
              </View>
              <TouchableOpacity
                className="bg-teal-600 rounded-xl px-6 items-center justify-center"
                onPress={handleCustomRecharge}
                activeOpacity={0.8}
              >
                <Text className="text-white font-bold">Add</Text>
              </TouchableOpacity>
            </View>

            {customAmount && (
              <View className="bg-teal-50 rounded-lg p-3">
                <Text className="text-teal-600 text-sm font-semibold">
                  You'll receive: {calculateCredits(customAmount)} Credits
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Recent Transactions */}
        <View className="px-6 py-4">
          <View className="flex-row items-center mb-4">
            <Text className="text-lg font-bold text-slate-900 flex-1">
              Recent Transactions
            </Text>
            <TouchableOpacity>
              <Text className="text-teal-600 text-sm font-semibold">
                View All
              </Text>
            </TouchableOpacity>
          </View>

          <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
            {transactions.map((transaction, index) => (
              <View key={transaction.id}>
                <View className="p-4 flex-row items-center">
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                      transaction.type === "credit"
                        ? "bg-green-100"
                        : "bg-red-100"
                    }`}
                  >
                    <Text className="text-lg">{transaction.icon}</Text>
                  </View>

                  <View className="flex-1">
                    <Text className="text-slate-900 font-semibold mb-1">
                      {transaction.description}
                    </Text>
                    <Text className="text-slate-400 text-xs">
                      {transaction.date}
                    </Text>
                  </View>

                  <Text
                    className={`font-bold text-lg ${
                      transaction.type === "credit"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {transaction.type === "credit" ? "+" : "-"}
                    {transaction.amount}
                  </Text>
                </View>
                {index < transactions.length - 1 && (
                  <View className="h-px bg-gray-100 ml-16" />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Bottom Spacing */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Wallet;
