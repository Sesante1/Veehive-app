import React from "react";
import { View } from "react-native";

const Row = () => (
  <View className="flex flex-row items-center gap-2 p-4">
    <View className="h-8 flex-1 rounded-md bg-neutral-200/80 animate-pulse" />
  </View>
);

const ProfileSkeleton = () => {
  return (
    <View className="px-4 bg-white flex-1">
      {/* Header avatar + name */}
      <View className="flex items-center justify-center my-5 mb-20">
        {/* Avatar placeholder with shadow */}
        <View
          className="h-[110px] w-[110px] rounded-full bg-neutral-200/80 animate-pulse border-[3px] border-white"
        />

        {/* Name + Guest placeholders */}
        <View className="mt-5 items-center space-y-2">
          <View className="h-5 w-48 rounded-md bg-neutral-200/80 animate-pulse" />
          <View className="h-4 w-24 rounded-md bg-neutral-200/80 animate-pulse mt-5" />
        </View>
      </View>

      {/* List section 1 */}
      <View className="flex-1">
        <View className="border-b border-gray-200 mb-4 pb-4">
          <Row />
          <Row />
          <Row />
          <Row />
        </View>

        {/* List section 2 */}
        <View>
          <Row />
          <Row />
        </View>
      </View>
    </View>
  );
};

export default ProfileSkeleton;
