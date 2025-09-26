import TextAreaField from "@/components/TextAreaField";
import { icons } from "@/constants";
import { db } from "@/FirebaseConfig";
import { router, useLocalSearchParams } from "expo-router";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
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

const manageDescription = () => {
  const { description, carId } = useLocalSearchParams();

  const [form, setForm] = useState({
    description: (description as string) || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const canSave = !isLoading && form.description.trim().length > 0;

  const handleSave = async () => {
    if (!carId) {
      Alert.alert(
        "Error",
        "Missing car ID. Please re-open this screen from the car profile."
      );
      return;
    }
    try {
      setIsLoading(true);
      await updateDoc(doc(db, "cars", carId as string), {
        description: form.description.trim(),
        updatedAt: serverTimestamp(),
      });
      Alert.alert("Success", "Description updated");
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to save description");
    } finally {
      setIsLoading(false);
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
          Manage Description
        </Text>
      </View>

      {/* Content */}
      <View className="flex-1 px-4">
        <TextAreaField
          label="Description"
          placeholder="Describe your car"
          value={form.description}
          onChangeText={(value) => setForm({ ...form, description: value })}
        />
      </View>

      <View className="flex flex-row justify-between items-center mt-auto gap-10 border-t border-t-gray-200 pt-6 px-4">
        <Pressable
          onPress={() => {
            router.back();
          }}
        >
          <Text className="text-lg font-JakartaSemiBold">Cancel</Text>
        </Pressable>

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

export default manageDescription;
