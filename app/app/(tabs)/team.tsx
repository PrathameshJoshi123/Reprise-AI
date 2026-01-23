import React, { useState } from "react";
import {
  FlatList,
  Linking,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";

type AgentStatus = "online" | "offline" | "on_job";

interface Agent {
  id: string;
  name: string;
  phone: string;
  status: AgentStatus;
  phonesCollected: number;
  pincode: string;
  avatar: string;
  lastActive?: string;
}

const Team = () => {
  const [showPerformance, setShowPerformance] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newAgent, setNewAgent] = useState({
    name: "",
    phone: "",
    pincode: "",
  });

  const agentsData: Agent[] = [
    {
      id: "1",
      name: "Sarah Jenkins",
      phone: "+91 98765 43210",
      status: "online",
      phonesCollected: 8,
      pincode: "560061",
      avatar: "👩",
    },
    {
      id: "2",
      name: "Michael Ross",
      phone: "+91 98765 43211",
      status: "on_job",
      phonesCollected: 5,
      pincode: "560034",
      avatar: "👨",
    },
    {
      id: "3",
      name: "David Kim",
      phone: "+91 98765 43212",
      status: "online",
      phonesCollected: 12,
      pincode: "560001",
      avatar: "👨",
    },
    {
      id: "4",
      name: "Emily Chen",
      phone: "+91 98765 43213",
      status: "offline",
      phonesCollected: 3,
      pincode: "560078",
      avatar: "👩",
      lastActive: "2h ago",
    },
    {
      id: "5",
      name: "James Wilson",
      phone: "+91 98765 43214",
      status: "on_job",
      phonesCollected: 6,
      pincode: "560017",
      avatar: "👨",
    },
  ];

  const getStatusInfo = (status: AgentStatus) => {
    switch (status) {
      case "online":
        return {
          label: "Online",
          color: "bg-green-500",
          dotColor: "bg-green-500",
        };
      case "offline":
        return {
          label: "Offline",
          color: "bg-gray-400",
          dotColor: "bg-gray-400",
        };
      case "on_job":
        return {
          label: "On Job",
          color: "bg-blue-500",
          dotColor: "bg-blue-500",
        };
    }
  };

  const handleCallAgent = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleAddAgent = () => {
    // Add agent logic here
    console.log("Adding agent:", newAgent);
    setModalVisible(false);
    setNewAgent({ name: "", phone: "", pincode: "" });
  };

  const totalPhones = agentsData.reduce(
    (sum, agent) => sum + agent.phonesCollected,
    0,
  );

  const renderAgentCard = ({ item }: { item: Agent }) => {
    const statusInfo = getStatusInfo(item.status);

    return (
      <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
        <View className="flex-row items-center">
          {/* Avatar */}
          <View className="relative mr-4">
            <View className="w-14 h-14 bg-teal-100 rounded-full items-center justify-center">
              <Text className="text-2xl">{item.avatar}</Text>
            </View>
            <View
              className={`absolute bottom-0 right-0 w-4 h-4 ${statusInfo.dotColor} border-2 border-white rounded-full`}
            />
          </View>

          {/* Agent Info */}
          <View className="flex-1">
            <Text className="text-slate-900 font-bold text-base mb-1">
              {item.name}
            </Text>
            <TouchableOpacity onPress={() => handleCallAgent(item.phone)}>
              <Text className="text-slate-500 text-sm mb-1">
                📞 {item.phone}
              </Text>
            </TouchableOpacity>
            <View className="flex-row items-center">
              <View className={`${statusInfo.color} px-2 py-1 rounded-full`}>
                <Text className="text-white text-xs font-bold">
                  {statusInfo.label}
                </Text>
              </View>
              {item.status === "offline" && item.lastActive && (
                <Text className="text-slate-400 text-xs ml-2">
                  • {item.lastActive}
                </Text>
              )}
            </View>
          </View>

          {/* Metrics */}
          <View className="items-end">
            <View className="bg-teal-50 px-3 py-2 rounded-lg">
              <Text className="text-teal-600 font-bold text-xl">
                {item.phonesCollected}
              </Text>
              <Text className="text-teal-600 text-xs">Today</Text>
            </View>
            <Text className="text-slate-400 text-xs mt-1">
              📍 {item.pincode}
            </Text>
          </View>
        </View>

        {/* Performance View (optional) */}
        {showPerformance && (
          <View className="mt-3 pt-3 border-t border-gray-100">
            <View className="flex-row justify-between">
              <View className="flex-1 items-center">
                <Text className="text-slate-500 text-xs mb-1">This Week</Text>
                <Text className="text-slate-900 font-bold text-lg">
                  {item.phonesCollected * 5}
                </Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-slate-500 text-xs mb-1">This Month</Text>
                <Text className="text-slate-900 font-bold text-lg">
                  {item.phonesCollected * 20}
                </Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-slate-500 text-xs mb-1">Total Value</Text>
                <Text className="text-slate-900 font-bold text-lg">
                  ₹{(item.phonesCollected * 65).toFixed(0)}k
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 pt-4 pb-4">
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-2xl font-bold text-slate-900">
              Agent Network
            </Text>
            <Text className="text-slate-500 text-sm mt-1">
              {agentsData.length} Active Agents • {totalPhones} Phones Today
            </Text>
          </View>
          <TouchableOpacity className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
            <Text className="text-lg">⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Performance Toggle */}
        <View className="flex-row items-center justify-between bg-gray-50 rounded-xl p-3">
          <Text className="text-slate-700 font-semibold">
            Show Performance Metrics
          </Text>
          <TouchableOpacity
            onPress={() => setShowPerformance(!showPerformance)}
            className={`w-12 h-7 rounded-full justify-center ${
              showPerformance ? "bg-teal-600" : "bg-gray-300"
            }`}
            activeOpacity={0.8}
          >
            <View
              className={`w-5 h-5 bg-white rounded-full shadow-sm ${
                showPerformance ? "ml-6" : "ml-1"
              }`}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Agent List */}
      <FlatList
        data={agentsData}
        renderItem={renderAgentCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 24 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        className="absolute bottom-8 right-6 w-16 h-16 bg-teal-600 rounded-full items-center justify-center shadow-lg"
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text className="text-white text-3xl font-light">+</Text>
      </TouchableOpacity>

      {/* Add Agent Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            {/* Modal Header */}
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-slate-900">
                Add New Agent
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
              >
                <Text className="text-slate-600 font-bold">✕</Text>
              </TouchableOpacity>
            </View>

            <View className="bg-teal-50 rounded-xl p-3 mb-6">
              <Text className="text-teal-600 text-sm font-semibold">
                Lead Assignment Ready
              </Text>
              <Text className="text-teal-600 text-xs mt-1">
                New agents will automatically receive leads based on their
                pincode coverage.
              </Text>
            </View>

            {/* Form Fields */}
            <View className="mb-4">
              <Text className="text-slate-700 font-semibold mb-2">
                Agent Name <Text className="text-red-500">*</Text>
              </Text>
              <View className="bg-gray-50 rounded-xl px-4 py-4 border border-gray-200">
                <TextInput
                  className="text-slate-900"
                  placeholder="e.g. Sarah Connor"
                  placeholderTextColor="#94a3b8"
                  value={newAgent.name}
                  onChangeText={(text) =>
                    setNewAgent({ ...newAgent, name: text })
                  }
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-slate-700 font-semibold mb-2">
                Phone Number <Text className="text-red-500">*</Text>
              </Text>
              <View className="bg-gray-50 rounded-xl px-4 py-4 border border-gray-200">
                <TextInput
                  className="text-slate-900"
                  placeholder="98765 43210"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  value={newAgent.phone}
                  onChangeText={(text) =>
                    setNewAgent({ ...newAgent, phone: text })
                  }
                />
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-slate-700 font-semibold mb-2">
                Operating Pincode <Text className="text-red-500">*</Text>
              </Text>
              <View className="bg-gray-50 rounded-xl px-4 py-4 border border-gray-200">
                <TextInput
                  className="text-slate-900"
                  placeholder="110001"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  maxLength={6}
                  value={newAgent.pincode}
                  onChangeText={(text) =>
                    setNewAgent({ ...newAgent, pincode: text })
                  }
                />
              </View>
              <Text className="text-slate-400 text-xs mt-1">
                📍 Used to calculate resale logistics credits
              </Text>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-gray-200 rounded-xl py-4"
                onPress={() => setModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text className="text-slate-700 font-bold text-center">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-teal-600 rounded-xl py-4"
                onPress={handleAddAgent}
                activeOpacity={0.8}
              >
                <Text className="text-white font-bold text-center">
                  Save Agent →
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Team;
