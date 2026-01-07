import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface TrendCardProps {
  title: string;
  brand: string;
  price: number;
  thumbnail: string;
}

const TrendCard = ({ title, brand, price, thumbnail }: TrendCardProps) => {
  const sellPrice = Math.round(price * 0.65);

  return (
    <TouchableOpacity className="bg-white rounded-xl p-4 mb-3 flex-row shadow-sm border border-gray-100">
      <Image
        source={{ uri: thumbnail }}
        className="w-24 h-24 rounded-lg bg-gray-100"
        resizeMode="contain"
      />
      <View className="flex-1 ml-4 justify-between">
        <View>
          <Text className="text-xs text-gray-500 font-medium">{brand}</Text>
          <Text
            className="text-base font-semibold text-gray-800 mt-1"
            numberOfLines={2}
          >
            {title}
          </Text>
        </View>
        <Text className="text-green-600 font-bold text-lg">
          Sell up to ${sellPrice}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default TrendCard;
