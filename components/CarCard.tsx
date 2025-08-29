import { useAuth } from "@/hooks/useUser";
import {
  AntDesign,
  FontAwesome,
  MaterialCommunityIcons,
  MaterialIcons,
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
  imageUrl: string | null;
  isWishlisted: boolean;
  onToggleWishlist?: (carId: string, isWishlisted: boolean) => void;
};

const CarCard: React.FC<CarProps> = ({
  id,
  name,
  type,
  pricePerHour,
  transmission,
  fuel,
  seats,
  imageUrl,
  isWishlisted,
  onToggleWishlist,
}) => {
  const {user} = useAuth();

  return (
    <Pressable
      className="flex-col mt-5 mb-2 bg-secondary-400 p-3 rounded-[10px]"
      onPress={() => {
        // TODO: Navigate to car details screen
        //        console.log(`Car selected: ${id}`);
      }}
    >
      <View className="w-full">
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: "100%", height: 160, borderRadius: 5 }}
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-40 bg-gray-200 rounded-md" />
        )}
        <View className="absolute top-2 flex-row justify-between items-center w-full px-2">
          <View className="bg-white flex flex-row justify-center items-center gap-2 p-1 px-2 rounded-[5px]">
            <AntDesign name="star" size={16} color="#FFD700" />
            {/* <Text className="color-secondary-700">{avgRating ?? "N/A"}</Text> */}
            {/* TODO: Replace with actual rating once data is available */}
            <Text className="color-secondary-700">4.7</Text>
          </View>

          {user && (
          <Pressable
            className="bg-white w-[26px] h-[26px] flex justify-center items-center rounded-full"
            onPress={() => onToggleWishlist?.(id, isWishlisted)}
          >
            {isWishlisted ? (
              <AntDesign name="heart" size={18} color="#F40F1F" />
            ) : (
              <AntDesign name="heart" size={18} color="#d6d6d6ff" />
            )}
          </Pressable>
          )}
        </View>
      </View>

      <View className="flex-row justify-between items-center mt-3">
        <View className="bg-white px-3 py-1 rounded-[5px]">
          <Text className="text-sm color-primary-500">{type}</Text>
        </View>

        <View className="flex-row items-center gap-1">
          <Text className="color-primary-500">₱{pricePerHour}</Text>
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
          {(fuel === "Gasoline" || fuel === "Diesel") && (
            <MaterialCommunityIcons
              name="gas-station"
              size={24}
              color="#007DFC"
            />
          )}
          {fuel === "Electric" && (
            <MaterialIcons name="electric-bolt" size={24} color="#007DFC" />
          )}
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
