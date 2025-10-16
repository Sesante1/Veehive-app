import { db } from "@/FirebaseConfig";
import { useStripe } from "@stripe/stripe-react-native";
import { router } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import React, { useState } from "react";
import { Alert, Image, Text, View } from "react-native";
import Modal from "react-native-modal";

import CustomButton from "@/components/CustomButton";
import { images } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { notifyBookingConfirmed } from "@/services/notificationService";

interface PaymentProps {
  fullName: string;
  email: string;
  amount: string;
  subtotal: string;
  platformFee: string;
  carId: string;
  pickupDate: string;
  returnDate: string;
  pickupTime: Date;
  returnTime: Date;
  rentalDays: number;
  userId: string;
  ownerId: string;
  carDetails?: {
    make: string;
    model: string;
    type: string;
    year?: string;
    dailyRate: string;
  };
  location: {
    address: string;
    latitude: number;
    longitude: number;
  } | null;
  disabled?: boolean;
}

const Payment = ({
  fullName,
  email,
  amount,
  subtotal,
  platformFee,
  carId,
  pickupDate,
  returnDate,
  pickupTime,
  returnTime,
  rentalDays,
  userId,
  ownerId,
  carDetails,
  location,
  disabled,
}: PaymentProps) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Create booking directly in Firestore
  const createBooking = async (paymentIntentId: string) => {
    try {
      console.log("=== Creating booking in Firestore ===");

      const bookingData = {
        userId: userId,
        carId: carId,
        hostId: ownerId,
        pickupDate: pickupDate,
        returnDate: returnDate,
        pickupTime: pickupTime.toISOString(),
        returnTime: returnTime.toISOString(),
        rentalDays: rentalDays,
        subtotal: Math.round(parseFloat(subtotal) * 100),
        platformFee: Math.round(parseFloat(platformFee) * 100),
        totalAmount: Math.round(parseFloat(amount) * 100),
        paymentStatus: "authorized", // Changed from "paid" to "authorized"
        paymentIntentId: paymentIntentId,
        bookingStatus: "pending", // Waiting for host acceptance

        //Location
        location: location
          ? {
              address: location.address,
              latitude: location.latitude,
              longitude: location.longitude,
            }
          : null,

        // Cancellation & Refund fields
        cancellationStatus: null,
        cancellationRequestedAt: null,
        cancellationReason: null,
        cancelledBy: null,
        cancelledAt: null,
        refundStatus: null,
        refundAmount: null,
        refundPercentage: null,
        refundProcessedAt: null,
        refundId: null,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const bookingRef = await addDoc(collection(db, "bookings"), bookingData);

      console.log("=== Sending notifications to owner ===");

      try {
        const ownerDoc = await getDoc(doc(db, "users", ownerId));
        const ownerData = ownerDoc.data();

        if (ownerData?.role?.Hoster === true && carDetails) {
          // Notify about the booking
          await notifyBookingConfirmed(
            ownerId,
            bookingRef.id,
            fullName || email.split("@")[0],
            { make: carDetails.make, model: carDetails.model },
            pickupDate,
            amount
          );

          console.log("✅ Notifications sent successfully");
        }
      } catch (notificationError) {
        console.error("⚠️ Failed to send notifications:", notificationError);
      }

      return bookingRef.id;
    } catch (error) {
      console.error("Error creating booking:", error);
      throw error;
    }
  };

  const initializePaymentSheet = async (): Promise<boolean> => {
    try {
      const { error } = await initPaymentSheet({
        merchantDisplayName: "Car Rental Inc.",
        intentConfiguration: {
          mode: {
            amount: parseInt(amount) * 100,
            currencyCode: "php",
          },
          confirmHandler: async (
            paymentMethod,
            shouldSavePaymentMethod,
            intentCreationCallback
          ) => {
            try {
              console.log("=== Step 1: Creating payment intent ===");

              // Step 1: Create payment intent with manual capture
              const createResponse = await fetchAPI("/(api)/(stripe)/create", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  name: fullName || email.split("@")[0],
                  email: email,
                  amount: amount,
                  paymentMethodId: paymentMethod.id,
                }),
              });

              if (!createResponse.paymentIntent?.client_secret) {
                throw new Error("Failed to create payment intent");
              }

              const { paymentIntent, customer } = createResponse;

              // Step 2: Confirm the payment (authorize only)
              const payResponse = await fetchAPI("/(api)/(stripe)/pay", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  payment_method_id: paymentMethod.id,
                  payment_intent_id: paymentIntent.id,
                  customer_id: customer,
                  client_secret: paymentIntent.client_secret,
                }),
              });

              if (!payResponse.result?.client_secret) {
                throw new Error("Payment authorization failed");
              }

              const { result } = payResponse;

              // Step 3: Create booking in Firestore with "authorized" status
              const bookingId = await createBooking(paymentIntent.id);

              console.log(
                "=== Payment authorized, waiting for host acceptance ==="
              );
              console.log("Booking ID:", bookingId);

              intentCreationCallback({
                clientSecret: result.client_secret,
              });
            } catch (error) {
              console.error("=== Payment authorization error ===", error);

              const errorMessage =
                error instanceof Error
                  ? error.message
                  : "Payment processing failed";

              Alert.alert("Payment Error", errorMessage);

              intentCreationCallback({
                error: {
                  code: "Failed",
                  message: errorMessage,
                },
              });
            }
          },
        },
        returnURL: "carrentalapp://book-car",
      });

      if (error) {
        Alert.alert("Initialization Error", error.message);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Init error:", error);
      Alert.alert("Error", "Failed to initialize payment");
      return false;
    }
  };

  const openPaymentSheet = async () => {
    // Validation
    if (!userId) {
      Alert.alert("Error", "User ID is missing. Please log in again.");
      return;
    }

    if (!carId) {
      Alert.alert("Error", "Car ID is missing. Please select a car.");
      return;
    }

    console.log("=== Opening payment sheet ===");
    console.log("User ID:", userId);
    console.log("Car ID:", carId);
    console.log("Amount:", amount);

    setLoading(true);
    const initialized = await initializePaymentSheet();
    setLoading(false);

    if (!initialized) return;

    const { error } = await presentPaymentSheet();

    if (error) {
      Alert.alert(`Error code: ${error.code}`, error.message);
    } else {
      console.log("=== Payment authorized successfully ===");
      setSuccess(true);

      setTimeout(() => {
        router.push({
          pathname: "/(root)/completeBooking",
          params: { hostId: ownerId},
        });
      }, 500);
    }
  };

  return (
    <>
      <CustomButton
        title={
          !location
            ? "Select Return Location"
            : disabled
              ? "Car Not Available"
              : loading
                ? "Processing..."
                : "Confirm Booking"
        }
        onPress={openPaymentSheet}
        disabled={disabled || loading || !location}
      />
    </>
  );
};

export default Payment;
