import { icons } from "@/constants";
import { db } from "@/FirebaseConfig";
import { UserData } from "@/hooks/useUser";
import { CarData } from "@/types/booking.types";
import { formatDate } from "@/utils/dateUtils";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Helper function to safely convert Timestamp to formatted date string
const getDateString = (timestamp: any): string => {
  if (!timestamp) return "N/A";

  try {
    // If it's a Firestore Timestamp with toDate method
    if (timestamp.toDate && typeof timestamp.toDate === "function") {
      const date = timestamp.toDate();
      return formatDate(date.toISOString());
    }
    // If it's already a Date object
    if (timestamp instanceof Date) {
      return formatDate(timestamp.toISOString());
    }
    // If it's a string, use it directly
    if (typeof timestamp === "string") {
      return formatDate(timestamp);
    }
    return "N/A";
  } catch (error) {
    console.error("Error converting timestamp:", error);
    return "N/A";
  }
};

// Helper component for info rows
const InfoRow = ({
  label,
  value,
  bold = false,
  valueColor = "text-gray-900",
}: {
  label: string;
  value: string;
  bold?: boolean;
  valueColor?: string;
}) => (
  <View className="flex-row justify-between items-center">
    <Text
      className={`${bold ? "font-JakartaBold" : "font-JakartaMedium"} text-secondary-600`}
    >
      {label}
    </Text>
    <Text
      className={`${bold ? "font-JakartaBold text-lg" : "font-JakartaSemiBold"} ${valueColor}`}
    >
      {value}
    </Text>
  </View>
);

const ReceiptScreen = () => {
  const { booking, userRole: userRoleParam } = useLocalSearchParams<{
    booking: string;
    userRole?: string;
  }>();
  const bookingData = booking ? JSON.parse(booking) : null;

  const [carData, setCarData] = useState<CarData | null>(null);
  const [hostData, setHostData] = useState<UserData | null>(null);
  const [guestData, setGuestData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole] = useState<"host" | "guest">(
    (userRoleParam as "host" | "guest") || "guest"
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch car data
        if (bookingData?.carId) {
          const carDoc = await getDoc(doc(db, "cars", bookingData.carId));
          if (carDoc.exists()) {
            setCarData({ id: carDoc.id, ...carDoc.data() } as CarData);
          }
        }

        // Fetch host data
        if (bookingData?.hostId) {
          const hostDoc = await getDoc(doc(db, "users", bookingData.hostId));
          if (hostDoc.exists()) {
            setHostData(hostDoc.data() as UserData);
          }
        }

        // Fetch guest data
        if (bookingData?.userId) {
          const guestDoc = await getDoc(doc(db, "users", bookingData.userId));
          if (guestDoc.exists()) {
            setGuestData(guestDoc.data() as UserData);
          }
        }
      } catch (error) {
        console.error("Error fetching receipt data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (bookingData) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [booking]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0066FF" />
        </View>
      </SafeAreaView>
    );
  }

  const isCompleted = bookingData?.bookingStatus === "completed";
  const isCancelled = bookingData?.bookingStatus === "cancelled";
  const isPending = bookingData?.bookingStatus === "pending";
  const isConfirmed = bookingData?.bookingStatus === "confirmed";

  // Calculate breakdown based on your Booking type
  const totalAmount = (bookingData?.totalAmount || 0) / 100;
  const platformFee = (bookingData?.platformFee || 0) / 100;
  const subtotal = (bookingData?.subtotal || 0) / 100;

  // For host earnings
  const hostEarnings = totalAmount - platformFee;

  const renderGuestCompletedReceipt = () => (
    <>
      <View className="bg-primary-50 rounded-lg p-6 mb-6">
        <View className="items-center mb-4">
          <View className="w-16 h-16 bg-green-500 rounded-full items-center justify-center mb-3">
            <Feather name="check" size={32} color="white" />
          </View>
          <Text className="text-2xl font-JakartaBold text-gray-900 mb-1">
            Trip Receipt
          </Text>
          <Text className="text-sm font-JakartaMedium text-secondary-600">
            Thank you for booking with Veehive!
          </Text>
        </View>
      </View>

      <View className="mb-6">
        <Text className="text-lg font-JakartaBold text-gray-900 mb-4">
          Booking Information
        </Text>
        <View className="bg-gray-50 rounded-lg p-4 space-y-3">
          <InfoRow label="Trip ID" value={`#${bookingData.id.slice(0, 8)}`} />
          <InfoRow
            label="Car"
            value={`${carData?.make} ${carData?.model} (${carData?.year})`}
          />
          <InfoRow
            label="Host"
            value={`${hostData?.firstName} ${hostData?.lastName}`}
          />
          <InfoRow
            label="Trip Dates"
            value={`${formatDate(bookingData.pickupDate)} → ${formatDate(bookingData.returnDate)}`}
          />
          <InfoRow
            label="Pickup Location"
            value={bookingData?.location?.address}
          />
        </View>
      </View>

      <View className="mb-6">
        <Text className="text-lg font-JakartaBold text-gray-900 mb-4">
          Payment Summary
        </Text>
        <View className="bg-gray-50 rounded-lg p-4 space-y-3">
          <InfoRow
            label="Subtotal"
            value={`₱${subtotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
          />
          <InfoRow
            label="Platform Fee"
            value={`₱${platformFee.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
          />
          {bookingData.lateReturn && bookingData.lateFee > 0 && (
            <InfoRow
              label={`Late Return Fee (${bookingData.lateHours}h)`}
              // value={`₱${bookingData.lateFee.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
              value={`₱${(bookingData.lateFee / 100).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
              valueColor="text-red-600"
            />
          )}
          <View className="border-t border-gray-300 pt-3 mt-3">
            <InfoRow
              label="Total Paid"
              value={`₱${(totalAmount + (bookingData.lateFee || 0 / 100)).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
              bold
            />
          </View>
        </View>
      </View>

      <View className="mb-6">
        <View className="bg-gray-50 rounded-lg p-4 space-y-2">
          <InfoRow
            label="Payment Method"
            value={bookingData.paymentMethod || "Card"}
          />
          <InfoRow
            label="Transaction Date"
            value={getDateString(bookingData.createdAt)}
          />
        </View>
      </View>

      <View className="bg-blue-50 rounded-lg p-4 mb-6">
        <Text className="text-sm font-JakartaMedium text-secondary-700 text-center">
          Drive safely and enjoy your trip! 🚗
        </Text>
      </View>
    </>
  );

  const renderGuestCancelledReceipt = () => {
    const refundAmount = bookingData?.refundAmount || 0;
    const cancellationFee = totalAmount - refundAmount;

    return (
      <>
        <View className="bg-red-50 rounded-lg p-6 mb-6">
          <View className="items-center mb-4">
            <View className="w-16 h-16 bg-red-500 rounded-full items-center justify-center mb-3">
              <Feather name="x" size={32} color="white" />
            </View>
            <Text className="text-2xl font-JakartaBold text-gray-900 mb-1">
              Trip Cancellation Summary
            </Text>
            <Text className="text-sm font-JakartaMedium text-secondary-600">
              Your trip has been successfully canceled.
            </Text>
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-lg font-JakartaBold text-gray-900 mb-4">
            Booking Details
          </Text>
          <View className="bg-gray-50 rounded-lg p-4 space-y-3">
            <InfoRow label="Trip ID" value={`#${bookingData.id.slice(0, 8)}`} />
            <InfoRow
              label="Car"
              value={`${carData?.make} ${carData?.model} (${carData?.year})`}
            />
            <InfoRow
              label="Host"
              value={`${hostData?.firstName} ${hostData?.lastName}`}
            />
            <InfoRow
              label="Requested by"
              value={`${bookingData?.cancelledBy}`}
            />
            <InfoRow
              label="Original Trip Dates"
              value={`${formatDate(bookingData.pickupDate)} → ${formatDate(bookingData.returnDate)}`}
            />
            <InfoRow
              label="Cancellation Date"
              value={getDateString(bookingData.cancelledAt)}
            />
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-lg font-JakartaBold text-gray-900 mb-4">
            Refund Summary
          </Text>
          <View className="bg-gray-50 rounded-lg p-4 space-y-3">
            <InfoRow
              label="Total Paid"
              value={`₱${totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
            />
            <InfoRow
              label="Refund Amount"
              value={`₱${refundAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
              valueColor="text-green-600"
            />
            <InfoRow
              label="Cancellation Fee"
              value={`₱${cancellationFee.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
              valueColor="text-red-600"
            />
            <InfoRow
              label="Refund Method"
              value={bookingData.paymentMethod || "Card"}
            />
            {bookingData.refundId && (
              <InfoRow
                label="Refund Reference"
                value={bookingData.refundId.slice(0, 16)}
              />
            )}
          </View>
        </View>

        <View className="bg-yellow-50 rounded-lg p-4 mb-6">
          <Text className="text-xs font-JakartaSemiBold text-gray-900 mb-2">
            Refund Processing Time
          </Text>
          <Text className="text-xs font-JakartaMedium text-secondary-700">
            Refunds are processed automatically through Stripe and may take 5–10
            business days to appear in your account, depending on your bank or
            card provider.
          </Text>
        </View>

        <View className="bg-blue-50 rounded-lg p-4 mb-6">
          <Text className="text-xs font-JakartaSemiBold text-gray-900 mb-2">
            Cancellation Policy Reminder
          </Text>
          <Text className="text-xs font-JakartaMedium text-secondary-700">
            • Cancel at least 24 hours before pickup → Full refund{"\n"}• Cancel
            less than 24 hours before pickup → Partial refund may apply{"\n"}•
            After trip start → No refund
          </Text>
        </View>
      </>
    );
  };

  const renderGuestPendingReceipt = () => (
    <>
      <View className="bg-yellow-50 rounded-lg p-6 mb-6">
        <View className="items-center mb-4">
          <View className="w-16 h-16 bg-yellow-500 rounded-full items-center justify-center mb-3">
            <Feather name="clock" size={32} color="white" />
          </View>
          <Text className="text-2xl font-JakartaBold text-gray-900 mb-1">
            Booking Request Pending
          </Text>
          <Text className="text-sm font-JakartaMedium text-secondary-600">
            Awaiting host confirmation
          </Text>
        </View>
      </View>

      <View className="mb-6">
        <Text className="text-lg font-JakartaBold text-gray-900 mb-4">
          Booking Information
        </Text>
        <View className="bg-gray-50 rounded-lg p-4 space-y-3">
          <InfoRow label="Trip ID" value={`#${bookingData.id.slice(0, 8)}`} />
          <InfoRow
            label="Car"
            value={`${carData?.make} ${carData?.model} (${carData?.year})`}
          />
          <InfoRow
            label="Host"
            value={`${hostData?.firstName} ${hostData?.lastName}`}
          />
          <InfoRow
            label="Trip Dates"
            value={`${formatDate(bookingData.pickupDate)} → ${formatDate(bookingData.returnDate)}`}
          />
        </View>
      </View>

      <View className="mb-6">
        <Text className="text-lg font-JakartaBold text-gray-900 mb-4">
          Payment Authorization
        </Text>
        <View className="bg-gray-50 rounded-lg p-4 space-y-3">
          <InfoRow
            label="Total Amount"
            value={`₱${totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
            bold
          />
          <InfoRow label="Payment Status" value="Authorized (Not Charged)" />
        </View>
      </View>

      <View className="bg-blue-50 rounded-lg p-4 mb-6">
        <Text className="text-xs font-JakartaMedium text-secondary-700">
          No payment has been processed. A temporary hold has been placed on
          your payment method. You will only be charged if the host accepts your
          booking request.
        </Text>
      </View>
    </>
  );

  const renderHostCompletedReceipt = () => (
    <>
      <View className="bg-green-50 rounded-lg p-6 mb-6">
        <View className="items-center mb-4">
          <View className="w-16 h-16 bg-green-500 rounded-full items-center justify-center mb-3">
            <Feather name="check" size={32} color="white" />
          </View>
          <Text className="text-2xl font-JakartaBold text-gray-900 mb-1">
            Trip Earnings Summary
          </Text>
          <Text className="text-sm font-JakartaMedium text-secondary-600">
            You've successfully completed a trip!
          </Text>
        </View>
      </View>

      <View className="mb-6">
        <Text className="text-lg font-JakartaBold text-gray-900 mb-4">
          Trip Details
        </Text>
        <View className="bg-gray-50 rounded-lg p-4 space-y-3">
          <InfoRow label="Trip ID" value={`#${bookingData.id.slice(0, 8)}`} />
          <InfoRow
            label="Car"
            value={`${carData?.make} ${carData?.model} (${carData?.year})`}
          />
          <InfoRow
            label="Renter"
            value={`${guestData?.firstName} ${guestData?.lastName}`}
          />
          <InfoRow
            label="Trip Dates"
            value={`${formatDate(bookingData.pickupDate)} → ${formatDate(bookingData.returnDate)}`}
          />
        </View>
      </View>

      <View className="mb-6">
        <Text className="text-lg font-JakartaBold text-gray-900 mb-4">
          Earnings Summary
        </Text>
        <View className="bg-gray-50 rounded-lg p-4 space-y-3">
          <InfoRow
            label="Trip Total"
            value={`₱${totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
          />
          {bookingData.lateReturn && bookingData.lateFee > 0 && (
            <InfoRow
              label={`Late Fee (${bookingData.lateHours}h)`}
              value={`₱${(bookingData.lateFee / 100).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
              valueColor="text-green-600"
            />
          )}
          <InfoRow
            label="Platform Fee"
            value={`-₱${platformFee.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
            valueColor="text-red-600"
          />
          <View className="border-t border-gray-300 pt-3 mt-3">
            <InfoRow
              label="Your Earnings"
              value={`₱${(hostEarnings + (bookingData.lateFee / 100)).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
              bold
              valueColor="text-green-600"
            />
          </View>
        </View>
      </View>

      <View className="bg-blue-50 rounded-lg p-4 mb-6">
        <Text className="text-xs font-JakartaMedium text-secondary-700">
          You can track your earnings and payout history in the Earnings section
          of your app.
        </Text>
      </View>
    </>
  );

  const renderHostCancelledReceipt = () => {
    const refundAmount = bookingData?.refundAmount || 0;

    return (
      <>
        <View className="bg-red-50 rounded-lg p-6 mb-6">
          <View className="items-center mb-4">
            <View className="w-16 h-16 bg-red-500 rounded-full items-center justify-center mb-3">
              <Feather name="alert-circle" size={32} color="white" />
            </View>
            <Text className="text-2xl font-JakartaBold text-gray-900 mb-1">
              Trip Cancellation Notice
            </Text>
            <Text className="text-sm font-JakartaMedium text-secondary-600">
              You have canceled a confirmed trip.
            </Text>
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-lg font-JakartaBold text-gray-900 mb-4">
            Booking Details
          </Text>
          <View className="bg-gray-50 rounded-lg p-4 space-y-3">
            <InfoRow label="Trip ID" value={`#${bookingData.id.slice(0, 8)}`} />
            <InfoRow
              label="Car"
              value={`${carData?.make} ${carData?.model} (${carData?.year})`}
            />
            <InfoRow
              label="Renter"
              value={`${guestData?.firstName} ${guestData?.lastName}`}
            />
            <InfoRow
              label="Original Trip Dates"
              value={`${formatDate(bookingData.pickupDate)} → ${formatDate(bookingData.returnDate)}`}
            />
            <InfoRow
              label="Cancellation Date"
              value={getDateString(bookingData.cancelledAt)}
            />
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-lg font-JakartaBold text-gray-900 mb-4">
            Renter Refund
          </Text>
          <View className="bg-gray-50 rounded-lg p-4 space-y-3">
            <InfoRow
              label="Total Refund"
              value={`₱${refundAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
              valueColor="text-green-600"
            />
            <InfoRow
              label="Refund Method"
              value={bookingData.paymentMethod || "Card"}
            />
            {bookingData.refundId && (
              <InfoRow
                label="Refund Reference"
                value={bookingData.refundId.slice(0, 16)}
              />
            )}
          </View>
        </View>

        <View className="bg-yellow-50 rounded-lg p-4 mb-6">
          <Text className="text-xs font-JakartaSemiBold text-gray-900 mb-2">
            Important Notice
          </Text>
          <Text className="text-xs font-JakartaMedium text-secondary-700">
            Canceling confirmed bookings frequently may affect your host
            performance rating. Please cancel only when necessary.
          </Text>
        </View>
      </>
    );
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

        <Text className="text-lg font-JakartaSemiBold text-gray-900 text-center">
          Receipt
        </Text>
      </View>

      <ScrollView className="flex-1 px-4">
        {userRole === "guest" && (
          <>
            {(isCompleted || isConfirmed) && renderGuestCompletedReceipt()}
            {isCancelled && renderGuestCancelledReceipt()}
            {isPending && renderGuestPendingReceipt()}
          </>
        )}

        {userRole === "host" && (
          <>
            {(isCompleted || isConfirmed) && renderHostCompletedReceipt()}
            {isCancelled && renderHostCancelledReceipt()}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ReceiptScreen;
