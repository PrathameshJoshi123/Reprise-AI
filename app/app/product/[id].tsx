import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";
import { getProductById } from "../../services/deviceApi";

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
  reviews: {
    rating: number;
    comment: string;
    date: string;
    reviewerName: string;
    reviewerEmail: string;
  }[];
  warrantyInformation: string;
  shippingInformation: string;
  availabilityStatus: string;
  returnPolicy: string;
}

const ProductDetail = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (id) {
        const data = await getProductById(parseInt(id));
        setProduct(data);
      }
    };
    fetchProduct();
  }, [id]);

  if (!product) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center px-6 py-4 bg-white border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="flex-1 text-lg font-bold text-gray-800 ml-4">
            Product Details
          </Text>
          <TouchableOpacity onPress={() => setLiked(!liked)}>
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={24}
              color={liked ? "#EF4444" : "#9CA3AF"}
            />
          </TouchableOpacity>
        </View>

        {/* Product Images */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6 py-4">
          {product.images.map((image, index) => (
            <Image
              key={index}
              source={{ uri: image }}
              className="w-80 h-80 rounded-2xl mr-4 bg-gray-100"
              resizeMode="cover"
            />
          ))}
        </ScrollView>

        {/* Product Info */}
        <View className="px-6 py-4">
          <Text className="text-2xl font-bold text-gray-800 mb-2">
            {product.title}
          </Text>
          <Text className="text-orange-500 font-bold text-xl mb-2">
            ${product.price.toFixed(2)}
            {product.discountPercentage > 0 && (
              <Text className="text-gray-500 text-sm ml-2">
                ({product.discountPercentage}% off)
              </Text>
            )}
          </Text>
          <View className="flex-row items-center mb-2">
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text className="text-gray-600 ml-1">{product.rating}</Text>
            <Text className="text-gray-500 ml-2">({product.reviews.length} reviews)</Text>
          </View>
          <Text className="text-gray-600 mb-4">{product.description}</Text>

          {/* Additional Details */}
          <View className="bg-gray-50 rounded-lg p-4 mb-4">
            <Text className="font-semibold text-gray-800 mb-2">Details</Text>
            <Text className="text-gray-600">Brand: {product.brand}</Text>
            <Text className="text-gray-600">Category: {product.category}</Text>
            <Text className="text-gray-600">Stock: {product.stock}</Text>
            <Text className="text-gray-600">Warranty: {product.warrantyInformation}</Text>
            <Text className="text-gray-600">Shipping: {product.shippingInformation}</Text>
            <Text className="text-gray-600">Return Policy: {product.returnPolicy}</Text>
          </View>

          {/* Reviews */}
          <Text className="text-lg font-bold text-gray-800 mb-4">Reviews</Text>
          {product.reviews.map((review, index) => (
            <View key={index} className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <View className="flex-row items-center mb-2">
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text className="text-gray-600 ml-1">{review.rating}</Text>
                <Text className="text-gray-500 ml-2">{review.reviewerName}</Text>
              </View>
              <Text className="text-gray-700">{review.comment}</Text>
              <Text className="text-gray-500 text-sm mt-1">
                {new Date(review.date).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProductDetail;
