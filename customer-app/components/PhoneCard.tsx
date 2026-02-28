import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { formatPrice } from "../utils/helpers";
import type { Phone } from "../types";

interface PhoneCardProps {
  phone: Phone;
  onPress: () => void;
}

export default function PhoneCard({ phone, onPress }: PhoneCardProps) {
  const getImageSource = () => {
    if (phone.image_blob) {
      return { uri: phone.image_blob };
    }
    if (phone.image_url) {
      return { uri: phone.image_url };
    }
    // Default placeholder
    return {
      uri: `https://placehold.co/200x200/e2e8f0/475569?text=${encodeURIComponent(
        phone.Brand,
      )}`,
    };
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image
          source={getImageSource()}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.brand}>{phone.Brand}</Text>
        <Text style={styles.model} numberOfLines={2}>
          {phone.Model}
        </Text>
        <Text style={styles.price}>
          Up to {formatPrice(phone.Selling_Price)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    margin: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flex: 1,
    minWidth: 150,
    maxWidth: "48%",
  },
  imageContainer: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  image: {
    width: 100,
    height: 100,
  },
  content: {
    alignItems: "center",
  },
  brand: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  model: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
    height: 36,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2563eb",
  },
});
