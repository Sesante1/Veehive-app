import { AntDesign } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";

type CarStatus = "pending" | "snoozed" | "active" | "on a trip";

type CarProps = {
  id: string;
  name: string;
  type: string;
  pricePerHour: number;
  transmission: string;
  fuel: string;
  seats: number;
  images: string | null;
  year: number;
  available: boolean;
  status: CarStatus;

  onToggleAvailability?: (
    id: string,
    nextAvailable: boolean
  ) => void | Promise<void>;
  onPress?: (id: string) => void;
};

const statusConfig: Record<CarStatus, { label: string; color: string }> = {
  active: { label: "Listed", color: "#22c55e" }, // green-500
  snoozed: { label: "Snoozed", color: "#f97316" }, // orange-500
  "on a trip": { label: "On a trip", color: "#3b82f6" }, // blue-500
  pending: { label: "Pending", color: "#eab308" }, // yellow-500
};

const CarManagementCard: React.FC<CarProps> = ({
  id,
  name,
  type,
  pricePerHour,
  transmission,
  fuel,
  seats,
  images,
  year,
  available,
  status,
  onToggleAvailability,
  onPress,
}) => {
  const router = useRouter();

  const { label, color } = statusConfig[status];

  return (
    <Pressable
      className="flex-row gap-3 mt-5 mb-2 bg-white rounded-[10px]"
      onPress={() => {
        router.push({
          pathname: "/carProfile",
          params: { id },
        });
      }}
    >
      <View className="w-[190px]">
        {images ? (
          <Image
            source={{ uri: images[0] }}
            style={{ width: "100%", height: 140, borderRadius: 5 }}
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-40 bg-gray-200 rounded-md" />
        )}
        <View className="absolute left-2 top-2 bg-white py-1 px-2 rounded-[5px] flex-row gap-2 items-center">
          <View
            className="h-[15px] w-[15px] rounded-full"
            style={{ backgroundColor: color }}
          />
          <Text className="text-sm">{label}</Text>
        </View>
      </View>

      <View className="flex-1">
        <Text
          className="text-[18px] font-JakartaBold mb-2"
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {name + " " + year}
        </Text>

        <Text
          className="color-secondary-500 font-semibold text-[16px] flex-wrap"
          style={{ flexShrink: 1 }}
        >
          {type}
        </Text>

        <View className="flex-row justify-between items-center w-full my-2">
          <View className="bg-white flex flex-row justify-center items-center gap-2">
            <Text className="color-secondary-700 text-[16px] font-bold">
              4.97
            </Text>
            <AntDesign name="star" size={18} color="#FFD700" />
            <Text
              className="color-secondary-700 font-Jakarta flex-wrap"
              style={{ flexShrink: 1 }}
            >
              (99 trips)
            </Text>
          </View>
        </View>

        <Text
          className="color-secondary-500 text-lg font-Jakarta flex-wrap"
          style={{ flexShrink: 1 }}
        >
          On a trip: 28 Jun - 6 Jul
        </Text>
      </View>
    </Pressable>
  );
};

export default CarManagementCard;
