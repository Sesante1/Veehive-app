import GoogleTextInput from "@/components/GoogleTextInput";
import { icons } from "@/constants";
import { updateAddress } from "@/services/userService";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const EditAddress = () => {
  const { id } = useLocalSearchParams();
  const [form, setForm] = useState({
    location: "",
    latitude: 0,
    longitude: 0,
  });

  const [isLoading, setIsLoading] = useState(false);

  const canSave = form.location.trim() !== "";

  const handleSave = async () => {
    if (!canSave) return;

    if (typeof id !== "string" || id.length === 0) {
      Alert.alert(
        "Error",
        "We couldn't determine which profile to update. Please try again."
      );
      return;
    }

    setIsLoading(true);
    const result = await updateAddress(
      id,
      form.location,
      form.latitude,
      form.longitude
    );
    setIsLoading(false);

    if (result?.success) {
      Alert.alert("Success", "Address updated successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } else {
      Alert.alert("Error", result?.error || "Failed to update addresss.");
    }
  };

  const handlePress = (location: {
    address: string;
    latitude: number;
    longitude: number;
  }) => {
    console.log("Selected location:", location);
    setForm({
      ...form,
      location: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
    });
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
          Edit Address
        </Text>
      </View>

      {/* Content */}
      <View className="flex-1 p-4">
        <GoogleTextInput icon={icons.pin} handlePress={handlePress} />
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
                Saving...
              </Text>
            </View>
          ) : (
            <Text
              className={`text-lg font-JakartaSemiBold ${
                canSave ? "text-white" : "text-gray-500"
              }`}
            >
              Save
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default EditAddress;
