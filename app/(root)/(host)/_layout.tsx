import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Layout() {
  const insets = useSafeAreaInsets();

  const TabPressable = React.forwardRef<
      any,
      React.ComponentProps<typeof Pressable>
    >((props, ref) => {
      return (
        <Pressable
          {...props}
          ref={ref as any}
          android_ripple={{
            color: "#d7e9f7ff",
            borderless: true,
          }}
        />
      );
    });

  return (
    <Tabs
      initialRouteName="listing"
      screenOptions={{
        tabBarActiveTintColor: "#007dfc",
        tabBarInactiveTintColor: "#727272",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: "#F6F8FA",
          height: 50 + insets.bottom,
          paddingTop: 8,
          elevation: 0,
        },
        tabBarButton: (props) => {
          return <TabPressable {...props} />;
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="listing"
        options={{
          title: "Listing",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Feather name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Feather name="bell" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Feather name="message-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
