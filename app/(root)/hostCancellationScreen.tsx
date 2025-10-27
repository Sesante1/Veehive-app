import { useCustomAlert } from "@/components/CustomAlert";
import { icons } from "@/constants";
import { db, FIREBASE_AUTH } from "@/FirebaseConfig";
import { fetchAPI } from "@/lib/fetch";
import { notifyGuestBookingCancelled } from "@/services/notificationService";
import { decode as atob } from "base-64";
import { router, useLocalSearchParams } from "expo-router";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HostCancellationScreen() {
  const { booking } = useLocalSearchParams<{ booking?: string }>();
  const [actionLoading, setActionLoading] = useState(false);
  const { showAlert, AlertComponent } = useCustomAlert();

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

  const totalAmount = bookingData.totalAmount / 100;
  const isConfirmed = bookingData.bookingStatus === "confirmed";

  const handleCancelBooking = async () => {
    setActionLoading(true);
    try {
      console.log("=== Host cancelling booking ===");

      if (isConfirmed && bookingData.paymentStatus === "paid") {
        // Full refund for host cancellation
        const currentUser = FIREBASE_AUTH.currentUser;
        if (!currentUser) throw new Error("Not authenticated");
        const idToken = await currentUser.getIdToken();
        const refundResponse = await fetchAPI("/(api)/(stripe)/refund", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            payment_intent_id: bookingData.paymentIntentId,
            amount: bookingData.totalAmount,
            reason: "requested_by_customer",
          }),
        });

        if (!refundResponse.success)
          throw new Error("Failed to process refund");

        await updateDoc(doc(db, "bookings", bookingData.id), {
          bookingStatus: "cancelled",
          cancelledBy: "Host",
          cancelledAt: serverTimestamp(),
          cancellationReason: "Host cancelled - Full refund issued",
          refundStatus: refundResponse.refund.status,
          refundAmount: refundResponse.refund.amount / 100,
          refundPercentage: 100,
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

        await notifyGuestBookingCancelled(
          bookingData.userId,
          bookingData.id,
          bookingData.hostName || "The owner",
          {
            make: bookingData.carMake || "",
            model: bookingData.carModel || "",
          }
        );

        showAlert({
          title: "Booking Cancelled",
          message: `₱${totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })} has been refunded to the guest.`,
          icon: "checkmark-circle",
          iconColor: "#10B981",
          buttons: [
            {
              text: "OK",
              style: "default",
              onPress: () => router.back(),
            },
          ],
        });
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      showAlert({
        title: "Error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to cancel booking. Please try again.",
        icon: "alert-circle",
        iconColor: "#EF4444",
        buttons: [{ text: "OK", style: "default" }],
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
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
                {bookingData.guestName || "Guest"}
              </Text>
              <Text className="font-JakartaBold text-xl mt-1">
                {bookingData.carMake} {bookingData.carModel}{" "}
                {bookingData.carYear}
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

          {/* Warning Message */}
          <View className="mt-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <Text className="font-JakartaBold text-red-900 text-base mb-2">
              ⚠️ Important Notice
            </Text>
            <Text className="font-JakartaMedium text-red-800 text-sm leading-5">
              As a host, cancelling confirmed bookings may affect your
              performance rating and reliability score. Please only cancel when
              absolutely necessary.
            </Text>
          </View>

          {/* Policy Info */}
          <View className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <Text className="font-JakartaSemiBold text-blue-900 text-base mb-2">
              Host Cancellation Policy
            </Text>
            <Text className="font-JakartaMedium text-blue-800 text-sm leading-5">
              When you cancel a confirmed booking, the guest will receive a 100%
              refund automatically. The guest will be notified immediately about
              the cancellation.
            </Text>
          </View>

          {/* Cost Breakdown */}
          <View className="mt-8">
            <View className="flex-row justify-between border-t border-gray-200 py-4">
              <Text className="font-JakartaSemiBold text-secondary-700">
                Booking Amount
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
                Refund to Guest
              </Text>
              <Text className="font-JakartaSemiBold text-green-600">
                ₱
                {totalAmount.toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>

            <View className="flex-row justify-between py-4">
              <Text className="font-JakartaBold text-lg">Your Earnings</Text>
              <Text className="font-JakartaBold text-lg text-red-600">
                ₱0.00
              </Text>
            </View>
          </View>

          {/* Refund Information */}
          <View className="mt-4 bg-gray-50 rounded-lg p-4">
            <Text className="font-JakartaMedium text-secondary-700 text-sm leading-5">
              The guest will receive a full refund within 5-10 business days.
              You will not receive any earnings from this booking.
            </Text>
          </View>

          {/* Consequences */}
          <View className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <Text className="font-JakartaSemiBold text-yellow-900 text-sm mb-2">
              Consequences of Cancellation:
            </Text>
            <Text className="font-JakartaMedium text-yellow-800 text-xs leading-5">
              • Your reliability score may be affected{"\n"}• Frequent
              cancellations may impact your listing visibility{"\n"}• The guest
              will be immediately notified{"\n"}• Your calendar will be reopened
              for this time slot
            </Text>
          </View>

          {/* Cancel Button */}
          <View className="mt-10 mb-6">
            <TouchableOpacity
              className="w-full bg-red-500 rounded-lg py-4 items-center"
              onPress={handleCancelBooking}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="font-JakartaSemiBold text-lg text-white">
                  Yes, Cancel Booking
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="w-full border border-gray-300 rounded-lg py-4 items-center mt-4"
              onPress={() => router.back()}
              disabled={actionLoading}
            >
              <Text className="font-JakartaSemiBold text-lg text-gray-700">
                Keep Booking
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
      <AlertComponent />
    </>
  );
}
