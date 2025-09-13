import { Stack } from "expo-router";
import React from "react";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(host)" options={{ headerShown: false }} />
      <Stack.Screen
        name="create-car"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="favorites"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="car-details/[id]"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="book-car"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="OnboardingListing"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
    </Stack>
  );
}

// export default Layout;
