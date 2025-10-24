import { icons } from "@/constants";
import {
  deleteNotification,
  markAllAsRead,
  markAsRead,
  useNotifications,
} from "@/hooks/useNotifcation";
import { useAuth } from "@/hooks/useUser";
import { router } from "expo-router";
import LottieView from "lottie-react-native";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Notifications = () => {
  const { user } = useAuth();
  const userId = user?.uid || null;

  const { notifications, unreadCount, loading } = useNotifications(
    userId,
    "hoster"
  );

  const handleNotificationPress = async (notification: any) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate if there's an action URL
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const handleMarkAllRead = async () => {
    if (!userId) return;
    try {
      await markAllAsRead(userId);
    } catch (error) {
      Alert.alert("Error", "Failed to mark all as read");
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      Alert.alert("Error", "Failed to delete notification");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "booking_confirmed":
        return "🎉";
      case "payment_received":
        return "💰";
      case "booking_cancelled":
        return "❌";
      case "booking_completed":
        return "✅";
      case "review_received":
        return "⭐";
      case "message_received":
        return "💬";
      default:
        return "📢";
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white px-4">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <Text className="text-2xl mt-6 font-JakartaBold">Notifications</Text>
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#000" />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (notifications.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white px-4">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <Text className="text-2xl mt-6 font-JakartaBold">Notifications</Text>
          <View className="flex-1 justify-center items-center">
            <LottieView
              source={require("../../../assets/animations/animatedNotification.json")}
              loop={true}
              autoPlay
              style={{ width: 150, height: 150 }}
            />
            <Text className="text-3xl font-JakartaBold mt-3">
              No Notifications yet
            </Text>
            <Text className="text-base mt-2 text-center px-7">
              No notifications in your inbox, yet!
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white -mb-14">
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 py-4 border-b border-gray-200">
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-JakartaBold">Notifications</Text>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={handleMarkAllRead}>
                <Text className="text-sm text-blue-500 font-JakartaSemiBold">
                  Mark all read
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {unreadCount > 0 && (
            <Text className="text-sm text-gray-500 font-JakartaMedium mt-1">
              {unreadCount} unread
            </Text>
          )}
        </View>

        {/* Notifications List */}
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleNotificationPress(item)}
              onLongPress={() =>
                Alert.alert("Delete", "Delete this notification?", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => handleDelete(item.id),
                  },
                ])
              }
              className={`px-4 py-4 border-b border-gray-100 ${
                !item.read ? "bg-blue-50" : "bg-white"
              }`}
            >
              <View className="flex-row items-center gap-4">
                <View className="bg-primary-500 p-3 rounded-full shadow-md flex justify-center items-center h-16 w-16">
                  <Image
                    source={icons.notification}
                    className="h-7 w-7 tint-white"
                  />
                </View>

                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-base font-JakartaBold flex-1">
                      {item.title}
                    </Text>
                    {!item.read && (
                      <View className="w-2 h-2 bg-blue-500 rounded-full ml-2" />
                    )}
                  </View>

                  <Text className="text-sm text-gray-600 font-JakartaMedium mb-1">
                    {item.message}
                  </Text>

                  <Text className="text-xs text-gray-400 font-JakartaMedium">
                    {formatTime(item.createdAt)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
    </SafeAreaView>
  );
};

export default Notifications;
