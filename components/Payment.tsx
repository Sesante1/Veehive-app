import { useStripe } from "@stripe/stripe-react-native";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, Text, View } from "react-native";
import { ReactNativeModal } from "react-native-modal";

import CustomButton from "@/components/CustomButton";
import { images } from "@/constants";

const Payment = () => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [success, setSuccess] = useState(false);

  const initializePaymentSheet = async () => {
    const { error } = await initPaymentSheet({
      merchantDisplayName: "Example, Inc.",
      intentConfiguration: {
        mode: {
          amount: 1099, // $10.99 
          currencyCode: "usd",
        },
        confirmHandler: async (_, __, intentCreationCallback) => {
          // For demo: immediately succeed
          intentCreationCallback({
            clientSecret: "dummy_client_secret", // fake value just to show UI
          });
        },
      },
      returnURL: "myapp://book-ride",
    });

    if (error) {
      Alert.alert("Init Error", error.message);
    }
  };

  const openPaymentSheet = async () => {
    await initializePaymentSheet();

    const { error } = await presentPaymentSheet();

    if (error) {
      Alert.alert(`Error code: ${error.code}`, error.message);
    } else {
      setSuccess(true);
    }
  };

  return (
    <>
      <CustomButton title="Confirm Booking" onPress={openPaymentSheet} />

      <ReactNativeModal
        isVisible={success}
        onBackdropPress={() => setSuccess(false)}
      >
        <View className="flex flex-col items-center justify-center bg-white p-7 rounded-2xl">
          <Image source={images.check} className="w-28 h-28 mt-5" />

          <Text className="text-2xl text-center font-JakartaBold mt-5">
            Payment Successful
          </Text>

          <CustomButton
            title="Back Home"
            onPress={() => {
              setSuccess(false);
              router.push("/(root)/(tabs)/home");
            }}
            className="mt-5"
          />
        </View>
      </ReactNativeModal>
    </>
  );
};

export default Payment;
