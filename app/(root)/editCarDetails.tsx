import InputField from "@/components/InputField";
import { icons } from "@/constants";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CarDetails: React.FC = () => {
  const { make, model, year, carType } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    make: (make as string) || "",
    model: (model as string) || "",
    year: year ? String(year) : "",
    carType: (carType as string) || "",
  });

  const handleSave = () => {};

  const currentYear = new Date().getFullYear();
  const yearNum = parseInt(form.year || "", 10);
  const isValidYear =
    !isNaN(yearNum) && yearNum >= 1900 && yearNum <= currentYear + 1;

  const isFormValid =
    form.make.trim() !== "" &&
    form.model.trim() !== "" &&
    form.carType.trim() !== "" &&
    form.year.trim() !== "" &&
    isValidYear;

  const canSave = isFormValid && isValidYear && !isLoading;

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
          Car Details
        </Text>
      </View>

      <View className="flex-1 px-4">
        {/* Inputs */}
        <InputField
          label="Make"
          placeholder="e.g. Toyota, Honda, BMW"
          icon={icons.email}
          value={form.make}
          onChangeText={(value) => setForm({ ...form, make: value })}
        />

        <InputField
          label="Model"
          placeholder="e.g. Camry, Civic, X3"
          icon={icons.email}
          value={form.model}
          onChangeText={(value) => setForm({ ...form, model: value })}
        />

        <InputField
          label="Car Type"
          placeholder="e.g. SUV, Sedan, Van, Truck"
          icon={icons.email}
          value={form.carType}
          onChangeText={(value) => setForm({ ...form, carType: value })}
        />

        <View>
          <InputField
            label="Year"
            keyboardType="numeric"
            placeholder="e.g. 2020"
            icon={icons.email}
            value={form.year}
            onChangeText={(value) => {
              const numericValue = value.replace(/[^0-9]/g, "");
              setForm({ ...form, year: numericValue });
            }}
            maxLength={4}
          />
          {form.year !== "" && !isValidYear && (
            <Text className="text-red-500 text-sm mt-1 font-JakartaMedium">
              Please enter a valid year (1900-{currentYear + 1})
            </Text>
          )}
        </View>
      </View>

      <View className="flex flex-row justify-between items-center mt-auto gap-10 border-t border-t-gray-200 pt-6 px-4">
        <Pressable
          onPress={() => {
            // Handle cancel action
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

export default CarDetails;
