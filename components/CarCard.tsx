import {
  AntDesign,
  FontAwesome,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";

type CarProps = {
  id: string;
  name: string;
  type: string;
  pricePerHour: number;
  transmission: string;
  fuel: string;
  seats: number;
  avgRating: number;
  reviewCount: number;
  imageUrl: string;
};

const CarCard: React.FC<CarProps> = ({
  name,
  type,
  pricePerHour,
  transmission,
  fuel,
  seats,
  avgRating,
  reviewCount,
  imageUrl,
}) => {
  return (
    <Pressable
      className="flex-col mt-5 mb-2 bg-secondary-400 p-3 rounded-[20px]"
      onPress={() => {
        // TODO: Navigate to car details screen
        //        console.log(`Car selected: ${id}`);
      }}
    >
      <View className="w-full">
        <Image
          source={{ uri: imageUrl }}
          style={{ width: "100%", height: 160, borderRadius: 10 }}
          resizeMode="cover"
        />
        <View className="absolute top-2 flex-row justify-between items-center w-full px-2">
          <View className="bg-white flex flex-row justify-center items-center gap-2 p-1 px-2 rounded-[5px]">
            <AntDesign name="star" size={16} color="#FFD700" />
            <Text className="color-secondary-700">{avgRating ?? "N/A"}</Text>
          </View>

          <View className="bg-white w-[26px] h-[26px] flex justify-center items-center rounded-full">
            <AntDesign name="heart" size={18} color="#F40F1F" />
          </View>
        </View>
      </View>

      <View className="flex-row justify-between items-center mt-3">
        <View className="bg-white px-3 py-1 rounded-[5px]">
          <Text className="text-sm color-primary-500">{type}</Text>
        </View>

        <View className="flex-row items-center gap-1">
          <Text className="color-primary-500">₱ {pricePerHour}</Text>
          <Text className="color-secondary-700">/hr</Text>
        </View>
      </View>

      <Text className="text-lg font-JakartaSemiBold mt-3">{name}</Text>

      <View className="flex-row justify-between items-center mt-4 mb-2">
        <View className="flex-row items-center gap-2">
          <AntDesign name="setting" size={24} color="#007DFC" />
          <Text className="color-secondary-500 text-lg">{transmission}</Text>
        </View>

        <View className="flex-row items-center gap-2">
          <MaterialCommunityIcons name="fuel" size={24} color="#007DFC" />
          <Text className="color-secondary-500 text-lg">{fuel}</Text>
        </View>

        <View className="flex-row items-center gap-2">
          <FontAwesome name="user" size={24} color="#007DFC" />
          <Text className="color-secondary-500 text-lg">{seats} Seats</Text>
        </View>
      </View>
    </Pressable>
  );
};

export default CarCard;
