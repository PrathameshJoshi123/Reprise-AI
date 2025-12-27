import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { TextInput, View } from "react-native";

const SearchBar = () => {
  return (
    <View className="bg-white px-4 py-3 border-b border-gray-200">
      <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-3">
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          placeholder="Search devices..."
          placeholderTextColor="#9CA3AF"
          className="flex-1 ml-2 text-base"
        />
      </View>
    </View>
  );
};

export default SearchBar;
