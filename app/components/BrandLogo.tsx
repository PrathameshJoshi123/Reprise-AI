import React from "react";
import { Text, View } from "react-native";

interface BrandLogoProps {
  name: string;
}

const BrandLogo = ({ name }: BrandLogoProps) => {
  return (
    <View className="bg-white rounded-xl p-4 mr-3 items-center justify-center shadow-sm w-24 h-24 border border-gray-100">
      <Text className="text-gray-800 font-semibold text-base">{name}</Text>
    </View>
  );
};

export default BrandLogo;
