import InputField from "@/components/InputField";
import { icons } from "@/constants";
import { updateUserName } from "@/services/userService";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const EditName = () => {
  const { firstName, lastName, id } = useLocalSearchParams();

  const [form, setForm] = React.useState({
    firstName: (firstName as string) || "",
    lastName: (lastName as string) || "",
  });

  const [isLoading, setIsLoading] = React.useState(false);

  const canSave = form.firstName.trim() !== "" && form.lastName.trim() !== "";

  const handleSave = async () => {
    if (!canSave) return;

    setIsLoading(true);
    const result = await updateUserName(
      id as string,
      form.firstName,
      form.lastName
    );
    setIsLoading(false);

    if (result.success) {
      Alert.alert("Success", "Name updated successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } else {
      Alert.alert("Error", result.error || "Failed to update name.");
    }
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
          Enter your legal name
        </Text>
      </View>

      {/* Content */}
      <View className="flex-1 p-4">
        <InputField
          placeholder="Jhon"
          label="First Name"
          value={form.firstName}
          onChangeText={(text) => setForm({ ...form, firstName: text })}
        />
        <InputField
          placeholder="Doe"
          label="Last Name"
          value={form.lastName}
          onChangeText={(text) => setForm({ ...form, lastName: text })}
        />
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

export default EditName;
