import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MessageItemSkeleton = () => {
  return (
    <View className="flex-row items-center mb-4">
      {/* Avatar placeholder */}
      <View className="size-16 rounded-full mr-3 bg-gray-100 animate-pulse" />

      {/* Text placeholders */}
      <View className="flex-1 gap-2">
        <View className="w-full bg-gray-100 h-[15px] rounded-md animate-pulse" />
        <View className="w-[100px] bg-gray-100 h-[15px] rounded-md animate-pulse" />
      </View>
    </View>
  );
};

const MessageSkeleton = () => {
  return (
    <SafeAreaView className="flex-1 bg-white px-4 py-16">
      {/* <View className="w-full h-[50px] rounded-full bg-gray-100 mb-10"></View> */}

      <MessageItemSkeleton/>
      <MessageItemSkeleton/>
      <MessageItemSkeleton/>
      <MessageItemSkeleton/>
      <MessageItemSkeleton/>
      <MessageItemSkeleton/>
      <MessageItemSkeleton/>
      <MessageItemSkeleton/>
    </SafeAreaView>
  );
};

export default MessageSkeleton;
