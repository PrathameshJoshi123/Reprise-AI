import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as Device from "expo-device";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Gyroscope, LightSensor } from "expo-sensors";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";
import { useDiagnostic } from "./context";

interface Permission {
  name: string;
  icon: string;
  granted: boolean;
  description: string;
}

const Start = () => {
  const { updateHardware } = useDiagnostic();
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<Permission[]>([
    {
      name: "Microphone",
      icon: "mic-outline",
      granted: false,
      description: "Required for audio test",
    },
    {
      name: "Sensors",
      icon: "fitness-outline",
      granted: false,
      description: "Required for gyroscope test",
    },
    {
      name: "Ambient Light",
      icon: "sunny-outline",
      granted: false,
      description: "Required for proximity test",
    },
  ]);
  const [hardwareExtracted, setHardwareExtracted] = useState(false);

  useEffect(() => {
    extractHardwareInfo();
  }, []);

  const extractHardwareInfo = async () => {
    try {
      // Extract hardware information
      const brand = Device.brand || "Unknown";
      const model = Device.modelName || "Unknown";
      const osVersion = Device.osVersion || "Unknown";
      const totalMemoryBytes = Device.totalMemory || 0;
      const ram_gb = Math.round(totalMemoryBytes / (1024 * 1024 * 1024));
      const isDevice = Device.isDevice;

      // Update context with hardware info
      updateHardware({
        brand,
        model,
        ram_gb,
        os_version: osVersion,
        isDevice,
      });

      setHardwareExtracted(true);
      setLoading(false);
    } catch (error) {
      console.error("Error extracting hardware:", error);
      setLoading(false);
    }
  };

  const requestAllPermissions = async () => {
    const updatedPermissions = [...permissions];

    try {
      // Request Audio recording permission using expo-av
      const { granted } = await Audio.requestPermissionsAsync();
      updatedPermissions[0].granted = granted;

      // Request Gyroscope (no explicit permission needed, just check availability)
      const gyroAvailable = await Gyroscope.isAvailableAsync();
      updatedPermissions[1].granted = gyroAvailable;

      // Request Light Sensor (no explicit permission needed, just check availability)
      const lightAvailable = await LightSensor.isAvailableAsync();
      updatedPermissions[2].granted = lightAvailable;

      setPermissions([...updatedPermissions]);

      // Navigate to tests after a short delay
      setTimeout(() => {
        router.replace("/diagnostic/tests");
      }, 500);
    } catch (error) {
      console.error("Error requesting permissions:", error);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={["#2563EB", "#9333EA"]} className="flex-1">
        <SafeAreaView className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#ffffff" />
          <Text className="text-white text-lg mt-4">
            Extracting Hardware Info...
          </Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#2563EB", "#9333EA"]} className="flex-1">
      <ScrollView>
        <SafeAreaView className="flex-1">
          <View className="flex-1 px-6 pt-12">
            {/* Header */}
            <View className="items-center mb-8">
              <View className="bg-white/20 p-6 rounded-full mb-4">
                <Ionicons name="hardware-chip" size={64} color="white" />
              </View>
              <Text className="text-white text-3xl font-bold text-center">
                Device Diagnostic
              </Text>
              <Text className="text-white/80 text-base text-center mt-2">
                Let&apos;s test your device hardware
              </Text>
            </View>

            {/* Hardware Info Card */}
            {hardwareExtracted && (
              <View className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
                <View className="flex-row items-center mb-4">
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  <Text className="text-gray-800 text-lg font-bold ml-2">
                    Hardware Detected
                  </Text>
                </View>

                {/* Hardware Metadata Display */}
                <View className="space-y-2">
                  <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
                    <Text className="text-gray-600 font-medium">Brand</Text>
                    <Text className="text-gray-800 font-bold">
                      {Device.brand || "Unknown"}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
                    <Text className="text-gray-600 font-medium">Model</Text>
                    <Text className="text-gray-800 font-bold">
                      {Device.modelName || "Unknown"}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center py-2">
                    <Text className="text-gray-600 font-medium">RAM</Text>
                    <Text className="text-gray-800 font-bold">
                      {Math.round(
                        (Device.totalMemory || 0) / (1024 * 1024 * 1024)
                      )}{" "}
                      GB
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Permissions List */}
            <View className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
              <Text className="text-gray-800 text-lg font-bold mb-4">
                Required Permissions
              </Text>
              {permissions.map((permission, index) => (
                <View
                  key={index}
                  className={`flex-row items-center py-3 ${
                    index < permissions.length - 1
                      ? "border-b border-gray-100"
                      : ""
                  }`}
                >
                  <View
                    className={`${
                      permission.granted ? "bg-green-500" : "bg-gray-300"
                    } w-12 h-12 rounded-full items-center justify-center mr-4`}
                  >
                    <Ionicons
                      name={permission.icon as any}
                      size={24}
                      color="white"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-800 font-semibold">
                      {permission.name}
                    </Text>
                    <Text className="text-gray-500 text-xs">
                      {permission.description}
                    </Text>
                  </View>
                  {permission.granted && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#10B981"
                    />
                  )}
                </View>
              ))}
            </View>

            {/* Start Button */}
            <TouchableOpacity
              onPress={requestAllPermissions}
              className="bg-white rounded-full px-8 py-4 shadow-lg"
            >
              <Text className="text-blue-600 font-bold text-center text-lg">
                Grant Permissions & Start
              </Text>
            </TouchableOpacity>

            {/* Skip Button */}
            <TouchableOpacity
              onPress={() => router.replace("/diagnostic/tests")}
              className="mt-4"
            >
              <Text className="text-white text-center opacity-70">
                Skip & Start Tests
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ScrollView>
    </LinearGradient>
  );
};

export default Start;
