import { icons } from "@/constants";
import { Tabs } from "expo-router";
import React from "react";
import { Image, ImageSourcePropType, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TabIcon = ({
  source,
  focused,
}: {
  source: ImageSourcePropType;
  focused: boolean;
}) => (
  <View
    className={`w-12 h-12 rounded-full items-center justify-center ${
      focused ? "bg-general-400" : "bg-transparent"
    }`}
    style={{
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 25,
    }}
  >
    <Image
      source={source}
      tintColor="white"
      resizeMode="contain"
      className="w-7 h-7"
      style={{
        alignSelf: "center",
      }}
    />
  </View>
);

export default function Layout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      initialRouteName="listing"
      screenOptions={{
        tabBarActiveTintColor: "white",
        tabBarInactiveTintColor: "white",
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#333333",
          borderRadius: 50,
          paddingBottom: 0, // ios only
          overflow: "hidden",
          marginHorizontal: 20,
          marginBottom: insets.bottom,
          height: 78,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexDirection: "row",
          position: "absolute",
        },
      }}
    >
      <Tabs.Screen
        name="listing"
        options={{
          title: "Listing",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon source={icons.checklist} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon source={icons.notification} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon source={icons.chat} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon source={icons.profile} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
