import { db } from "@/FirebaseConfig";
import { Booking, CarData, UserData } from "@/types/booking.types";
import { formatDate, formatTime } from "@/utils/dateUtils";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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

  const handleReviewGuest = () => {
    router.push({
      pathname: "/HostReviewGuestScreen",
      params: {
        bookingId: booking.id,
        guestId: booking.userId,
        guestName: `${guestData?.firstName || "Guest"} ${guestData?.lastName || ""}`,
        guestImage: guestData?.profileImage || "",
      },
    });
  };

  const getStatusLabel = (status: string): string => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return <ActivityIndicator size="small" color="#0066FF" />;
  }

  return (
    <View className="bg-secondary-100 rounded-xl mb-4 shadow-sm border border-gray-100">
      {/* Header */}
      <View className="px-4 pt-4 pb-3 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <View
            className={`px-3 py-1.5 rounded-full ${getStatusStyle(booking.bookingStatus)}`}
          >
            <Text
              className={`font-JakartaSemiBold text-sm ${getStatusTextStyle(booking.bookingStatus)}`}
            >
              {getStatusLabel(booking.bookingStatus)}
            </Text>
          </View>
          {booking.bookingStatus === "pending" && (
            <View className="bg-purple-100 px-3 py-1.5 rounded-full">
              <Text className="text-purple-800 text-xs font-JakartaMedium">
                New Request
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Guest Info */}
      <View className="px-4 pt-4 pb-3 border-b border-gray-100">
        <View className="flex-row items-center">
          <Image
            source={{ uri: guestData?.profileImage }}
            className="w-14 h-14 rounded-full"
          />
          <View className="ml-3 flex-1">
            <Text className="font-JakartaSemiBold text-base text-gray-900">
              {guestData?.firstName} {guestData?.lastName}
            </Text>
            <View className="flex-row items-center mt-1">
              <Text className="text-yellow-500 text-sm mr-1">★</Text>
              <Text className="text-gray-600 font-JakartaRegular text-sm">
                New Guest
              </Text>
            </View>
            {guestData?.phoneVerified && (
              <View className="flex-row items-center mt-1">
                <Text className="text-green-600 text-xs font-medium">
                  ✓ Approved to Drive
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Trip Details */}
      <View className="px-4 py-4 border-b border-gray-100">
        <View className="flex-row">
          <Image
            source={
              carData && carData.images.length > 0
                ? { uri: carData.images[0].url }
                : require("../assets/images/adaptive-icon.png")
            }
            style={{ width: 100, height: 100, borderRadius: 8 }}
          />
          <View className="ml-3 flex-1">
            <Text className="font-JakartaSemiBold text-base text-gray-900 mb-2">
              {carData?.make} {carData?.model} {carData?.year}
            </Text>

            <View className="mb-2">
              <Text className="text-xs text-gray-500 mb-0.5">Pick-up</Text>
              <Text className="text-sm text-gray-900 font-JakartaMedium">
                {formatDate(booking.pickupDate)}
              </Text>
              <Text className="text-xs text-gray-600 font-Jakarta">
                {formatTime(booking.pickupTime)}
              </Text>
            </View>

            <View>
              <Text className="text-xs text-gray-500 mb-0.5">Drop-off</Text>
              <Text className="text-sm text-gray-900 font-JakartaMedium">
                {formatDate(booking.returnDate)}
              </Text>
              <Text className="text-xs text-gray-600 font-Jakarta">
                {formatTime(booking.returnTime)}
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-3 bg-gray-50 p-3 rounded-lg">
          <View className="flex-row justify-between items-center">
            <Text className="text-sm font-JakartaRegular text-gray-600">
              {booking.rentalDays} day{booking.rentalDays > 1 ? "s" : ""}
            </Text>
            <Text className="text-base font-bold text-gray-900">
              ₱
              {(booking.totalAmount / 100).toLocaleString("en-PH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View className="px-4 py-3 flex-row gap-2">
        {booking.bookingStatus === "completed" ? (
          // Show review buttons for completed trips
          <>
            {!booking.hostReviewSubmitted ? (
              <TouchableOpacity
                onPress={handleReviewGuest}
                className="flex-1 bg-primary-500 py-3.5 rounded-lg"
                activeOpacity={0.7}
              >
                <View className="flex-row items-center justify-center gap-2">
                  <MaterialIcons name="star" size={20} color="white" />
                  <Text className="text-center text-white font-JakartaSemiBold">
                    Rate Guest
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
              // Already reviewed
              <View className="flex-1 bg-green-50 py-3.5 rounded-lg border border-green-200">
                <View className="flex-row items-center justify-center gap-2">
                  <MaterialIcons
                    name="check-circle"
                    size={20}
                    color="#16a34a"
                  />
                  <Text className="text-center text-green-700 font-JakartaSemiBold">
                    Review Submitted
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              onPress={() => onManageTrip(booking)}
              className="flex-1 bg-gray-100 py-3.5 rounded-lg"
              activeOpacity={0.7}
            >
              <Text className="text-center text-gray-700 font-JakartaSemiBold">
                View Details
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          // Show default buttons for pending/confirmed trips
          <>
            <TouchableOpacity
              onPress={() => onContactGuest(booking)}
              className="flex-1 bg-gray-100 py-3.5 rounded-lg"
              activeOpacity={0.7}
            >
              <Text className="text-center text-gray-700 font-JakartaSemiBold">
                Contact Guest
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
          </>
        )}
      </View>
    </View>
  );
};

export default BookingCard;
