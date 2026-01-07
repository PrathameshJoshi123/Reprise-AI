import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity } from "react-native";

interface CategoryCardProps {
  title: string;
  count: number;
  icon: keyof typeof Ionicons.glyphMap;
  bgColor: string;
}

const CategoryCard = ({ title, count, icon, bgColor }: CategoryCardProps) => {
  return (
    <TouchableOpacity className={`${bgColor} rounded-2xl p-6 flex-1 mx-2`}>
      <Ionicons name={icon} size={40} color="white" />
      <Text className="text-white text-2xl font-bold mt-4">{title}</Text>
      <Text className="text-white/80 text-sm mt-1">{count} devices</Text>
    </TouchableOpacity>
  );
};

export default CategoryCard;
