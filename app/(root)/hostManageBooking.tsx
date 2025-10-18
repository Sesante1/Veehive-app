import ConfirmationModal from "@/components/ConfirmationModal";
import { icons } from "@/constants";
import { db, FIREBASE_AUTH } from "@/FirebaseConfig";
import { UserData } from "@/hooks/useUser";
import { fetchAPI } from "@/lib/fetch";
import {
  notifyGuestBookingdeclined,
  notifyGuestBookingSuccess,
  notifyGuestTripCompleted,
} from "@/services/notificationService";
import { CarData } from "@/types/booking.types";
import { formatDate, formatTime } from "@/utils/dateUtils";
import { getTripEndCountdown, getTripStartCountdown } from "@/utils/tripUtils";
import { MaterialIcons, Octicons } from "@expo/vector-icons";
import { encode as btoa } from "base-64";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  doc,
  getDoc,
  increment,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
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

const HostBooking = () => {
  const { booking } = useLocalSearchParams<{ booking?: string }>();
  let initialBooking: any = null;
  try {
    initialBooking = booking ? JSON.parse(booking) : null;
  } catch {
    initialBooking = null;
  }

  // Create state for real-time booking data
  const [bookingData, setBookingData] = useState<any>(initialBooking);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [guestData, setGuestData] = useState<UserData | null>(null);
  const [carData, setCarData] = useState<CarData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [ownerData, setOwnerData] = useState<UserData | null>(null);
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    confirmText: string;
    confirmColor?: string;
    onConfirm: () => void;
  }>({
    title: "",
    message: "",
    confirmText: "",
    onConfirm: () => {},
  });

  useEffect(() => {
    if (!initialBooking?.id) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "bookings", initialBooking.id),
      (docSnap) => {
        if (docSnap.exists()) {
          setBookingData({ id: docSnap.id, ...docSnap.data() });
        }
      },
      (error) => {
        console.error("Error listening to booking updates:", error);
      }
    );

    return () => unsubscribe();
  }, [initialBooking?.id]);

  // Live countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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

  if (!bookingData) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="font-JakartaSemiBold text-lg">
          Booking details not available.
        </Text>
      </SafeAreaView>
    );
  }

  const handleAccept = () => {
    setModalConfig({
      title: "Accept Booking",
      message:
        "Are you sure you want to accept this booking? The guest will be charged.",
      confirmText: "Accept",
      confirmColor: "#007bff",
      onConfirm: handleAcceptConfirm,
    });
    setModalVisible(true);
  };

  const handleAcceptConfirm = async () => {
    setModalVisible(false);
    setActionLoading(true);
    try {
      console.log("=== Starting booking acceptance ===");

      const idToken = await FIREBASE_AUTH.currentUser?.getIdToken();
      const response = await fetchAPI("/(api)/(stripe)/accepts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          payment_intent_id: bookingData.paymentIntentId,
          booking_id: bookingData.id,
        }),
      });

      if (!response.success)
        throw new Error(response.error || "Failed to capture payment");

      // Update booking
      await updateDoc(doc(db, "bookings", bookingData.id), {
        bookingStatus: "confirmed",
        paymentStatus: "paid",
        updatedAt: serverTimestamp(),
      });

      if (bookingData.carId) {
        await updateDoc(doc(db, "cars", bookingData.carId), {
          status: "reserved",
          lastBookedAt: serverTimestamp(),
        });
      }

      // Notify guest
      await notifyGuestBookingSuccess(
        bookingData.userId,
        bookingData.id,
        { make: carData?.make || "", model: carData?.model || "" },
        bookingData.pickupDate
      );

      Alert.alert("Success", "Booking accepted and payment captured!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Error accepting booking:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to accept booking. Please try again.";

      Alert.alert("Error", errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = () => {
    setModalConfig({
      title: "Decline Booking Request",
      message:
        "Are you sure you want to decline this booking request? The renter will not be charged and the payment authorization will be released.",
      confirmText: "Decline",
      confirmColor: "#dc2626",
      onConfirm: handleDeclineConfirm,
    });
    setModalVisible(true);
  };

  const handleDeclineConfirm = async () => {
    setModalVisible(false);
    setActionLoading(true);
    try {
      console.log("=== Starting booking decline ===");

      if (bookingData.paymentStatus === "authorized") {
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

        if (!response.success) throw new Error("Failed to cancel payment");

        await updateDoc(doc(db, "bookings", bookingData.id), {
          bookingStatus: "cancelled",
          paymentStatus: "cancelled",
          cancelledBy: "host",
          cancelledAt: serverTimestamp(),
          cancellationReason: "Host declined booking request",
          updatedAt: serverTimestamp(),
        });

        // Notify guest
        const ownerName = ownerData
          ? `${ownerData.firstName} ${ownerData.lastName}`
          : "The owner";

        await notifyGuestBookingdeclined(
          bookingData.userId,
          bookingData.id,
          ownerName,
          { make: carData?.make || "", model: carData?.model || "" }
        );

        Alert.alert("Booking Declined", "The guest was not charged.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      console.error("Error declining booking:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to decline booking. Please try again.";

      Alert.alert("Error", errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReturn = async () => {
    setActionLoading(true);
    try {
      let chargeResponse = null;

      // Check for late fees
      if (bookingData.lateReturn && bookingData.lateFee > 0) {
        const idToken = await FIREBASE_AUTH.currentUser?.getIdToken();
        chargeResponse = await fetchAPI("/(api)/(stripe)/charge-late-fee", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            booking_id: bookingData.id,
            payment_intent_id: bookingData.paymentIntentId,
            late_fee: bookingData.lateFee,
          }),
        });

        if (!chargeResponse.success) {
          throw new Error(
            chargeResponse.error ||
              chargeResponse.message ||
              "Failed to charge late fee"
          );
        }
      }

      await updateDoc(doc(db, "bookings", bookingData.id), {
        bookingStatus: "completed",
        tripStatus: "completed",
        completedAt: serverTimestamp(),
        lateChargeId: chargeResponse?.charge?.id || null,
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "cars", bookingData.carId), {
        status: "active",
        totalTrips: increment(1),
        updatedAt: serverTimestamp(),
      });

      await notifyGuestTripCompleted(bookingData.userId, bookingData.id, {
        make: carData?.make ?? "",
        model: carData?.model ?? "",
      });

      Alert.alert("Success", "Trip completed successfully!");
      router.back();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to complete trip";
      Alert.alert("Error", errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  const isPending = bookingData.bookingStatus === "pending";
  const isConfirmed = bookingData.bookingStatus === "confirmed";
  const isCancelled =
    bookingData.bookingStatus === "cancelled" ||
    bookingData.bookingStatus === "declined";

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
              className="w-full border border-red-500 rounded-lg py-4 items-center"
              onPress={handleDecline}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="#EF4444" />
              ) : (
                <Text className="font-JakartaSemiBold text-lg text-red-500">
                  Decline
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Trip Management - Only show if confirmed */}
        {isConfirmed && (
          <View className="mt-10 p-4 border border-gray-300 rounded-lg">
            <Text className="mb-6 font-JakartaSemiBold text-secondary-700">
              {currentTime >= new Date(bookingData.pickupTime)
                ? getTripEndCountdown(bookingData.returnTime)
                : getTripStartCountdown(bookingData.pickupTime)}
            </Text>

            {isConfirmed &&
              bookingData.tripStatus === "awaiting_host_confirmation" && (
                <TouchableOpacity
                  className="w-full bg-green-500 rounded-lg py-4 items-center"
                  onPress={handleConfirmReturn}
                  disabled={actionLoading}
                >
                  <Text className="font-JakartaSemiBold text-lg text-white">
                    Confirm Return
                  </Text>
                </TouchableOpacity>
              )}

            <TouchableOpacity
              className="w-full border border-red-500 rounded-lg py-4 items-center mt-6"
              onPress={() => {
                router.push({
                  pathname: "/hostCancellationScreen",
                  params: {
                    booking: JSON.stringify({
                      ...bookingData,
                      carMake: carData?.make,
                      carModel: carData?.model,
                      carYear: carData?.year,
                      carImage: btoa(carData?.images?.[0]?.url || ""),
                      guestName: `${guestData?.firstName} ${guestData?.lastName}`,
                      hostName: `${ownerData?.firstName} ${ownerData?.lastName}`,
                    }),
                  },
                });
              }}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="#EF4444" />
              ) : (
                <Text className="font-JakartaSemiBold text-lg text-red-500">
                  Cancel Booking
                </Text>
              )}
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
                  const pickupDateTime = new Date(bookingData.pickupTime);
                  const returnDateTime = new Date(bookingData.returnTime);

                  const hoursUntilPickup =
                    (pickupDateTime.getTime() - now.getTime()) /
                    (1000 * 60 * 60);
                  const hoursSinceReturn =
                    (now.getTime() - returnDateTime.getTime()) /
                    (1000 * 60 * 60);

                  const isConfirmed = bookingData.bookingStatus === "confirmed";

                  // ✅ Only allow check-in BEFORE pickup time, within 24h window
                  const canCheckIn =
                    isConfirmed &&
                    hoursUntilPickup <= 24 &&
                    now < pickupDateTime;

                  // ✅ Only allow check-out AFTER return time, within 24h window
                  const canCheckOut =
                    isConfirmed &&
                    now >= returnDateTime &&
                    hoursSinceReturn <= 24;

                  if (!canCheckIn && !canCheckOut) {
                    if (!isConfirmed) {
                      Alert.alert(
                        "Not Available",
                        "Trip photos are only available for confirmed bookings."
                      );
                    } else if (hoursUntilPickup > 24) {
                      Alert.alert(
                        "Not Available Yet",
                        "Check-in photos can be added starting 24 hours before the trip starts."
                      );
                    } else if (now >= pickupDateTime && now < returnDateTime) {
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
                      userRole: "host",
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
              onPress={() => {
                router.push({
                  pathname: "/receiptScreen",
                  params: {
                    booking: JSON.stringify(bookingData),
                    userRole: "host",
                  },
                });
              }}
            >
              <Text className="font-JakartaSemiBold text-primary-500">
                VIEW RECEIPT
              </Text>
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

        <ConfirmationModal
          visible={modalVisible}
          title={modalConfig.title}
          message={modalConfig.message}
          confirmText={modalConfig.confirmText}
          confirmColor={modalConfig.confirmColor}
          onConfirm={modalConfig.onConfirm}
          onCancel={() => setModalVisible(false)}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default HostBooking;
