import { icons } from "@/constants";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CanceledScreen from "./bookingScreens/canceledScreen";
import CompletedScreen from "./bookingScreens/completedScreen";
import UpcomingScreen from "./bookingScreens/upcomingScreen";

const Tab = createMaterialTopTabNavigator();

const MyBooking = () => {
  const { tab } = useLocalSearchParams<{ tab?: string }>();

  const tabKey = (tab || "").toLowerCase();

  const initialTab =
    tabKey === "completed"
      ? "Completed"
      : tabKey === "canceled"
        ? "Canceled"
        : "Upcoming";

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex justify-between items-center mb-6 pt-4 bg-white px-4">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center active:bg-gray-200 absolute left-4 top-2"
        >
          <Image source={icons.backArrow} style={{ width: 20, height: 20 }} />
        </Pressable>

        <Text className="text-lg font-JakartaSemiBold text-gray-900 text-center">
          My booking
        </Text>
      </View>

      {/* Tabs */}
      <Tab.Navigator
        screenOptions={{
          tabBarLabelStyle: { fontSize: 16, fontWeight: "bold" },
          tabBarStyle: {
            backgroundColor: "#fff",
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarActiveTintColor: "#007DFC",
          tabBarInactiveTintColor: "#797979",
          tabBarIndicatorStyle: { backgroundColor: "#007DFC" },
          tabBarPressColor: "transparent",
        }}
        initialRouteName={initialTab}
      >
        <Tab.Screen name="Upcoming" component={UpcomingScreen} />
        <Tab.Screen name="Completed" component={CompletedScreen} />
        <Tab.Screen name="Canceled" component={CanceledScreen} />
      </Tab.Navigator>
    </SafeAreaView>
  );
};

export default MyBooking;
