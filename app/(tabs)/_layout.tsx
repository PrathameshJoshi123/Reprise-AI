import { Stack } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";

const TabLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="product/[id]/page" options={{ headerShown: false }} />
      {/* <Stack.Screen name="orders" options={{ headerShown: false }} /> */}
      {/* <Stack.Screen name="products" options={{ headerShown: false }} /> */}
    </Stack>
  );
};

export default TabLayout;

const styles = StyleSheet.create({});
