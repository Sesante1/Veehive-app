import { useNotifications } from "@/hooks/useNotifcation";
import { useAuth, useUserData } from "@/hooks/useUser";
import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Layout() {
  const insets = useSafeAreaInsets();
  const { userData, loading } = useUserData();
  const { user } = useAuth();
  const userId = user?.uid || null;
  const { unreadCount } = useNotifications(userId, "guest");

  const TabPressable = React.forwardRef<
    any,
    React.ComponentProps<typeof Pressable>
  >((props, ref) => {
    return (
      <Pressable
        {...props}
        ref={ref as any}
        android_ripple={{
          color: "#E3F2FD",
          borderless: true,
        }}
      />
    );
  });

  return (
    <Tabs
      initialRouteName="home"
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
        name="home"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <View style={{ position: "relative" }}>
              <Feather name="bell" size={size} color={color} />
              {unreadCount > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -8,
                    backgroundColor: "#EF4444",
                    borderRadius: 10,
                    minWidth: 18,
                    height: 18,
                    justifyContent: "center",
                    alignItems: "center",
                    paddingHorizontal: 4,
                    borderWidth: 2,
                    borderColor: "#fff",
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: "bold",
                    }}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </View>
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
          tabBarIcon: ({ color, focused }) => {
            if (loading || !userData?.profileImage) {
              return <Feather name="user" size={24} color={color} />;
            }

            return (
              <View
                style={{
                  borderWidth: focused ? 1 : 0,
                  borderColor: "#e5e9ecff",
                  borderRadius: 15,
                  padding: 2,
                }}
              >
                <Image
                  source={{ uri: userData.profileImage }}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                  }}
                  resizeMode="cover"
                />
              </View>
            );
          },
        }}
      />
    </Tabs>
  );
}
