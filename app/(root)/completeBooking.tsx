import { icons } from "@/constants";
import { useDirectConversation } from "@/hooks/useDirectConversation";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { Alert, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CompleteBooking = () => {
  const { hostId, carName } = useLocalSearchParams<{
    hostId?: string;
    carName?: string;
  }>();
  const { openDirectConversation } = useDirectConversation();
  const handleMessageHost = () => {
    if (hostId) {
      openDirectConversation(
        String(hostId),
      );
    } else {
      Alert.alert("Error", "Host information not available");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex justify-between items-center mb-8 pt-4 bg-white px-4">
        <Pressable
          onPress={() => router.push("/")}
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center active:bg-gray-200 absolute left-4 top-2"
        >
          <Image source={icons.backArrow} style={{ width: 20, height: 20 }} />
        </Pressable>
      </View>

      <View className="flex-1 px-4">
        <View className="mb-16">
          <Image
            source={icons.complete}
            style={{ height: 280, width: "100%" }}
            resizeMode="cover"
          />
        </View>
        <View className="flex-1">
          <Text className="font-JakartaBold text-3xl mb-3">
            Your Trip is booked!
          </Text>
          <Text className="font-Jakarta">
            You're ready to hit the road! Don't forget:
          </Text>

          <View className="bg-gray-100 rounded-lg p-6 mt-10">
            <Text className="font-JakartaMedium mb-3">
              {"\u2022"} As the primary driver, you must be present with your
              valid physical driver's license to pick up the car.
            </Text>
            <Text className="font-JakartaMedium">
              {"\u2022"} Your license must be valid for the full duration of the
              trip.
            </Text>
          </View>

          <Text className="font-JakartaBold 2xl mt-10">Next steps</Text>
          <Text className="font-JakartaMedium mt-3">
            Say hello to your host so you'ready for check-in
          </Text>
        </View>

        <Pressable
          onPress={handleMessageHost}
          className="bg-primary-500 rounded-lg py-4 items-center"
        >
          <Text className="text-white font-JakartaSemiBold">
            Message your host
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default CompleteBooking;
