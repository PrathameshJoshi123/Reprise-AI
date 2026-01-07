import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { ScrollView, Share, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";
import { useDiagnostic } from "./context";

const Result = () => {
  const { results, resetDiagnostic } = useDiagnostic();

  const getStatusIcon = (status: string) => {
    if (status === "PASSED") {
      return <Ionicons name="checkmark-circle" size={24} color="#10B981" />;
    } else if (status === "FAILED") {
      return <Ionicons name="close-circle" size={24} color="#EF4444" />;
    } else {
      return <Ionicons name="help-circle" size={24} color="#F59E0B" />;
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "PASSED") return "text-green-500";
    if (status === "FAILED") return "text-red-500";
    return "text-yellow-500";
  };

  const allTestsPassed = Object.values(results.tests).every(
    (status) => status === "PASSED"
  );

  const passedCount = Object.values(results.tests).filter(
    (status) => status === "PASSED"
  ).length;

  const generateDiagnosticJSON = () => {
    return {
      hardware: {
        brand: results.hardware.brand,
        model: results.hardware.model,
        ram_gb: results.hardware.ram_gb,
        os_version: results.hardware.os_version,
      },
      tests: {
        touchscreen: results.tests.touchscreen,
        microphone: results.tests.microphone,
        speaker: results.tests.speaker,
        gyroscope: results.tests.gyroscope,
        proximity: results.tests.proximity,
      },
    };
  };

  const handleShare = async () => {
    try {
      const diagnosticData = generateDiagnosticJSON();
      await Share.share({
        message: `Device Diagnostic Report\n\n${JSON.stringify(
          diagnosticData,
          null,
          2
        )}`,
        title: "Device Diagnostic Passport",
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleExportForPricing = () => {
    const diagnosticData = generateDiagnosticJSON();
    console.log("Diagnostic Passport for AI Pricing:", diagnosticData);
    // TODO: Send to your pricing API
    // await fetch('YOUR_API_ENDPOINT', {
    //   method: 'POST',
    //   body: JSON.stringify(diagnosticData)
    // });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-8">
          {/* Header */}
          <View className="items-center mb-8">
            <View
              className={`${
                allTestsPassed ? "bg-green-500" : "bg-yellow-500"
              } p-6 rounded-full mb-4`}
            >
              <Ionicons
                name={allTestsPassed ? "shield-checkmark" : "warning"}
                size={64}
                color="white"
              />
            </View>
            <Text className="text-gray-800 text-3xl font-bold text-center">
              {allTestsPassed ? "Diagnostic Complete!" : "Tests Completed"}
            </Text>
            <Text className="text-gray-600 text-center mt-2">
              {passedCount}/5 Tests Passed
            </Text>
          </View>

          {/* Hardware Passport Card */}
          <View className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
            <View className="flex-row items-center mb-4">
              <Ionicons name="hardware-chip" size={28} color="#3B82F6" />
              <Text className="text-gray-800 text-xl font-bold ml-3">
                Device Passport
              </Text>
            </View>

            <View>
              <View className="flex-row justify-between py-2 border-b border-gray-100">
                <Text className="text-gray-600">Brand</Text>
                <Text className="text-gray-800 font-semibold">
                  {results.hardware.brand}
                </Text>
              </View>
              <View className="flex-row justify-between py-2 border-b border-gray-100">
                <Text className="text-gray-600">Model</Text>
                <Text className="text-gray-800 font-semibold">
                  {results.hardware.model}
                </Text>
              </View>
              <View className="flex-row justify-between py-2 border-b border-gray-100">
                <Text className="text-gray-600">RAM</Text>
                <Text className="text-gray-800 font-semibold">
                  {results.hardware.ram_gb} GB
                </Text>
              </View>
              <View className="flex-row justify-between py-2">
                <Text className="text-gray-600">OS Version</Text>
                <Text className="text-gray-800 font-semibold">
                  {results.hardware.os_version}
                </Text>
              </View>
            </View>
          </View>

          {/* Test Results Card */}
          <View className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
            <View className="flex-row items-center mb-4">
              <Ionicons name="clipboard" size={28} color="#8B5CF6" />
              <Text className="text-gray-800 text-xl font-bold ml-3">
                Test Results Summary
              </Text>
            </View>

            {/* Clean summary list */}
            <View>
              {Object.entries(results.tests).map(
                ([testName, status], index, array) => (
                  <View
                    key={testName}
                    className={`flex-row justify-between items-center py-4 px-3 rounded-xl mb-2 ${
                      status === "PASSED"
                        ? "bg-green-50"
                        : status === "FAILED"
                          ? "bg-red-50"
                          : "bg-gray-50"
                    }`}
                  >
                    <View className="flex-row items-center flex-1">
                      {getStatusIcon(status)}
                      <View className="ml-3">
                        <Text className="text-gray-800 font-semibold capitalize text-base">
                          {testName.replace(/([A-Z])/g, " $1").trim()}
                        </Text>
                        <Text className="text-gray-500 text-xs mt-0.5">
                          {status === "PASSED"
                            ? "All checks passed"
                            : status === "FAILED"
                              ? "Needs attention"
                              : "Not tested"}
                        </Text>
                      </View>
                    </View>
                    <View
                      className={`px-3 py-1 rounded-full ${
                        status === "PASSED"
                          ? "bg-green-500"
                          : status === "FAILED"
                            ? "bg-red-500"
                            : "bg-yellow-500"
                      }`}
                    >
                      <Text className="text-white font-bold text-xs">
                        {status}
                      </Text>
                    </View>
                  </View>
                )
              )}
            </View>
          </View>

          {/* Device Health Score */}
          <LinearGradient
            colors={["#2563EB", "#9333EA"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="rounded-2xl p-6 mb-6 shadow-lg"
          >
            <Text className="text-white text-lg font-bold mb-2">
              Device Health Score
            </Text>
            <View className="flex-row items-end">
              <Text className="text-white text-5xl font-bold">
                {((passedCount / 5) * 100).toFixed(0)}
              </Text>
              <Text className="text-white/80 text-2xl mb-1">%</Text>
            </View>
            <View className="mt-4 bg-white/20 h-2 rounded-full overflow-hidden">
              <View
                style={{ width: `${(passedCount / 5) * 100}%` }}
                className="h-full bg-white"
              />
            </View>
          </LinearGradient>

          {/* Action Buttons */}
          <View>
            <TouchableOpacity
              onPress={handleExportForPricing}
              className="bg-blue-600 rounded-full px-6 py-4 shadow-lg"
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="pricetag" size={20} color="white" />
                <Text className="text-white font-bold text-lg ml-2">
                  Get AI Price Estimate
                </Text>
              </View>
            </TouchableOpacity>

            <View className="h-3" />
            <TouchableOpacity
              onPress={handleShare}
              className="bg-gray-800 rounded-full px-6 py-4 shadow-lg"
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="share-social" size={20} color="white" />
                <Text className="text-white font-bold text-lg ml-2">
                  Share Report
                </Text>
              </View>
            </TouchableOpacity>

            <View className="h-3" />
            <TouchableOpacity
              onPress={() => {
                resetDiagnostic();
                router.push("/diagnostic/start");
              }}
              className="bg-white border-2 border-gray-300 rounded-full px-6 py-4"
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="refresh" size={20} color="#374151" />
                <Text className="text-gray-800 font-bold text-lg ml-2">
                  Run Again
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/")} className="mt-2">
              <Text className="text-gray-600 text-center">Back to Home</Text>
            </TouchableOpacity>
          </View>

          {/* JSON Preview (Debug) */}
          <View className="bg-gray-800 rounded-2xl p-4 mt-6">
            <Text className="text-gray-400 text-xs font-mono">
              {JSON.stringify(generateDiagnosticJSON(), null, 2)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Result;
