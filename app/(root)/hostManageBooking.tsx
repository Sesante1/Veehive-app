import { icons } from "@/constants";
import { db } from "@/FirebaseConfig";
import { UserData } from "@/hooks/useUser";
import { fetchAPI } from "@/lib/fetch";
import {
  notifyBookingCancelled,
  notifyGuestBookingSuccess,
} from "@/services/notificationService";
import { CarData } from "@/types/booking.types";
import { formatDate, formatTime } from "@/utils/dateUtils";
import { getTripEndCountdown, getTripStartCountdown } from "@/utils/tripUtils";
import { MaterialIcons, Octicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MyBooking = () => {
  const { booking } = useLocalSearchParams<{ booking: string }>();
  const bookingData = booking ? JSON.parse(booking) : null;
  const [guestData, setGuestData] = useState<UserData | null>(null);
  const [carData, setCarData] = useState<CarData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [ownerData, setOwnerData] = useState<UserData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch guest data
        const guestDoc = await getDoc(doc(db, "users", bookingData.userId));
        if (guestDoc.exists()) {
          setGuestData(guestDoc.data() as UserData);
        }

        // Fetch car data
        const carDoc = await getDoc(doc(db, "cars", bookingData.carId));
        if (carDoc.exists()) {
          setCarData({ id: carDoc.id, ...carDoc.data() } as CarData);
        }

        // Fetch owner data
        const ownerDoc = await getDoc(doc(db, "users", bookingData.hostId));
        if (ownerDoc.exists()) {
          setOwnerData(ownerDoc.data() as UserData);
        }
      } catch (error) {
        console.error("Error fetching booking details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bookingData.userId, bookingData.carId, bookingData.hostId]);

  const handleAccept = async () => {
    Alert.alert(
      "Accept Booking",
      "Are you sure you want to accept this booking? The guest will be charged.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          style: "default",
          onPress: async () => {
            setActionLoading(true);
            try {
              console.log("=== Starting booking acceptance ===");
              console.log("Payment Intent ID:", bookingData.paymentIntentId);
              console.log("Booking ID:", bookingData.id);

              // FIXED: Changed from /accept to /capture
              const response = await fetchAPI("/(api)/(stripe)/accepts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  payment_intent_id: bookingData.paymentIntentId,
                  booking_id: bookingData.id,
                }),
              });

              console.log("Stripe response:", response);

              if (!response.success) {
                throw new Error(response.error || "Failed to capture payment");
              }

              // Update booking status in Firestore
              await updateDoc(doc(db, "bookings", bookingData.id), {
                bookingStatus: "confirmed",
                paymentStatus: "paid",
                updatedAt: serverTimestamp(),
              });

              if (bookingData.carId) {
                const carRef = doc(db, "cars", bookingData.carId);
                await updateDoc(carRef, {
                  status: "on a trip",
                  lastBookedAt: serverTimestamp(),
                });
              }

              console.log("=== Booking updated in Firestore ===");

              // Send notification to guest
              try {
                const ownerName = ownerData
                  ? `${ownerData.firstName} ${ownerData.lastName}`
                  : "The owner";

                await notifyGuestBookingSuccess(
                  bookingData.userId,
                  bookingData.id,
                  {
                    make: carData?.make || "",
                    model: carData?.model || "",
                  },
                  formatDate(bookingData.pickupDate)
                );

                console.log("✅ Guest notified of booking acceptance");
              } catch (notificationError) {
                console.error(
                  "⚠️ Failed to send notification:",
                  notificationError
                );
              }

              Alert.alert("Success", "Booking accepted and payment captured!", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (error) {
              console.error("Error accepting booking:", error);
              Alert.alert(
                "Error",
                error instanceof Error
                  ? error.message
                  : "Failed to accept booking. Please try again."
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDecline = async () => {
    Alert.alert(
      "Decline Booking",
      "Are you sure you want to decline this booking? The payment hold will be released.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Decline",
          style: "destructive",
          onPress: async () => {
            setActionLoading(true);
            try {
              console.log("=== Starting booking decline ===");

              // Cancel the payment intent via Stripe API
              const response = await fetchAPI("/(api)/(stripe)/decline", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  payment_intent_id: bookingData.paymentIntentId,
                  booking_id: bookingData.id,
                  reason: "requested_by_customer",
                }),
              });

              if (!response.success) {
                throw new Error(response.error || "Failed to cancel payment");
              }

              // Update booking status in Firestore
              await updateDoc(doc(db, "bookings", bookingData.id), {
                bookingStatus: "declined",
                paymentStatus: "cancelled",
                updatedAt: serverTimestamp(),
              });

              // Send notification to guest
              try {
                const ownerName = ownerData
                  ? `${ownerData.firstName} ${ownerData.lastName}`
                  : "The owner";

                await notifyBookingCancelled(
                  bookingData.userId,
                  bookingData.id,
                  ownerName,
                  {
                    make: carData?.make || "",
                    model: carData?.model || "",
                  }
                );

                console.log("✅ Guest notified of booking decline");
              } catch (notificationError) {
                console.error(
                  "⚠️ Failed to send notification:",
                  notificationError
                );
              }

              Alert.alert(
                "Success",
                "Booking declined and payment hold released!",
                [{ text: "OK", onPress: () => router.back() }]
              );
            } catch (error) {
              console.error("Error declining booking:", error);
              Alert.alert(
                "Error",
                error instanceof Error
                  ? error.message
                  : "Failed to decline booking. Please try again."
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  const isPending = bookingData.bookingStatus === "pending";
  const isAccepted = bookingData.bookingStatus === "confirmed";

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex justify-between items-center mb-6 pt-4 bg-white px-4">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center active:bg-gray-200 absolute left-4 top-2"
        >
          <Image source={icons.backArrow} style={{ width: 20, height: 20 }} />
        </Pressable>

        <Text className="text-lg font-JakartaSemiBold text-gray-900 text-center">
          Details
        </Text>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 px-4">
        <View className="flex-row items-center gap-6 mb-16">
          <Image
            source={
              carData && carData.images.length > 0
                ? { uri: carData.images[0].url }
                : require("../../assets/images/adaptive-icon.png")
            }
            style={{ width: 140, height: 120, borderRadius: 8 }}
          />
          <View>
            <Text className="font-JakartaSemiBold text-xl">Booked Trip</Text>
            <Text className="font-JakartaSemiBold text-lg mt-3">
              {carData?.make + " " + carData?.model + " " + carData?.year}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-14 justify-center items-center">
          <View className="items-center">
            <Text className="font-JakartaBold text-2xl">
              {formatDate(bookingData.pickupDate)}
            </Text>
            <Text className="font-JakartaSemiBold text-1xl">
              {formatTime(bookingData.pickupTime)}
            </Text>
          </View>
          <Octicons name="dash" size={20} color={"black"} />
          <View className="items-center">
            <Text className="font-JakartaBold text-2xl">
              {formatDate(bookingData.returnDate)}
            </Text>
            <Text className="font-JakartaSemiBold text-1xl">
              {formatTime(bookingData.returnTime)}
            </Text>
          </View>
        </View>

        <View className="mt-10">
          <Text className="font-JakartaSemiBold text-secondary-700 text-lg">
            Location
          </Text>
          <Text className="font-JakartaSemiBold">
            {bookingData?.location?.address}
          </Text>
        </View>

        {/* Status Badge */}
        <View className="mt-10 p-4 bg-secondary-100 rounded-lg">
          <Text className="font-JakartaMedium text-[14px] color-secondary-700">
            Booking Status
          </Text>
          <Text className="font-JakartaBold text-lg mt-1 color-primary-500">
            {bookingData.bookingStatus.toUpperCase()}
          </Text>
        </View>

        {/* Accept/Decline Buttons - Only show if pending */}
        {isPending && (
          <View className="mt-10 p-4 border border-gray-300 rounded-lg">
            <TouchableOpacity
              className="w-full bg-primary-500 rounded-lg py-4 my-5 items-center"
              onPress={handleAccept}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="font-JakartaSemiBold text-lg text-white">
                  Accept
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              className="w-full border border-gray-300 rounded-lg py-4 items-center"
              onPress={handleDecline}
              disabled={actionLoading}
            >
              <Text className="font-JakartaSemiBold text-lg">Decline</Text>
            </TouchableOpacity>
          </View>
        )}

        {isAccepted && (
          <View className="mt-10 p-4 border border-gray-300 rounded-lg">
            <Text className="mb-6 font-JakartaSemiBold text-secondary-700">
              {new Date() >= new Date(bookingData.pickupDate)
                ? getTripEndCountdown(bookingData.returnDate)
                : getTripStartCountdown(bookingData.pickupDate)}
            </Text>

            <TouchableOpacity
              className="w-full border border-gray-300 rounded-lg py-4 items-center"
              onPress={() => {}}
              disabled={actionLoading}
            >
              <Text className="font-JakartaSemiBold text-lg">
               Car received
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="w-full border border-gray-300 rounded-lg py-4 items-center mt-6"
              onPress={() => {}}
              disabled={actionLoading}
            >
              <Text className="font-JakartaSemiBold text-lg">
                Report damage
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View className="mt-10">
          <Text className="font-JakartaSemiBold text-lg mb-1">Your Guest</Text>
          <Text className="font-JakartaMedium text-secondary-700">
            This is the primary driver and they must be present for pickup and
            drop-off
          </Text>
          <View className="flex-row items-center border border-gray-200 p-6 mt-5 gap-5 rounded-lg">
            <View className="relative flex justify-center items-center">
              <Image
                source={{ uri: guestData?.profileImage }}
                style={{ width: 80, height: 80, borderRadius: 40 }}
              />
              <View className="bg-white border border border-gray-100 rounded-full flex-row justify-center items-center py-2 px-5 absolute -bottom-3">
                <Text className="font-Jakarta">5.0</Text>
                <MaterialIcons name="star" size={20} color={"#FFDF00"} />
              </View>
            </View>

            <View>
              <Text className="text-2xl font-JakartaMedium">
                {guestData?.firstName + " " + guestData?.lastName}
              </Text>
              <Text className="mt-2 font-JakartaMedium text-secondary-500">
                Joined .{" "}
                {guestData?.createdAt?.toDate().toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MyBooking;
