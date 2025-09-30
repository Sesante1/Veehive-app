import { icons } from "@/constants";
import { sendVerificationCode } from "@/services/verificationService";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const EditPhoneNumber = () => {
  const { phoneNumber, id } = useLocalSearchParams();

  // Extract only the digits after +63 for display
  const extractPhoneDigits = (fullNumber: string): string => {
    if (!fullNumber) return "";
    const digits = fullNumber.replace(/\D/g, "");
    if (digits.startsWith("63")) {
      return digits.substring(2); 
    }
    if (digits.startsWith("0")) {
      return digits.substring(1);
    }
    return digits;
  };

  const [phone, setPhone] = React.useState(
    extractPhoneDigits(phoneNumber as string) || ""
  );
  const [isLoading, setIsLoading] = React.useState(false);

  const formatDisplayNumber = (input: string): string => {
    const digits = input.replace(/\D/g, "");

    const limitedDigits = digits.slice(0, 10);

    // Format as XXX XXX XXXX for better readability
    if (limitedDigits.length <= 3) {
      return limitedDigits;
    } else if (limitedDigits.length <= 6) {
      return `${limitedDigits.slice(0, 3)} ${limitedDigits.slice(3)}`;
    } else {
      return `${limitedDigits.slice(0, 3)} ${limitedDigits.slice(3, 6)} ${limitedDigits.slice(6)}`;
    }
  };

  const handleSave = async () => {
    if (!phone) return;

    const cleanDigits = phone.replace(/\D/g, "");
    if (cleanDigits.length !== 10) {
      Alert.alert(
        "Invalid Number",
        "Please enter exactly 10 digits for your mobile number."
      );
      return;
    }

    if (!cleanDigits.startsWith("9")) {
      Alert.alert(
        "Invalid Number",
        "Philippines mobile numbers must start with 9."
      );
      return;
    }

    setIsLoading(true);

    try {
      const result = await sendVerificationCode(cleanDigits);
      setIsLoading(false);

      if (result.success) {
        router.push({
          pathname: "/confirmNumber",
          params: {
            phoneNumber: `+63${cleanDigits}`, // Show full number in confirmation screen
            id: id as string,
            sessionInfo: result.sessionInfo,
            isTestNumber: result.isTestNumber!.toString(),
            testCode: result.testCode,
          },
        });
      } else {
        Alert.alert("Error", result.error || "Failed to send code. Try again.");
      }
    } catch (error: any) {
      setIsLoading(false);
      Alert.alert("Error", error.message || "Failed to send code. Try again.");
    }
  };

  const canSave = phone.replace(/\D/g, "").length === 10 && !isLoading;

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

      {/* Content */}
      <View className="flex-1 p-4">
        <View className="mb-4">
          <Text className="text-base font-JakartaSemiBold text-gray-900 mb-2">
            Mobile Number
          </Text>

          {/* Country Code Display */}
          <View className="flex-row items-center border border-gray-300 rounded-lg">
            <View className="px-4 py-3 border-r border-gray-300 bg-gray-50">
              <Text className="text-lg text-gray-700 font-semibold">+63</Text>
            </View>
            <TextInput
              placeholder="912 345 6789"
              value={formatDisplayNumber(phone)}
              onChangeText={(text) => {
                const digits = text.replace(/\D/g, "").slice(0, 10);
                setPhone(digits);
              }}
              keyboardType="numeric"
              style={{ flex: 1 }}
              maxLength={13} 
            />
          </View>
        </View>

        <View className="mt-2">
          <Text className="text-sm text-gray-500">
            • Enter your 10-digit mobile number
          </Text>
          <Text className="text-sm text-gray-500">
            • Must start with 9 (e.g., 912 345 6789)
          </Text>
          <Text className="text-sm text-gray-500 mt-2">
            A verification code will be sent via SMS.
          </Text>
        </View>
      </View>

      {/* Save Button */}
      <View className="px-4">
        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          className={`flex items-center justify-center py-4 px-12 rounded-xl ${
            canSave ? "bg-blue-500 active:bg-blue-600" : "bg-gray-300"
          }`}
        >
          {isLoading ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator size="small" color="white" />
              <Text className="text-lg text-white font-JakartaSemiBold">
                Sending...
              </Text>
            </View>
          ) : (
            <Text
              className={`text-lg font-JakartaSemiBold ${
                canSave ? "text-white" : "text-gray-500"
              }`}
            >
              Send verification code
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default EditPhoneNumber;
