import CustomButton from "@/components/CustomButton";
import DropdownField from "@/components/DropDownField";
import type { ImageType } from "@/components/ImagePicker";
import {
  CarImagesComponent,
  CertificateRegistrationComponent,
  OfficialReceiptComponent,
} from "@/components/ImagePicker";
import InputField from "@/components/InputField";
import TextAreaField from "@/components/TextAreaField";
import { icons } from "@/constants";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CreateCar = () => {
  const [carImages, setCarImages] = useState<ImageType[]>([]);
  const [receipt, setReceipt] = useState([]);

  const [form, setForm] = useState({
    make: "",
    model: "",
    year: "",
    carType: "",
    description: "",
    dailyRate: "",
    location: "",
    transmission: "",
    seats: "",
  });

  const onCreateCarPress = () => {
    const {
      make,
      model,
      year,
      carType,
      description,
      dailyRate,
      location,
      transmission,
      seats,
    } = form;

    console.log("clicked");
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-8">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-2xl font-JakartaBold mb-5">
            Basic Information
          </Text>
          <InputField
            label="Make"
            placeholder="e.g. Toyota"
            icon={icons.email}
            textContentType="none"
            value={form.make}
            onChangeText={(value) => setForm({ ...form, make: value })}
          />

          <InputField
            label="Model"
            placeholder="e.g. Camry"
            icon={icons.email}
            textContentType="none"
            value={form.model}
            onChangeText={(value) => setForm({ ...form, model: value })}
          />

          <InputField
            label="Year"
            keyboardType="numeric"
            placeholder="e.g. 2023"
            maxLength={4}
            icon={icons.email}
            textContentType="none"
            value={form.year}
            onChangeText={(value) => setForm({ ...form, year: value })}
          />

          <InputField
            label="Car type"
            placeholder="e.g. SUV, Van, Truck"
            icon={icons.email}
            textContentType="none"
            value={form.carType}
            onChangeText={(value) => setForm({ ...form, carType: value })}
          />

          <TextAreaField
            label="Description"
            placeholder="Describe your car"
            value={form.description}
            onChangeText={(value) => setForm({ ...form, description: value })}
          />

          <Text className="text-2xl font-JakartaBold my-5">
            Pricing and location
          </Text>

          <InputField
            label="Daily Rate"
            keyboardType="numeric"
            placeholder="e.g. $50"
            icon={icons.email}
            textContentType="none"
            value={form.dailyRate}
            onChangeText={(value) => setForm({ ...form, dailyRate: value })}
          />

          <InputField
            label="Location"
            placeholder="e.g San Francisco, CA"
            icon={icons.email}
            textContentType="none"
            value={form.location}
            onChangeText={(value) => setForm({ ...form, location: value })}
          />

          <Text className="text-2xl font-JakartaBold my-5">Specifications</Text>

          <DropdownField
            label="Transmission"
            items={[
              { label: "Automatic", value: "Automatic" },
              { label: "Manual", value: "Manual" },
              { label: "Electric", value: "Electric" },
            ]}
            placeholder="Select Transmission"
            onChangeValue={(value) =>
              setForm({ ...form, transmission: value ?? "" })
            }
            value={form.transmission}
          />

          <InputField
            label="Seats"
            placeholder="e.g 2, 4, 5"
            keyboardType="numeric"
            maxLength={2}
            icon={icons.email}
            textContentType="none"
            value={form.seats}
            onChangeText={(value) => setForm({ ...form, seats: value })}
          />

          <CarImagesComponent onImagesChange={setCarImages} />

          <OfficialReceiptComponent onImagesChange={setCarImages} />

          <CertificateRegistrationComponent onImagesChange={setCarImages} />

          <CustomButton title="Upload listing" onPress={onCreateCarPress} className="mt-10"/>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateCar;
