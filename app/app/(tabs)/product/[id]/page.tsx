import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../../../global.css";
import { getProductById } from "../../../../services/deviceApi";

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
  sku: string;
  weight: number;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  warrantyInformation: string;
  shippingInformation: string;
  availabilityStatus: string;
  reviews: {
    rating: number;
    comment: string;
    date: string;
    reviewerName: string;
    reviewerEmail: string;
  }[];
  returnPolicy: string;
  minimumOrderQuantity: number;
  thumbnail: string;
  images: string[];
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
        <View className="flex-row items-center px-6 py-4 bg-orange-50">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-800 ml-4">
            Product Details
          </Text>
        </View>

        {/* Product Images */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-6 py-4"
        >
          {product.images.map((image, index) => (
            <Image
              key={index}
              source={{ uri: image }}
              className="w-80 h-80 rounded-2xl mr-4"
              resizeMode="cover"
            />
          ))}
        </ScrollView>

        {/* Product Info */}
        <View className="px-6 py-4">
          <View className="flex-row justify-between items-start mb-2">
            <Text className="text-2xl font-bold text-gray-800 flex-1 mr-4">
              {product.title}
            </Text>
            <TouchableOpacity onPress={() => setLiked(!liked)}>
              <Ionicons
                name={liked ? "heart" : "heart-outline"}
                size={28}
                color={liked ? "#EF4444" : "#9CA3AF"}
              />
            </TouchableOpacity>
          </View>
          <Text className="text-orange-500 font-bold text-2xl mb-2">
            ${product.price.toFixed(2)}
            {product.discountPercentage > 0 && (
              <Text className="text-gray-500 text-lg ml-2 line-through">
                $
                {(
                  product.price /
                  (1 - product.discountPercentage / 100)
                ).toFixed(2)}
              </Text>
            )}
          </Text>
          <Text className="text-gray-600 mb-4">{product.description}</Text>

          {/* Details */}
          <View className="bg-gray-50 rounded-lg p-4 mb-4">
            <Text className="text-lg font-semibold text-gray-800 mb-2">
              Details
            </Text>
            <Text className="text-gray-600">Brand: {product.brand}</Text>
            <Text className="text-gray-600">Category: {product.category}</Text>
            <Text className="text-gray-600">SKU: {product.sku}</Text>
            <Text className="text-gray-600">Weight: {product.weight}g</Text>
            <Text className="text-gray-600">
              Dimensions: {product.dimensions.width} x{" "}
              {product.dimensions.height} x {product.dimensions.depth} cm
            </Text>
            <Text className="text-gray-600">
              Warranty: {product.warrantyInformation}
            </Text>
            <Text className="text-gray-600">
              Shipping: {product.shippingInformation}
            </Text>
            <Text className="text-gray-600">
              Return Policy: {product.returnPolicy}
            </Text>
            <Text className="text-gray-600">
              Min Order: {product.minimumOrderQuantity}
            </Text>
            <Text className="text-gray-600">
              Availability: {product.availabilityStatus}
            </Text>
            <Text className="text-gray-600">Stock: {product.stock}</Text>
            <Text className="text-gray-600">Rating: {product.rating}/5</Text>
          </View>

          {/* Reviews */}
          <View className="mb-4">
            <Text className="text-lg font-semibold text-gray-800 mb-2">
              Reviews
            </Text>
            {product.reviews.map((review, index) => (
              <View key={index} className="bg-gray-50 rounded-lg p-3 mb-2">
                <View className="flex-row justify-between mb-1">
                  <Text className="font-semibold text-gray-800">
                    {review.reviewerName}
                  </Text>
                  <Text className="text-gray-500">{review.rating}/5</Text>
                </View>
                <Text className="text-gray-600 mb-1">{review.comment}</Text>
                <Text className="text-gray-400 text-sm">
                  {new Date(review.date).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProductDetail;
