import BottomSheet from "@/components/BottomSheet";
import ConfirmationModal from "@/components/ConfirmationModal";
import { icons } from "@/constants";
import { db } from "@/FirebaseConfig";
import { UserData } from "@/hooks/useUser";
import {
  notifyHostTripReturned,
  notifyHostTripStarted,
} from "@/services/notificationService";
import { CarData } from "@/types/booking.types";
import { formatDate, formatTime } from "@/utils/dateUtils";
import { getTripEndCountdown, getTripStartCountdown } from "@/utils/tripUtils";
import { MaterialIcons, Octicons } from "@expo/vector-icons";
import { encode as btoa } from "base-64";
import { router, useLocalSearchParams } from "expo-router";
import {
  doc,
  getDoc,
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

const GuestBooking = () => {
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

  const [hostData, setHostData] = useState<UserData | null>(null);
  const [carData, setCarData] = useState<CarData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [GuestData, setOwnerData] = useState<UserData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [onConfirmAction, setOnConfirmAction] = useState<() => void>(() => {});

  //BottomSheet states
  const [isTripBottomSheetVisible, setIsTripBottomSheetVisible] =
    useState(false);
  const [tripType, setTripType] = useState<"checkin" | "checkout" | null>(null);

  const openTripBottomSheet = (type: "checkin" | "checkout") => {
    setTripType(type);
    setIsTripBottomSheetVisible(true);
  };

  const closeTripBottomSheet = () => {
    setIsTripBottomSheetVisible(false);
  };

  const handleTripConfirm = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    closeTripBottomSheet();

    if (tripType === "checkin") {
      await handleCheckIn();
    } else if (tripType === "checkout") {
      await handleCheckOut();
    }
    setActionLoading(false);
  };

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
  }, [bookingData]);

  if (!bookingData) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="font-JakartaSemiBold text-lg">
          Booking details not available.
        </Text>
      </SafeAreaView>
    );
  }

  const handleCheckIn = async () => {
    const now = new Date();
    const pickupDateTime = new Date(bookingData.pickupTime);
    const hoursUntilPickup =
      (pickupDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // ✅ Block early check-in (more than 10 minutes before pickup)
    if (hoursUntilPickup > 0.1667) {
      Alert.alert(
        "Too Early",
        "Check-in is available 10 minutes before pickup time."
      );
      return;
    }

    await updateDoc(doc(db, "bookings", bookingData.id), {
      tripStatus: "in_progress",
      actualStartTime: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Update car status
    await updateDoc(doc(db, "cars", bookingData.carId), {
      status: "on a trip",
      updatedAt: serverTimestamp(),
    });

    // Notify host (add to notificationService.ts)
    await notifyHostTripStarted(
      bookingData.hostId,
      bookingData.id,
      `${GuestData?.firstName ?? ""} ${GuestData?.lastName ?? ""}`,
      {
        make: carData?.make ?? "",
        model: carData?.model ?? "",
      }
    );
  };

  const handleCheckOut = async () => {
    const now = new Date();
    const returnDateTime = new Date(bookingData.returnTime);

    // Prevent early checkout (before return time)
    if (now < returnDateTime) {
      Alert.alert(
        "Too Early",
        "Check-out is available only once your return time has arrived."
      );
      return;
    }

    // Calculate lateness
    const hoursSinceReturn =
      (now.getTime() - returnDateTime.getTime()) / (1000 * 60 * 60);
    const isLate = hoursSinceReturn > 1; // > 1 hour late
    const lateHours = isLate ? Math.ceil(hoursSinceReturn - 1) : 0;
    // const lateFee = lateHours * 100;
    const LATE_FEE_PER_HOUR_CENTAVOS = 100 * 100; // ₱100/hr in centavos
    const lateFee = lateHours * LATE_FEE_PER_HOUR_CENTAVOS;

    await updateDoc(doc(db, "bookings", bookingData.id), {
      tripStatus: "awaiting_host_confirmation",
      actualEndTime: serverTimestamp(),
      lateReturn: isLate,
      lateHours: lateHours,
      lateFee: lateFee,
      updatedAt: serverTimestamp(),
    });

    await notifyHostTripReturned(
      bookingData.hostId,
      bookingData.id,
      `${GuestData?.firstName ?? ""} ${GuestData?.lastName ?? ""}`,
      {
        make: carData?.make ?? "",
        model: carData?.model ?? "",
      }
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

        {/* Show combined status message */}
        <View className="mt-10 p-4 bg-secondary-100 rounded-lg">
          <Text className="font-JakartaMedium text-[14px] color-secondary-700">
            Status
          </Text>
          <Text className="font-JakartaBold text-lg mt-1 color-primary-500">
            {/* Booking statuses first */}
            {bookingData.bookingStatus === "pending" &&
              "AWAITING HOST APPROVAL"}
            {bookingData.bookingStatus === "declined" && "DECLINED"}
            {bookingData.bookingStatus === "cancelled" && "CANCELLED"}
            {bookingData.bookingStatus === "completed" && "COMPLETED"}

            {/* Only show trip status if booking is confirmed */}
            {bookingData.bookingStatus === "confirmed" && (
              <>
                {bookingData.tripStatus === "not_started" && "TRIP NOT STARTED"}
                {bookingData.tripStatus === "checked_in" && "CHECKED IN"}
                {bookingData.tripStatus === "in_progress" && "TRIP IN PROGRESS"}
                {bookingData.tripStatus === "checked_out" && "CHECKED OUT"}
                {bookingData.tripStatus === "awaiting_host_confirmation" &&
                  "AWAITING HOST CONFIRMATION"}
                {bookingData.tripStatus === "completed" && "COMPLETED"}
                {!bookingData.tripStatus && "CONFIRMED - READY FOR CHECK-IN"}
              </>
            )}
          </Text>
        </View>

        {!isCancelled && (
          <View className="mt-10 p-4 border border-gray-300 rounded-lg">
            {isConfirmed && (
              <Text className="mb-6 font-JakartaSemiBold text-secondary-700">
                {currentTime >= new Date(bookingData.pickupTime)
                  ? getTripEndCountdown(bookingData.returnTime)
                  : getTripStartCountdown(bookingData.pickupTime)}
              </Text>
            )}

            <TouchableOpacity
              className="w-full border border-red-500 rounded-lg py-4 items-center"
              onPress={() => {
                router.push({
                  pathname: "/cancellationScreen",
                  params: {
                    booking: JSON.stringify({
                      ...bookingData,
                      carMake: carData?.make,
                      carModel: carData?.model,
                      carYear: carData?.year,
                      carImage: btoa(carData?.images?.[0]?.url || ""),
                      hostName: `${hostData?.firstName} ${hostData?.lastName}`,
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
                  Cancel Trip
                </Text>
              )}
            </TouchableOpacity>

            {isConfirmed && (
              <View className="mt-6 space-y-4">
                {/* Check-In Button - Only show before trip starts */}
                {(!bookingData.tripStatus ||
                  bookingData.tripStatus === "not_started") && (
                  <TouchableOpacity
                    className="w-full bg-primary-500 rounded-lg py-4 items-center"
                    // onPress={() => openTripModal("checkin")}
                    onPress={() => openTripBottomSheet("checkin")}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="font-JakartaSemiBold text-lg text-white">
                        Check In & Start Trip
                      </Text>
                    )}
                  </TouchableOpacity>
                )}

                {/* Check-Out Button - Only show during trip */}
                {bookingData.tripStatus === "in_progress" && (
                  <TouchableOpacity
                    className="w-full bg-primary-500 rounded-lg py-4 items-center"
                    // onPress={() => openTripModal("checkout")}
                    onPress={() => openTripBottomSheet("checkout")}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="font-JakartaSemiBold text-lg text-white">
                        Check Out & End Trip
                      </Text>
                    )}
                  </TouchableOpacity>
                )}

                {/* Waiting for Host Status */}
                {bookingData.tripStatus === "awaiting_host_confirmation" && (
                  <View className="w-full bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                    <View className="flex-row items-center justify-center">
                      <ActivityIndicator color="#ca8a04" size="small" />
                      <Text className="font-JakartaSemiBold text-lg text-yellow-700 ml-2">
                        Awaiting Host Confirmation
                      </Text>
                    </View>
                    <Text className="font-JakartaMedium text-sm text-yellow-600 mt-2 text-center">
                      The host will confirm your vehicle return soon
                    </Text>
                  </View>
                )}
              </View>
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
                  const pickupDateTime = new Date(bookingData.pickupTime);
                  const returnDateTime = new Date(bookingData.returnTime);

                  const hoursUntilPickup =
                    (pickupDateTime.getTime() - now.getTime()) /
                    (1000 * 60 * 60);
                  const hoursSinceReturn =
                    (now.getTime() - returnDateTime.getTime()) /
                    (1000 * 60 * 60);

                  const isConfirmed = bookingData.bookingStatus === "confirmed";

                  // ✅ Allow check-in photos only within 30 minutes before pickup time
                  const canCheckIn =
                    isConfirmed &&
                    hoursUntilPickup <= 0.5 &&
                    now < pickupDateTime;

                  // ✅ Allow check-out photos only after return time (within 24 hours)
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
                    } else if (hoursUntilPickup > 0.5) {
                      Alert.alert(
                        "Too Early",
                        "Check-in photos can be added starting 30 minutes before your trip starts."
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

      <BottomSheet
        visible={isTripBottomSheetVisible}
        onClose={closeTripBottomSheet}
        height={430}
        showDragHandle={true}
        enablePanGesture={true}
        backdropOpacity={0.5}
        dismissThreshold={0.3}
        borderRadius={24}
        backgroundColor="#FFFFFF"
      >
        <View className="px-6 pt-2 pb-6">
          {/* Title */}
          <Text className="text-2xl font-JakartaBold text-gray-900 text-center mb-4">
            {tripType === "checkin" ? "Confirm Check-In" : "Confirm Check-Out"}
          </Text>

          {/* Icon */}
          <View className="items-center mb-6">
            <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center">
              <MaterialIcons
                name={tripType === "checkin" ? "login" : "logout"}
                size={40}
                color="#3B82F6"
              />
            </View>
          </View>

          {/* Message */}
          <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <View className="flex-row items-start">
              <MaterialIcons name="info" size={20} color="#ca8a04" />
              <Text className="flex-1 ml-2 font-JakartaMedium text-gray-700 leading-5">
                Please upload trip photos to avoid responsibility for
                pre-existing damages.
              </Text>
            </View>
          </View>

          {/* Buttons */}
          <View className="gap-3">
            <TouchableOpacity
              className="w-full bg-primary-500 rounded-lg py-4 items-center"
              onPress={handleTripConfirm}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="font-JakartaSemiBold text-lg text-white">
                  Continue
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="w-full border border-gray-300 rounded-lg py-4 items-center"
              onPress={closeTripBottomSheet}
              disabled={actionLoading}
            >
              <Text className="font-JakartaSemiBold text-lg text-gray-700">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
};

export default GuestBooking;
