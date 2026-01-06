import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";
import { searchProducts } from "../../services/deviceApi";

interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  brand: string;
  thumbnail: string;
  images: string[];
}

const Search = () => {
  const { query: initialQuery } = useLocalSearchParams<{ query: string }>();
  const [searchQuery, setSearchQuery] = useState(initialQuery || "");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [likedProducts, setLikedProducts] = useState<Set<number>>(new Set());

  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      if (searchQuery.trim()) {
        const results = await searchProducts(searchQuery);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const toggleLike = (productId: number) => {
    setLikedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 py-4 bg-orange-50">
        <View className="flex-row items-center bg-white rounded-full px-4 py-3 shadow-sm">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          <TextInput
            placeholder="Search products..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 ml-3 text-gray-800 text-base"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-outline" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6 py-4"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-lg font-bold text-gray-800 mb-4">
          Search Results ({searchResults.length})
        </Text>

        <View className="flex-row flex-wrap justify-between">
          {searchResults.map((product) => (
            <View
              key={product.id}
              className="bg-white rounded-2xl mb-4 shadow-sm overflow-hidden"
              style={{ width: "48%" }}
            >
              <View className="relative">
                <Image
                  source={{ uri: product.thumbnail }}
                  className="w-full h-40 bg-gray-100"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => toggleLike(product.id)}
                  className="absolute top-2 right-2 bg-white w-8 h-8 rounded-full items-center justify-center"
                >
                  <Ionicons
                    name={
                      likedProducts.has(product.id) ? "heart" : "heart-outline"
                    }
                    size={18}
                    color={
                      likedProducts.has(product.id) ? "#EF4444" : "#9CA3AF"
                    }
                  />
                </TouchableOpacity>
              </View>

              <View className="p-3">
                <Text
                  className="text-sm font-semibold text-gray-800 mb-1"
                  numberOfLines={1}
                >
                  {product.title}
                </Text>
                <Text className="text-orange-500 font-bold text-base">
                  ${product.price.toFixed(2)}
                </Text>
                {product.stock > 0 && (
                  <View className="flex-row items-center mt-1">
                    <View className="w-2 h-2 rounded-full bg-green-500 mr-1" />
                    <Text className="text-xs text-gray-500">
                      {product.stock} in stock
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Search;
