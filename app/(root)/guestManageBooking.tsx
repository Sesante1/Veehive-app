import ConfirmationModal from "@/components/ConfirmationModal";
import { icons } from "@/constants";
import { db } from "@/FirebaseConfig";
import { UserData } from "@/hooks/useUser";
import { fetchAPI } from "@/lib/fetch";
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

const GuestBooking = () => {
  const { booking } = useLocalSearchParams<{ booking?: string }>();
  let parsedBooking: any = null;
  try {
    parsedBooking = booking ? JSON.parse(booking) : null;
  } catch {
    parsedBooking = null;
  }
  const bookingData = parsedBooking;

  const [hostData, setHostData] = useState<UserData | null>(null);
  const [carData, setCarData] = useState<CarData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [GuestData, setOwnerData] = useState<UserData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [onConfirmAction, setOnConfirmAction] = useState<() => void>(() => {});

  if (!bookingData) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="font-JakartaSemiBold text-lg">
          Booking details not available.
        </Text>
      </SafeAreaView>
    );
  }

  useEffect(() => {
    if (!bookingData) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch host data
        const hostDoc = await getDoc(doc(db, "users", bookingData.hostId));
        if (hostDoc.exists()) {
          setHostData(hostDoc.data() as UserData);
        }

        // Fetch car data
        const carDoc = await getDoc(doc(db, "cars", bookingData.carId));
        if (carDoc.exists()) {
          setCarData({ id: carDoc.id, ...carDoc.data() } as CarData);
        }

        // Fetch owner data
        const ownerDoc = await getDoc(doc(db, "users", bookingData.userId));
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
  }, [booking]);

  const calculateRefundAmount = () => {
    const now = new Date();
    const pickupDate = new Date(bookingData.pickupDate);
    const hoursUntilPickup =
      (pickupDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    const totalAmount = bookingData.totalAmount / 100;

    // If trip has started, no refund
    if (now >= pickupDate) {
      return { amount: 0, percentage: 0 };
    }

    // If more than 24 hours before pickup, full refund
    if (hoursUntilPickup >= 24) {
      return { amount: totalAmount, percentage: 100 };
    }

    // If less than 24 hours, no refund (or partial based on policy)
    return { amount: 0, percentage: 0 };
  };

  const handleCancelTrip = async () => {
    const { amount: refundAmount, percentage: refundPercentage } =
      calculateRefundAmount();
    const now = new Date();
    const pickupDate = new Date(bookingData.pickupDate);
    const isPending = bookingData.bookingStatus === "pending";
    const isConfirmed = bookingData.bookingStatus === "confirmed";

    let alertMessage = "";
    if (isPending) {
      alertMessage =
        "Your booking is still pending. If you cancel now, the payment authorization will be released and you won't be charged.";
    } else if (now >= pickupDate) {
      alertMessage =
        "Your trip has already started. According to our policy, no refunds can be issued once the trip begins.";
    } else if (refundPercentage === 100) {
      alertMessage = `You're canceling more than 24 hours before your trip. You'll receive a full refund of ₱${refundAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}.`;
    } else {
      alertMessage =
        "You're canceling less than 24 hours before your trip start time. According to our policy, no refund will be issued.";
    }

    setModalTitle("Cancel Booking");
    setModalMessage(
      `${alertMessage}\n\nDo you want to continue with cancellation?`
    );
    setModalVisible(true);

    // Define what happens when user confirms
    setOnConfirmAction(() => async () => {
      setModalVisible(false);
      setActionLoading(true);
      try {
        console.log("=== Starting booking cancellation ===");
        console.log("Booking Status:", bookingData.bookingStatus);
        console.log("Payment Status:", bookingData.paymentStatus);
        console.log("Refund Amount:", refundAmount);

        if (isPending && bookingData.paymentStatus === "authorized") {
          // Cancel the authorization
          const response = await fetchAPI("/(api)/(stripe)/decline", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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

          setModalTitle("Success");
          setModalMessage("Booking cancelled. No charges applied.");
          setModalVisible(true);
          setOnConfirmAction(() => () => router.back());
        } else if (isConfirmed && bookingData.paymentStatus === "paid") {
          if (refundAmount > 0) {
            const refundResponse = await fetchAPI("/(api)/(stripe)/refund", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
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
                status: "available",
                updatedAt: serverTimestamp(),
              });
            }

            setModalTitle("Refund Processed");
            setModalMessage(
              `Your booking has been cancelled and ₱${refundAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })} has been refunded.`
            );
            setModalVisible(true);
            setOnConfirmAction(() => () => router.back());
          } else {
            await updateDoc(doc(db, "bookings", bookingData.id), {
              bookingStatus: "cancelled",
              cancelledBy: "guest",
              cancelledAt: serverTimestamp(),
              cancellationReason:
                "Guest cancelled - No refund (less than 24hrs)",
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

            setModalTitle("Booking Cancelled");
            setModalMessage(
              "Your booking has been cancelled. No refund issued per cancellation policy."
            );
            setModalVisible(true);
            setOnConfirmAction(() => () => router.back());
          }
        }
      } catch (error) {
        console.error("Error cancelling booking:", error);
        setModalTitle("Error");
        setModalMessage(
          error instanceof Error
            ? error.message
            : "Failed to cancel booking. Please try again."
        );
        setModalVisible(true);
        setOnConfirmAction(() => () => setModalVisible(false));
      } finally {
        setActionLoading(false);
      }
    });
  };

  const handleCheckIn = async () => {};

  const handleCheckOut = async () => {};

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  const isPending = bookingData.bookingStatus === "pending";
  const isConfirmed = bookingData.bookingStatus === "confirmed";
  const isCancelled = bookingData.bookingStatus === "cancelled";

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
            <Text className="font-JakartaSemiBold text-xl">
              {bookingData.bookingStatus === "pending"
                ? "Booked Trip"
                : bookingData.bookingStatus === "completed"
                  ? "Completed Trip"
                  : bookingData.bookingStatus === "cancelled"
                    ? "Cancelled Trip"
                    : "Booked Trip"}
            </Text>
            <Text className="font-JakartaSemiBold text-lg mt-3">
              {carData?.make + " " + carData?.model + " " + carData?.year}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-14 justify-center items-center">
          <View className="items-center">
            <Text
              className={`font-JakartaBold text-2xl ${
                bookingData.bookingStatus === "cancelled" ? "line-through" : ""
              }`}
              style={{
                color:
                  bookingData.bookingStatus === "cancelled" ? "#999" : "black",
              }}
            >
              {formatDate(bookingData.pickupDate)}
            </Text>
            <Text
              className={`font-JakartaSemiBold text-1xl ${
                bookingData.bookingStatus === "cancelled" ? "line-through" : ""
              }`}
              style={{
                color:
                  bookingData.bookingStatus === "cancelled" ? "#999" : "black",
              }}
            >
              {formatTime(bookingData.pickupTime)}
            </Text>
          </View>
          <Octicons
            name="dash"
            size={20}
            color={bookingData.bookingStatus === "cancelled" ? "#999" : "black"}
          />
          <View className="items-center">
            <Text
              className={`font-JakartaBold text-2xl ${
                bookingData.bookingStatus === "cancelled" ? "line-through" : ""
              }`}
              style={{
                color:
                  bookingData.bookingStatus === "cancelled" ? "#999" : "black",
              }}
            >
              {formatDate(bookingData.returnDate)}
            </Text>
            <Text
              className={`font-JakartaSemiBold text-1xl ${
                bookingData.bookingStatus === "cancelled" ? "line-through" : ""
              }`}
              style={{
                color:
                  bookingData.bookingStatus === "cancelled" ? "#999" : "black",
              }}
            >
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

        {!isCancelled && (
          <View className="mt-10 p-4 border border-gray-300 rounded-lg">
            {isConfirmed && (
              <Text className="mb-6 font-JakartaSemiBold text-secondary-700">
                {new Date() >= new Date(bookingData.pickupDate)
                  ? getTripEndCountdown(bookingData.returnDate)
                  : getTripStartCountdown(bookingData.pickupDate)}
              </Text>
            )}

            <TouchableOpacity
              className="w-full border border-red-500 rounded-lg py-4 items-center"
              onPress={handleCancelTrip}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="#EF4444" />
              ) : (
                <Text className="font-JakartaSemiBold text-lg text-red-500">
                  Cancel Trip
                </Text>
              )}
            </TouchableOpacity>

            {isConfirmed && (
              <TouchableOpacity
                className="w-full border border-gray-300 rounded-lg py-4 items-center mt-6"
                onPress={handleCheckIn}
                disabled={actionLoading}
              >
                <Text className="font-JakartaSemiBold text-lg">
                  Check In & Start Trip
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View className="mt-10">
          <Text className="font-JakartaSemiBold text-lg mb-1">Your Host</Text>
          <Text className="font-JakartaMedium text-secondary-700">
            This is your assigned host who will facilitate the vehicle handover
            during pickup and drop-off.
          </Text>
          <View className="flex-row items-center border border-gray-200 p-6 mt-5 gap-5 rounded-lg">
            <View className="relative flex justify-center items-center">
              <Image
                source={{ uri: hostData?.profileImage }}
                style={{ width: 80, height: 80, borderRadius: 40 }}
              />
              <View className="bg-white border border border-gray-100 rounded-full flex-row justify-center items-center py-2 px-5 absolute -bottom-3">
                <Text className="font-Jakarta">5.0</Text>
                <MaterialIcons name="star" size={20} color={"#FFDF00"} />
              </View>
            </View>

            <View>
              <Text className="text-2xl font-JakartaMedium">
                {hostData?.firstName + " " + hostData?.lastName}
              </Text>
              <Text className="mt-2 font-JakartaMedium text-secondary-500">
                Joined .{" "}
                {hostData?.createdAt?.toDate().toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-10">
          <Text className="font-JakartaMedium text-secondary-700 text-lg">
            TRIP INFO
          </Text>
          <View className="mt-4 py-5 border-t border-b border-gray-200 flex-row justify-between">
            <Text className="font-JakartaMedium">Trip photos</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  router.push({
                    pathname: "/TripPhotosReviewScreen",
                    params: { bookingId: bookingData.id },
                  });
                }}
              >
                <Text className="font-JakartaSemiBold text-secondary-600">
                  VIEW ALL
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const now = new Date();
                  const pickupDate = new Date(bookingData.pickupDate);
                  const returnDate = new Date(bookingData.returnDate);

                  // Check-in photos: Available from 24 hours before pickup until pickup time
                  const hoursUntilPickup =
                    (pickupDate.getTime() - now.getTime()) / (1000 * 60 * 60);
                  const canCheckIn =
                    hoursUntilPickup <= 24 && now < pickupDate && isConfirmed;

                  // Check-out photos: Available from return time until 24 hours after
                  const hoursSinceReturn =
                    (now.getTime() - returnDate.getTime()) / (1000 * 60 * 60);
                  const canCheckOut =
                    now >= returnDate && hoursSinceReturn <= 24 && isConfirmed;

                  if (!canCheckIn && !canCheckOut) {
                    if (!isConfirmed) {
                      Alert.alert(
                        "Not Available",
                        "Trip photos are only available for confirmed bookings."
                      );
                    } else if (hoursUntilPickup > 24) {
                      Alert.alert(
                        "Not Available Yet",
                        "Check-in photos can be added starting 24 hours before your trip starts."
                      );
                    } else if (now >= pickupDate && now < returnDate) {
                      Alert.alert(
                        "Trip In Progress",
                        "Check-in photos can only be added before the trip starts. Check-out photos will be available after the trip ends."
                      );
                    } else if (hoursSinceReturn > 24) {
                      Alert.alert(
                        "Time Expired",
                        "The 24-hour window to submit check-out photos has passed."
                      );
                    }
                    return;
                  }

                  const photoType = canCheckIn ? "checkin" : "checkout";
                  router.push({
                    pathname: "/TripPhotosScreen",
                    params: {
                      bookingId: bookingData.id,
                      photoType,
                      userRole: "guest",
                    },
                  });
                }}
              >
                <Text className="font-JakartaSemiBold text-primary-500">
                  ADD PHOTOS
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View className="py-5 border-b border-gray-200 flex-row justify-between items-center">
            <View>
              <Text className="font-JakartaMedium">Total:</Text>
              <Text className="font-JakartaMedium">
                ₱
                {(bookingData?.totalAmount / 100).toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>

            <TouchableOpacity
              className="font-JakartaSemiBold text-primary-500"
              onPress={() => {
                router.push({
                  pathname: "/receiptScreen",
                  params: {
                    booking: JSON.stringify(bookingData),
                    userRole: "guest",
                  },
                });
              }}
            >
              <Text>VIEW RECEIPT</Text>
            </TouchableOpacity>
          </View>

          <View className="py-5 border-b border-gray-200 flex-row justify-between items-center">
            <Text className="font-JakartaMedium">Cancellation policy</Text>

            <TouchableOpacity
              onPress={() => router.push("/CancellationPolicyScreen")}
            >
              <Text className="font-JakartaSemiBold text-primary-500">
                REVIEW
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <ConfirmationModal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        confirmText="OK"
        cancelText="Cancel"
        onConfirm={onConfirmAction}
        onCancel={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
};

export default GuestBooking;
