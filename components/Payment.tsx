import { db } from "@/FirebaseConfig";
import { useStripe } from "@stripe/stripe-react-native";
import { router } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import React, { useState } from "react";
import { Alert, Image, Text, View } from "react-native";
import Modal from "react-native-modal";

import CustomButton from "@/components/CustomButton";
import { images } from "@/constants";
import { fetchAPI } from "@/lib/fetch";

interface PaymentProps {
  fullName: string;
  email: string;
  amount: string;
  subtotal: string; // NEW
  platformFee: string; // NEW
  carId: string;
  pickupDate: string;
  returnDate: string;
  pickupTime: Date;
  returnTime: Date;
  rentalDays: number;
  userId: string;
  carDetails?: {
    make: string;
    model: string;
    type: string;
    year?: string;
    dailyRate: string;
  };
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
  carDetails,
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
        pickupDate: pickupDate,
        returnDate: returnDate,
        pickupTime: pickupTime.toISOString(),
        returnTime: returnTime.toISOString(),
        rentalDays: rentalDays,
        subtotal: parseFloat(subtotal) * 100,
        platformFee: parseFloat(platformFee) * 100,
        totalAmount: parseInt(amount) * 100,
        paymentStatus: "paid",
        paymentIntentId: paymentIntentId,
        bookingStatus: "pending",

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

      if (carId) {
        const carRef = doc(db, "cars", carId);
        await updateDoc(carRef, {
          isAvailable: false,
          lastBookedAt: serverTimestamp(),
        });
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

              // Step 1: Create payment intent and customer
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

              // console.log("Create response:", createResponse);

              if (!createResponse.paymentIntent?.client_secret) {
                throw new Error("Failed to create payment intent");
              }

              const { paymentIntent, customer } = createResponse;

              // console.log("=== Step 2: Confirming payment ===");

              // Step 2: Confirm the payment
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

              // console.log("Pay response:", payResponse);

              if (!payResponse.result?.client_secret) {
                throw new Error("Payment confirmation failed");
              }

              const { result } = payResponse;

              // console.log("=== Step 3: Creating booking (client-side) ===");

              // Step 3: Create booking directly in Firestore
              const bookingId = await createBooking(paymentIntent.id);

              console.log("=== All steps completed successfully ===");
              console.log("Booking ID:", bookingId);

              intentCreationCallback({
                clientSecret: result.client_secret,
              });
            } catch (error) {
              console.error("=== Payment confirmation error ===", error);

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
      console.log("=== Payment sheet completed successfully ===");
      setSuccess(true);
    }
  };

  return (
    <>
      <CustomButton
        title={
          disabled
            ? "Car Not Available"
            : loading
              ? "Processing..."
              : "Confirm Booking"
        }
        onPress={openPaymentSheet}
        disabled={disabled || loading} // 🔥 disable if car not available
      />

      <Modal isVisible={success} onBackdropPress={() => setSuccess(false)}>
        <View className="flex flex-col items-center justify-center bg-white p-7 rounded-2xl">
          <Image source={images.check} className="w-28 h-28 mt-5" />

          <Text className="text-2xl text-center font-JakartaBold mt-5">
            Booking Confirmed!
          </Text>

          <Text className="text-md text-general-200 font-JakartaRegular text-center mt-3">
            Your car rental has been successfully booked. We've sent a
            confirmation email with all the details.
          </Text>

          <CustomButton
            title="Back to Home"
            onPress={() => {
              setSuccess(false);
              router.push("/(root)/(tabs)/home");
            }}
            className="mt-5"
          />
        </View>
      </Modal>
    </>
  );
};

export default Payment;
