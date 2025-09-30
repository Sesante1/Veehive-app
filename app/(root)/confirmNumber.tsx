import { icons } from "@/constants";
import { confirmVerificationCode } from "@/services/verificationService";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ConfirmNumber = () => {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { id, phoneNumber, sessionInfo } = useLocalSearchParams();

  const handleConfirm = async () => {
    if (!code) {
      Alert.alert("Error", "Please enter the verification code");
      return;
    }

    if (code.length !== 6) {
      Alert.alert("Error", "Please enter a valid 6-digit code");
      return;
    }

    setIsLoading(true);

    try {
      if (
        typeof id !== "string" ||
        typeof phoneNumber !== "string" ||
        typeof sessionInfo !== "string"
      ) {
        throw new Error(
          "Missing verification context. Please request a new code."
        );
      }

      const result = await confirmVerificationCode(
        code,
        id,
        phoneNumber,
        sessionInfo
      );

      setIsLoading(false);

      if (result.success) {
        Alert.alert("Success", "Phone number verified successfully!", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert("Error", result.error || "Invalid code, please try again.");
      }
    } catch (error: any) {
      setIsLoading(false);
      Alert.alert(
        "Error",
        error.message || "Failed to verify code. Please try again."
      );
    }
  };

  const handleResendCode = () => {
    Alert.alert(
      "Resend Code",
      "Would you like to go back and request a new verification code?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: () => router.back(),
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex justify-between items-center mb-10 pt-4 bg-white px-4">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center active:bg-gray-200 absolute left-4 top-2"
        >
          <Image source={icons.exit} style={{ width: 20, height: 20 }} />
        </Pressable>

        <Text className="text-lg font-JakartaSemiBold text-gray-900 text-center">
          Enter your mobile number
        </Text>
      </View>

      <View className="flex-1 px-4">
        <Text className="text-lg text-gray-700 font-JakartaSemiBold mb-8">
          Please enter the code sent to {phoneNumber}
        </Text>

        <TextInput
          value={code}
          onChangeText={(text) => {
            // Only allow numbers and limit to 6 digits
            const numericText = text.replace(/[^0-9]/g, "").slice(0, 6);
            setCode(numericText);
          }}
          keyboardType="numeric"
          className="border border-gray-300 rounded-lg p-4 mb-6 text-center text-2xl tracking-widest"
          placeholder="000000"
          maxLength={6}
          autoFocus
        />

        <Pressable
          onPress={handleResendCode}
          disabled={isLoading}
          className="p-2 items-center flex-row gap-2 justify-center"
        >
          <Text className="text-base font-JakartaMedium">
            Didn't receive the code?
          </Text>
          <Text className="text-blue-500  font-JakartaMedium">Resend code</Text>
        </Pressable>
      </View>
      <View className="px-4">
        <Pressable
          onPress={handleConfirm}
          disabled={isLoading || code.length !== 6}
          className={`p-4 rounded-lg items-center mb-4 ${
            isLoading || code.length !== 6
              ? "bg-gray-300"
              : "bg-blue-500 active:bg-blue-600"
          }`}
        >
          <Text
            className={`text-lg font-semibold ${
              isLoading || code.length !== 6 ? "text-gray-500" : "text-white"
            }`}
          >
            {isLoading ? "Verifying..." : "Confirm"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default ConfirmNumber;
