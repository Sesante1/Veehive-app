import { db } from "@/FirebaseConfig";
import { Booking, CarData, UserData } from "@/types/booking.types";
import {
  AntDesign,
  FontAwesome,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StaticCarLocationMap } from "./MapComponents";

interface BookingCardProps {
  booking: Booking;
  onContactGuest: (booking: Booking) => void;
  onManageTrip: (booking: Booking) => void;
}

const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onContactGuest,
  onManageTrip,
}) => {
  const [guestData, setGuestData] = useState<UserData | null>(null);
  const [carData, setCarData] = useState<CarData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch guest data
        const guestDoc = await getDoc(doc(db, "users", booking.userId));
        if (guestDoc.exists()) {
          setGuestData(guestDoc.data() as UserData);
        }

        // Fetch car data
        const carDoc = await getDoc(doc(db, "cars", booking.carId));
        if (carDoc.exists()) {
          setCarData({ id: carDoc.id, ...carDoc.data() } as CarData);
        }
      } catch (error) {
        console.error("Error fetching booking details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [booking.userId, booking.carId]);

  const getStatusStyle = (status: string): string => {
    switch (status) {
      case "pending":
        return "bg-yellow-100";
      case "confirmed":
        return "bg-blue-100";
      case "completed":
        return "bg-green-100";
      case "cancelled":
        return "bg-red-100";
      default:
        return "bg-gray-100";
    }
  };

  const getStatusTextStyle = (status: string): string => {
    switch (status) {
      case "pending":
        return "text-yellow-800";
      case "confirmed":
        return "text-blue-800";
      case "completed":
        return "text-green-800";
      case "cancelled":
        return "text-red-800";
      default:
        return "text-gray-800";
    }
  };

  const getStatusLabel = (status: string): string => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return <ActivityIndicator size="small" color="#0066FF" />;
  }

  return (
    <View className="bg-secondary-100 rounded-xl mb-4 p-3 rounded-[10px]">
      {/* Trip Details */}
      <View className="w-ful relative">
        <Image
          source={
            carData && carData.images.length > 0
              ? { uri: carData.images[0].url }
              : require("../assets/images/adaptive-icon.png")
          }
          style={{ width: "100%", height: 160, borderRadius: 5 }}
        />
        <View className="bg-white flex-row w-16 justify-center items-center gap-2 p-1 px-2 rounded-[5px] absolute top-2 left-2">
          <AntDesign name="star" size={16} color="#FFD700" />
          {/* <Text className="color-secondary-700">{avgRating ?? "N/A"}</Text> */}
          {/* TODO: Replace with actual rating once data is available */}
          <Text className="color-secondary-700">4.7</Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center mt-3">
        <View className="bg-white px-3 py-1 rounded-[5px]">
          <Text className="text-sm color-primary-500">{carData?.carType}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Text className="color-primary-500">₱{carData?.dailyRate}</Text>
          <Text className="color-secondary-700">/hr</Text>
        </View>
      </View>

      <Text className="text-lg font-JakartaSemiBold mt-3">
        {carData?.make} {carData?.model}
      </Text>

      {/* Transmission */}
      <View className="flex-row justify-between items-center mt-4 mb-2">
        <View className="flex-row items-center gap-2">
          <AntDesign name="setting" size={24} color="#007DFC" />
          <Text className="color-secondary-500 text-lg">
            {carData?.transmission}
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          {(carData?.fuel === "Gasoline" || carData?.fuel === "Diesel") && (
            <MaterialCommunityIcons
              name="gas-station"
              size={24}
              color="#007DFC"
            />
          )}
          {carData?.fuel === "Electric" && (
            <MaterialIcons name="electric-bolt" size={24} color="#007DFC" />
          )}
          <Text className="color-secondary-500 text-lg">{carData?.fuel}</Text>
        </View>

        <View className="flex-row items-center gap-2">
          <FontAwesome name="user" size={24} color="#007DFC" />
          <Text className="color-secondary-500 text-lg">
            {carData?.seats} Seats
          </Text>
        </View>
      </View>

      {/* Car location */}
      <View className="mt-6">
        <View className="flex-row justify-between mb-6">
          <Text className="font-JakartaSemiBold">Car location</Text>
          <Text className="font-JakartaSemiBold text-primary-500">
            Navigate
          </Text>
        </View>
        {/* <Image
          source={{
            uri: `https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=600&height=400&center=lonlat:${carData?.location?.coordinates?.longitude},${carData?.location?.coordinates?.latitude}&zoom=14&apiKey=${process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY}`,
          }}
          style={{ width: "100%", height: 200, borderRadius: 10 }}
        /> */}
        {carData?.location?.coordinates && (
          <StaticCarLocationMap
            carLocation={carData.location.coordinates}
            height={250}
          />
        )}
      </View>

      {/* Actions */}
      <View className="py-3 flex-row gap-2">
        <TouchableOpacity
          onPress={() => onContactGuest(booking)}
          className="flex-1 bg-gray-100 py-3.5 rounded-lg"
          activeOpacity={0.7}
        >
          <Text className="text-center text-gray-700 font-JakartaSemiBold">
            Cancel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onManageTrip(booking)}
          className="flex-1 bg-primary-500 py-3.5 rounded-lg"
          activeOpacity={0.7}
        >
          <Text className="text-center text-white font-JakartaSemiBold">
            Details
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default BookingCard;
