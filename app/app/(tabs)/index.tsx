import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
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
import {
  getDeviceCategories,
  getPopularDevices,
  searchProducts,
} from "../../services/deviceApi";

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

const categories = getDeviceCategories().map((name) => ({
  name: name.charAt(0).toUpperCase() + name.slice(1).replace("-", " "),
  icon:
    name === "laptops"
      ? "laptop-outline"
      : name === "smartphones"
        ? "phone-portrait-outline"
        : "tablet-portrait-outline",
  color:
    name === "laptops"
      ? "bg-blue-500"
      : name === "smartphones"
        ? "bg-green-500"
        : "bg-purple-500",
}));

const Home = () => {
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [likedProducts, setLikedProducts] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      const products = await getPopularDevices();
      setNewProducts(products.slice(0, 6));
      setSearchSuggestions(products.slice(0, 6)); // Initial suggestions
    };
    fetchData();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      if (searchQuery.trim()) {
        const results = await searchProducts(searchQuery);
        setSearchSuggestions(results);
      } else {
        setSearchSuggestions(newProducts); // Reset to initial suggestions
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, newProducts]);

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
  };

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

  const navigateToProduct = (productId: number) => {
    router.push(`/product/${productId}/page`);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View className="bg-orange-50 px-6 pt-4 pb-8">
          <Image
            source={{
              uri: "https://img.freepik.com/free-vector/online-shopping-concept-illustration_114360-1084.jpg",
            }}
            className="w-full h-48 rounded-2xl mb-4"
            resizeMode="cover"
          />

          {/* Search Bar */}
          <View className="flex-row items-center bg-white rounded-full px-4 py-3 shadow-sm">
            <Ionicons name="search-outline" size={20} color="#9CA3AF" />
            <TextInput
              placeholder="Find secondhand treasures..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 ml-3 text-gray-800 text-base"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
            />
            <TouchableOpacity>
              <Ionicons name="options-outline" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Hardware Test Button */}
          <LinearGradient
            colors={["#2563EB", "#9333EA"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="mt-4 rounded-full"
          >
            <TouchableOpacity
              onPress={() => router.push("/diagnostic/start")}
              className="px-6 py-4 flex-row items-center justify-center"
            >
              <Ionicons name="hardware-chip-outline" size={24} color="white" />
              <Text className="text-white font-bold text-base ml-2">
                Run Hardware Test
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Search Suggestions Overlay */}
        {isSearchFocused && (
          <View className="px-6 py-4 bg-white border-t border-gray-200">
            <Text className="text-lg font-bold text-gray-800 mb-4">
              {searchQuery.trim() ? "Search Results" : "Suggestions"}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row">
                {searchSuggestions.slice(0, 10).map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    className="bg-white rounded-2xl mr-4 shadow-sm overflow-hidden"
                    style={{ width: 150 }}
                    onPress={() => navigateToProduct(product.id)}
                  >
                    <Image
                      source={{ uri: product.thumbnail }}
                      className="w-full h-24 bg-gray-100"
                      resizeMode="cover"
                    />
                    <View className="p-2">
                      <Text
                        className="text-sm font-semibold text-gray-800 mb-1"
                        numberOfLines={1}
                      >
                        {product.title}
                      </Text>
                      <Text className="text-orange-500 font-bold text-sm">
                        ${product.price.toFixed(2)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Explore by Category */}
        {!isSearchFocused && (
          <View className="px-6 py-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-gray-800">
                Explore by Category
              </Text>
              <TouchableOpacity>
                <Text className="text-orange-500 font-medium">See all</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row justify-between">
              {categories.map((category, index) => (
                <TouchableOpacity
                  key={index}
                  className="items-center"
                  style={{ width: "22%" }}
                >
                  <View
                    className={`${category.color} w-16 h-16 rounded-2xl items-center justify-center mb-2`}
                  >
                    <Ionicons
                      name={category.icon as any}
                      size={28}
                      color="white"
                    />
                  </View>
                  <Text className="text-xs text-gray-600 text-center">
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* New This Week */}
        {!isSearchFocused && (
          <View className="px-6 py-4 pb-8">
            <Text className="text-lg font-bold text-gray-800 mb-4">
              New This Week
            </Text>

            <View className="flex-row flex-wrap justify-between">
              {newProducts.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  className="bg-white rounded-2xl mb-4 shadow-sm overflow-hidden"
                  style={{ width: "48%" }}
                  onPress={() => navigateToProduct(product.id)}
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
                          likedProducts.has(product.id)
                            ? "heart"
                            : "heart-outline"
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
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;
