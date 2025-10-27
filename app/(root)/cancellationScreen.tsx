import { icons } from "@/constants";
import { db, FIREBASE_AUTH } from "@/FirebaseConfig";
import { fetchAPI } from "@/lib/fetch";
import { decode as atob } from "base-64";
import { router, useLocalSearchParams } from "expo-router";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import React, { useState } from "react";
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

export default function CancellationScreen() {
  const { booking } = useLocalSearchParams<{ booking?: string }>();
  const [actionLoading, setActionLoading] = useState(false);

  let bookingData: any = null;
  try {
    bookingData = booking ? JSON.parse(booking) : null;
  } catch {
    bookingData = null;
  }

  const imageUrl = bookingData.carImage
    ? atob(bookingData.carImage as string)
    : null;

  if (!bookingData) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="font-JakartaSemiBold text-lg">
          Booking details not available.
        </Text>
      </SafeAreaView>
    );
  }

  // Calculate refund amount
  const calculateRefundAmount = () => {
    const now = new Date();

    const pickupDateTime = new Date(bookingData.pickupTime);
    const hoursUntilPickup =
      (pickupDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const totalAmount = bookingData.totalAmount / 100;

    // If trip has started, no refund
    if (now >= pickupDateTime) {
      return { amount: 0, percentage: 0 };
    }

    if (hoursUntilPickup >= 24) {
      // More than 24 hours: Full refund
      return { amount: totalAmount, percentage: 100 };
    } else if (hoursUntilPickup >= 12) {
      // 12-24 hours: 75% refund
      return { amount: totalAmount * 0.75, percentage: 75 };
    } else if (hoursUntilPickup >= 6) {
      // 6-12 hours: 50% refund
      return { amount: totalAmount * 0.5, percentage: 50 };
    } else {
      // Less than 6 hours: 25% refund
      return { amount: totalAmount * 0.25, percentage: 25 };
    }
  };

  const { amount: refundAmount, percentage: refundPercentage } =
    calculateRefundAmount();
  const totalAmount = bookingData.totalAmount / 100;

  const isPending = bookingData.bookingStatus === "pending";
  const nonRefundableAmount = isPending ? 0 : totalAmount - refundAmount;

  const handleCancelTrip = async () => {
    setActionLoading(true);
    try {
      const now = new Date();
      const pickupDateTime = new Date(bookingData.pickupTime);
      const isPending = bookingData.bookingStatus === "pending";
      const isConfirmed = bookingData.bookingStatus === "confirmed";

      if (isPending && bookingData.paymentStatus === "authorized") {
        // Cancel the authorization
        const idToken = await FIREBASE_AUTH.currentUser?.getIdToken();
        const response = await fetchAPI("/(api)/(stripe)/decline", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            payment_intent_id: bookingData.paymentIntentId,
            booking_id: bookingData.id,
            reason: "requested_by_customer",
          }),
        });

        if (!response.success)
          throw new Error("Failed to cancel payment authorization");

        await updateDoc(doc(db, "bookings", bookingData.id), {
          bookingStatus: "cancelled",
          paymentStatus: "cancelled",
          cancelledBy: "guest",
          cancelledAt: serverTimestamp(),
          cancellationReason: "Guest cancelled before host acceptance",
          updatedAt: serverTimestamp(),
        });

        Alert.alert("Success", "Booking cancelled. No charges applied.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else if (isConfirmed && bookingData.paymentStatus === "paid") {
        if (refundAmount > 0) {
          const idToken = await FIREBASE_AUTH.currentUser?.getIdToken();
          const refundResponse = await fetchAPI("/(api)/(stripe)/refund", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              payment_intent_id: bookingData.paymentIntentId,
              amount: refundAmount,
              reason: "requested_by_customer",
            }),
          });

          if (!refundResponse.success)
            throw new Error("Failed to process refund");

          await updateDoc(doc(db, "bookings", bookingData.id), {
            bookingStatus: "cancelled",
            cancelledBy: "guest",
            cancelledAt: serverTimestamp(),
            cancellationReason: `Guest cancelled - ${refundPercentage}% refund`,
            refundStatus: refundResponse.refund.status,
            refundAmount: refundResponse.refund.amount / 100,
            refundPercentage,
            refundId: refundResponse.refund.id,
            refundProcessedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          if (bookingData.carId) {
            await updateDoc(doc(db, "cars", bookingData.carId), {
              status: "active",
              updatedAt: serverTimestamp(),
            });
          }

          Alert.alert(
            "Refund Processed",
            `Your booking has been cancelled and ₱${refundAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })} has been refunded.`,
            [{ text: "OK", onPress: () => router.back() }]
          );
        } else {
          await updateDoc(doc(db, "bookings", bookingData.id), {
            bookingStatus: "cancelled",
            cancelledBy: "guest",
            cancelledAt: serverTimestamp(),
            cancellationReason: "Guest cancelled - No refund (less than 24hrs)",
            refundStatus: "none",
            refundAmount: 0,
            refundPercentage: 0,
            updatedAt: serverTimestamp(),
          });

          if (bookingData.carId) {
            await updateDoc(doc(db, "cars", bookingData.carId), {
              status: "active",
              updatedAt: serverTimestamp(),
            });
          }

          Alert.alert(
            "Booking Cancelled",
            "Your booking has been cancelled. No refund issued per cancellation policy.",
            [{ text: "OK", onPress: () => router.back() }]
          );
        }
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to cancel booking. Please try again."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Get cancellation policy message
  const getCancellationMessage = () => {
    const now = new Date();
    const pickupDateTime = new Date(bookingData.pickupTime);
    const hoursUntilPickup =
      (pickupDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (bookingData.bookingStatus === "pending") {
      return "Your booking is still pending. If you cancel now, the payment authorization will be released and you won't be charged.";
    } else if (now >= pickupDateTime) {
      return "Your trip has already started. According to our policy, no refunds can be issued once the trip begins.";
    } else if (hoursUntilPickup >= 24) {
      return "You're canceling more than 24 hours before your trip. You'll receive a full refund (100%).";
    } else if (hoursUntilPickup >= 12) {
      return `You're canceling 12-24 hours before your trip. You'll receive a ${refundPercentage}% refund (₱${refundAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}).`;
    } else if (hoursUntilPickup >= 6) {
      return `You're canceling 6-12 hours before your trip. You'll receive a ${refundPercentage}% refund (₱${refundAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}).`;
    } else {
      return `You're canceling less than 6 hours before your trip. You'll receive a ${refundPercentage}% refund (₱${refundAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}).`;
    }
  };

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
      </View>

      <ScrollView className="flex-1 px-4">
        <View className="flex-1">
          <Text className="font-JakartaBold text-3xl mt-6">Cancel Trip</Text>
        </View>

        {/* Car Info Section */}
        <View className="flex-row justify-between mt-4 items-center">
          <View className="flex-1 pr-4">
            <Text className="font-JakartaSemiBold text-secondary-700 text-sm">
              {bookingData.hostName || "Host's Vehicle"}
            </Text>
            <Text className="font-JakartaBold text-xl mt-1">
              {bookingData.carMake} {bookingData.carModel} {bookingData.carYear}
            </Text>
          </View>

          <Image
            source={
              bookingData.carImage
                ? { uri: imageUrl }
                : require("../../assets/images/adaptive-icon.png")
            }
            style={{ width: 120, height: 80, borderRadius: 8 }}
          />
        </View>

        {/* Cancellation Policy Message */}
        <View className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <Text className="font-JakartaMedium text-secondary-700 text-sm leading-5">
            {getCancellationMessage()}
          </Text>
        </View>

        {/* Cost Breakdown */}
        <View className="mt-8">
          <View className="flex-row justify-between border-t border-gray-200 py-4">
            <Text className="font-JakartaSemiBold text-secondary-700">
              {isPending ? "Booking amount (not charged)" : "Trip cost"}
            </Text>
            <Text className="font-JakartaSemiBold text-secondary-700">
              ₱
              {totalAmount.toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}
            </Text>
          </View>

          <View className="flex-row justify-between border-b border-gray-200 py-4">
            <Text className="font-JakartaSemiBold text-secondary-700">
              {isPending ? "Amount you'll be charged" : "Non-refundable amount"}
            </Text>
            <Text
              className={`font-JakartaSemiBold ${isPending ? "text-green-600" : "text-red-600"}`}
            >
              {isPending
                ? "₱0.00"
                : `-₱${nonRefundableAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
            </Text>
          </View>

          <View className="flex-row justify-between py-4">
            <Text className="font-JakartaBold text-lg">
              {isPending ? "Total charges" : "Your trip refund"}
            </Text>
            <Text className="font-JakartaBold text-lg text-green-600">
              ₱
              {isPending
                ? "0.00"
                : refundAmount.toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                  })}
            </Text>
          </View>
        </View>

        {/* Refund Information */}
        <View className="mt-4 bg-gray-50 rounded-lg p-4">
          <Text className="font-JakartaMedium text-secondary-700 text-sm leading-5">
            Your refund is automatically determined by our cancellation policy.
            {refundAmount > 0 &&
              " Refunds typically take 5-10 business days to appear in your account."}
          </Text>
        </View>

        {/* View Policy Link */}
        <View className="items-center mt-6">
          <TouchableOpacity
            onPress={() => router.push("/CancellationPolicyScreen")}
          >
            <Text className="font-JakartaSemiBold text-primary-500 text-base">
              View cancellation policy
            </Text>
          </TouchableOpacity>
        </View>

        {/* Cancel Button */}
        <View className="mt-10 mb-6">
          <TouchableOpacity
            className="w-full bg-red-500 rounded-lg py-4 items-center"
            onPress={handleCancelTrip}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="font-JakartaSemiBold text-lg text-white">
                Confirm Cancellation
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="w-full border border-gray-300 rounded-lg py-4 items-center mt-4"
            onPress={() => router.back()}
            disabled={actionLoading}
          >
            <Text className="font-JakartaSemiBold text-lg text-gray-700">
              Keep Trip
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
