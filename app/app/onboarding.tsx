import { Stack, useRouter } from "expo-router";
import React from "react";
import { ImageBackground, Text, TouchableOpacity, View } from "react-native";
import "../global.css";

const Onboarding = () => {
  const router = useRouter();

  const handleGetStarted = () => {
    // Route-group folders use the folder name without parentheses when navigating
    router.push("/(tabs)");
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1">
        {/* Background with Illustration */}
        <ImageBackground
          source={require("@/assets/images/onboarding.png")}
          style={{ flex: 1, width: "100%" }}
          imageStyle={{ resizeMode: "repeat" }}
          //   height={900}
        >
          {/* Bottom White Card - Positioned Absolutely */}
          <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] px-6 pt-8 pb-12 shadow-lg">
            {/* Title with Reflection Effect */}
            <View className="items-center mb-4">
              <Text
                className="text-teal-500 text-4xl font-bold text-center"
                style={{
                  textShadowColor: "rgba(20, 184, 166, 0.3)",
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 4,
                }}
              >
                REPRICE AI
              </Text>
              {/* Reflection */}
              <Text
                className="text-teal-500 text-4xl font-bold text-center"
                style={{
                  transform: [{ scaleY: -0.5 }],
                  opacity: 0.15,
                  marginTop: -5,
                }}
              >
                REPRICE AI
              </Text>
            </View>
            <Text className="text-black text-2xl font-bold text-center mb-4">
              Let&apos;s Get You Set Up for Success
            </Text>
            <Text className="text-gray-500 text-base text-center mb-8 leading-6">
              Automatically optimize your prices in real-time to beat the
              competition and increase your margins.
            </Text>
            <TouchableOpacity
              onPress={handleGetStarted}
              style={{ backgroundColor: "#14B8A6" }}
              className=" py-4 rounded-full items-center"
            >
              <Text className="text-white text-lg font-semibold">
                Get started
              </Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </View>
    </>
  );
};

export default Onboarding;
