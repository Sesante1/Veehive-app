import React from "react";
import { View } from "react-native";

const CarDetailsSkeleton = () => {
  return (
    <View className="flex h-full bg-white">
      {/* Image placeholder */}
      <View className="w-full h-[350px] bg-gray-100 animate-pulse" />

      <View className="px-6">
        {/* Specification container */}
        <View className="flex-row my-6 gap-5">
          <View className="h-[30px] w-[80px] rounded-full bg-gray-100 animate-pulse" />
          <View className="h-[30px] w-[80px] rounded-full bg-gray-100 animate-pulse" />
          <View className="h-[30px] w-[80px] rounded-full bg-gray-100 animate-pulse" />
          <View className="h-[30px] w-[80px] rounded-full bg-gray-100 animate-pulse" />
        </View>

        <View className="h-[15px] w-[160px] rounded-[5px] my-5 bg-gray-100 animate-pulse" />

        {/* Owner container */}
        <View className="flex-row gap-5">
          <View className="h-[60px] w-[60px] rounded-full bg-gray-100 animate-pulse" />

          <View className="flex-col gap-3 py-2">
            <View className="h-[15px] w-[120px] rounded-[5px] bg-gray-100 animate-pulse" />
            <View className="h-[15px] w-[70px] rounded-[5px] bg-gray-100 animate-pulse" />
          </View>
        </View>

        {/* About container */}
        <View className="flex-col gap-2 mt-10">
          <View className="h-[15px] w-[220px] rounded-[5px] bg-gray-100 animate-pulse" />
          <View className="h-[15px] w-[180px] rounded-[5px] bg-gray-100 animate-pulse" />
          <View className="h-[15px] w-[110px] rounded-[5px] bg-gray-100 animate-pulse" />
        </View>
      </View>
    </View>
  );
};

export default CarDetailsSkeleton;
