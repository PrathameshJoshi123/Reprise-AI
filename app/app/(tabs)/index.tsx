import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import "../../global.css";

export default function HomeScreen() {
  const { user } = useAuth();

  const quickMetrics = [
    { label: "Today's Claims", value: "12", subtext: "Claims Processed" },
    { label: "Active Agents", value: "8", subtext: "Team Members" },
    { label: "Completed Orders", value: "145", subtext: "This Month" },
  ];

  const highPriorityLeads = [
    { id: 1, device: "iPhone 15 Pro", distance: "2.3 km", value: "₹82,000" },
    {
      id: 2,
      device: "Samsung Galaxy S24",
      distance: "4.1 km",
      value: "₹65,000",
    },
    { id: 3, device: "MacBook Pro M3", distance: "5.8 km", value: "₹1,45,000" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 pt-4 pb-6 bg-white">
          <View>
            <Text className="text-slate-500 text-sm">Welcome back,</Text>
            <Text className="text-2xl font-bold text-slate-900 mt-1">
              {user?.email?.split("@")[0] || "Partner"}
            </Text>
          </View>
          <TouchableOpacity className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
            <Text className="text-lg">🔔</Text>
          </TouchableOpacity>
        </View>

        {/* Credit Widget */}
        <View className="px-6 py-4">
          <View className="bg-teal-600 rounded-2xl p-6 shadow-sm">
            <Text className="text-teal-100 text-sm font-medium mb-1">
              AVAILABLE BALANCE
            </Text>
            <Text className="text-white text-4xl font-bold mb-1">
              2,450
              <Text className="text-xl text-teal-100"> CR</Text>
            </Text>
            <Text className="text-teal-100 text-xs mb-4">
              Use credits to unlock qualified leads
            </Text>
            <TouchableOpacity
              className="bg-white rounded-xl py-3 px-6 self-start"
              activeOpacity={0.8}
            >
              <Text className="text-teal-600 font-bold">💳 Recharge</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Metrics */}
        <View className="px-6 py-2">
          <View className="flex-row justify-between">
            {quickMetrics.map((metric, index) => (
              <View
                key={index}
                className="bg-white rounded-xl p-4 flex-1 mx-1 shadow-sm"
              >
                <Text className="text-slate-500 text-xs mb-2">
                  {metric.label}
                </Text>
                <Text className="text-slate-900 text-2xl font-bold mb-1">
                  {metric.value}
                </Text>
                <Text className="text-slate-400 text-xs">{metric.subtext}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* High Priority Leads */}
        <View className="px-6 py-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-bold text-slate-900">
              High-Priority Leads
            </Text>
            <TouchableOpacity>
              <Text className="text-teal-600 font-semibold text-sm">
                View All
              </Text>
            </TouchableOpacity>
          </View>

          <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
            {highPriorityLeads.map((lead, index) => (
              <View key={lead.id}>
                <View className="p-4 flex-row justify-between items-center">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <Text className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                      <Text className="text-slate-900 font-semibold">
                        {lead.device}
                      </Text>
                    </View>
                    <Text className="text-slate-500 text-sm ml-4">
                      📍 {lead.distance} away • {lead.value}
                    </Text>
                  </View>
                  <TouchableOpacity
                    className="bg-teal-600 rounded-lg px-4 py-2"
                    activeOpacity={0.8}
                  >
                    <Text className="text-white font-semibold text-sm">
                      Claim
                    </Text>
                  </TouchableOpacity>
                </View>
                {index < highPriorityLeads.length - 1 && (
                  <View className="h-px bg-gray-100 ml-4" />
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
}
