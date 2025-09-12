import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import ReactNativeModal from "react-native-modal";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import CustomButton from "@/components/CustomButton";
import DropdownField from "@/components/DropDownField";
import GoogleTextInput from "@/components/GoogleTextInput";
import {
  CarImagesComponent,
  CertificateRegistrationComponent,
  OfficialReceiptComponent,
} from "@/components/ImagePicker";
import InputField from "@/components/InputField";
import TextAreaField from "@/components/TextAreaField";
import { icons } from "@/constants";
import { uploadCarListing } from "@/services/carService";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export type ImageType = {
  uri: string;
  name?: string;
  type?: string;
};

type FormFields = {
  make: string;
  model: string;
  year: string;
  carType: string;
  description: string;
  dailyRate: string;
  location: string;
  latitude: number;
  longitude: number;
  transmission: string;
  fuel: string;
  seats: string;
};

type StepWrapperProps = {
  title: string;
  message: string;
  children: React.ReactNode;
};

const StepWrapper: React.FC<StepWrapperProps> = ({
  title,
  message,
  children,
}) => (
  <KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    style={{ flex: 1, width }}
    keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
  >
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingTop: 40,
          paddingBottom: 90,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-2xl font-JakartaBold">{title}</Text>
        <Text className="text-base text-gray-500 mt-1 mb-5">{message}</Text>
        <View style={{ flex: 1 }}>{children}</View>
      </ScrollView>
    </TouchableWithoutFeedback>
  </KeyboardAvoidingView>
);

export default function OnboardingListing() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [success, setSuccess] = useState(false);

  const translateX = useSharedValue(0);

  const [form, setForm] = useState<FormFields>({
    make: "",
    model: "",
    year: "",
    carType: "",
    description: "",
    dailyRate: "",
    location: "",
    latitude: 0,
    longitude: 0,
    transmission: "",
    fuel: "",
    seats: "",
  });

  const [carImages, setCarImages] = useState<ImageType[]>([]);
  const [receipt, setReceipt] = useState<ImageType[]>([]);
  const [certificateRegistration, setCertificateRegistration] = useState<
    ImageType[]
  >([]);

  // Validation functions for each step
  const validateStep1 = () => {
    const required = ["make", "model", "year", "carType"];
    const missing = required.filter((field) => !form[field as keyof FormFields]);

    if (missing.length > 0) {
      Alert.alert(
        "Missing Information",
        `Please fill in: ${missing.join(", ")}`
      );
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!form.dailyRate || !form.location) {
      Alert.alert(
        "Missing Information",
        "Please fill in daily rate and location"
      );
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!form.transmission || !form.fuel || !form.seats) {
      Alert.alert(
        "Missing Information",
        "Please fill in transmission, fuel type, and seats"
      );
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
    if (carImages.length < 3) {
      Alert.alert("Missing Images", "Please upload at least 3 car images");
      return false;
    }

    if (receipt.length === 0) {
      Alert.alert("Missing Document", "Please upload the Official Receipt");
      return false;
    }

    if (certificateRegistration.length === 0) {
      Alert.alert(
        "Missing Document",
        "Please upload the Certificate of Registration"
      );
      return false;
    }

    return true;
  };

  const validateCurrentStep = () => {
    switch (step) {
      case 0:
        return validateStep1();
      case 1:
        return validateStep2();
      case 2:
        return validateStep3();
      case 3:
        return validateStep4();
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (!validateCurrentStep()) return;

    if (step < 4) {
      const newStep = step + 1;
      setStep(newStep);
      translateX.value = withTiming(-newStep * width, { duration: 300 });
    }
  };

  const onCreateCarPress = async () => {
    if (!validateCurrentStep()) return;

    setIsUploading(true);

    try {
      const result = await uploadCarListing(
        form,
        carImages,
        receipt,
        certificateRegistration
      );

      setSuccess(true);
      Alert.alert(
        "Success!",
        "Your car listing has been uploaded successfully and is pending approval.",
        [
          {
            text: "OK",
            onPress: () => {
              // router.back();
              resetForm();
            },
          },
        ]
      );
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
        Alert.alert("Error", "Failed to upload car listing. Please try again.");
      } else {
        console.error(String(error));
        Alert.alert("Error", "An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsUploading(false);
      setSuccess(false);
    }
  };

  const resetForm = () => {
    setForm({
      make: "",
      model: "",
      year: "",
      carType: "",
      description: "",
      dailyRate: "",
      location: "",
      latitude: 0,
      longitude: 0,
      transmission: "",
      fuel: "",
      seats: "",
    });
    setCarImages([]);
    setReceipt([]);
    setCertificateRegistration([]);
  };

  const handleLocationPress = (location: {
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

  const steps = [
    <StepWrapper
      key="1"
      title="Step 1: Basic Information"
      message="Let's start with the basics — tell us about your car."
    >
      <InputField
        label="Make"
        placeholder="e.g. Toyota"
        icon={icons.email}
        textContentType="none"
        value={form.make}
        onChangeText={(v) => setForm({ ...form, make: v })}
      />
      <InputField
        label="Model"
        placeholder="e.g. Camry"
        icon={icons.email}
        textContentType="none"
        value={form.model}
        onChangeText={(v) => setForm({ ...form, model: v })}
      />
      <InputField
        label="Year"
        keyboardType="numeric"
        placeholder="e.g. 2023"
        maxLength={4}
        icon={icons.email}
        textContentType="none"
        value={form.year}
        onChangeText={(v) => setForm({ ...form, year: v })}
      />
      <InputField
        label="Car type"
        placeholder="e.g. SUV, Van, Truck"
        icon={icons.email}
        textContentType="none"
        value={form.carType}
        onChangeText={(v) => setForm({ ...form, carType: v })}
      />
      <TextAreaField
        label="Description"
        placeholder="Describe your car"
        value={form.description}
        onChangeText={(v) => setForm({ ...form, description: v })}
      />
    </StepWrapper>,

    <StepWrapper
      key="2"
      title="Step 2: Pricing & Location"
      message="How much is your ride worth per day? And where can renters pick it up?"
    >
      <InputField
        label="Daily Rate"
        keyboardType="numeric"
        placeholder="e.g. ₱50"
        icon={icons.email}
        textContentType="none"
        value={form.dailyRate}
        onChangeText={(v) => setForm({ ...form, dailyRate: v })}
      />
      <View className="mb-4">
        <Text className="text-lg font-JakartaSemiBold mb-3">Location</Text>
        <GoogleTextInput
          icon={icons.pin}
          handlePress={handleLocationPress}
        />
      </View>
    </StepWrapper>,

    <StepWrapper
      key="3"
      title="Step 3: Specifications"
      message="Give renters the details they care about."
    >
      <DropdownField
        label="Transmission"
        items={[
          { label: "Automatic", value: "Automatic" },
          { label: "Manual", value: "Manual" },
          { label: "Electric", value: "Electric" },
        ]}
        placeholder="Select Transmission"
        value={form.transmission}
        onChangeValue={(v) => setForm({ ...form, transmission: v ?? "" })}
      />
      <InputField
        label="Seats"
        placeholder="e.g 2, 4, 5"
        keyboardType="numeric"
        maxLength={2}
        icon={icons.email}
        textContentType="none"
        value={form.seats}
        onChangeText={(v) => setForm({ ...form, seats: v })}
      />
      <DropdownField
        label="Fuel Type"
        items={[
          { label: "Gasoline", value: "Gasoline" },
          { label: "Diesel", value: "Diesel" },
          { label: "Electric", value: "Electric" },
        ]}
        placeholder="Select Fuel Type"
        value={form.fuel}
        onChangeValue={(v) => setForm({ ...form, fuel: v ?? "" })}
      />
    </StepWrapper>,

    <StepWrapper
      key="4"
      title="Step 4: Photos & Documents"
      message="Show off your car and upload the required documents. A great photo = faster bookings!"
    >
      <CarImagesComponent onImagesChange={setCarImages} />
      <OfficialReceiptComponent onImagesChange={setReceipt} />
      <CertificateRegistrationComponent
        onImagesChange={setCertificateRegistration}
      />
    </StepWrapper>,

    <StepWrapper
      key="5"
      title="Step 5: Review & Submit"
      message="Almost done! Double-check your details before going live."
    >
      <Text className="text-base text-gray-600 mb-2">Make: {form.make}</Text>
      <Text className="text-base text-gray-600 mb-2">Model: {form.model}</Text>
      <Text className="text-base text-gray-600 mb-2">Year: {form.year}</Text>
      <Text className="text-base text-gray-600 mb-2">
        Car Type: {form.carType}
      </Text>
      <Text className="text-base text-gray-600 mb-2">
        Daily Rate: {form.dailyRate}
      </Text>
      <Text className="text-base text-gray-600 mb-2">
        Location: {form.location}
      </Text>
      <Text className="text-base text-gray-600 mb-2">
        Transmission: {form.transmission}
      </Text>
      <Text className="text-base text-gray-600 mb-2">
        Seats: {form.seats}
      </Text>
      <Text className="text-base text-gray-600 mb-2">
        Fuel Type: {form.fuel}
      </Text>
      <Text className="text-base text-gray-600 mb-2">
        Car Images: {carImages.length} uploaded
      </Text>
      <Text className="text-base text-gray-600 mb-2">
        Official Receipt: {receipt.length > 0 ? "Uploaded" : "Not uploaded"}
      </Text>
      <Text className="text-base text-gray-600 mb-2">
        Certificate of Registration: {certificateRegistration.length > 0 ? "Uploaded" : "Not uploaded"}
      </Text>
    </StepWrapper>,
  ];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    flexDirection: "row",
    width: width * steps.length,
  }));

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
        <Animated.View
          style={[{ flex: 1, flexDirection: "row" }, animatedStyle]}
        >
          {steps.map((stepComponent, i) => (
            <View key={i} style={{ width }}>
              {stepComponent}
            </View>
          ))}
        </Animated.View>

        <ReactNativeModal
          isVisible={isUploading}
          backdropColor="black"
          backdropOpacity={0.5}
        >
          <View className="bg-white px-7 py-9 rounded-[5px] flex items-center justify-center">
            <ActivityIndicator size="large" color="#007DFC" />
            <Text className="text-base text-gray-400 font-Jakarta text-center mt-2">
              Please wait while we upload your car listing.
            </Text>
          </View>
        </ReactNativeModal>
      </SafeAreaView>

      <View
        className="bg-white flex-row justify-between items-center"
        style={{
          position: "absolute",
          bottom: insets.bottom,
          left: 0,
          right: 0,
          paddingHorizontal: 16,
        }}
      >
        {step > 0 ? (
          <Pressable
            className="px-5 py-2"
            onPress={() => {
              const newStep = step - 1;
              setStep(newStep);
              translateX.value = withTiming(-newStep * width, {
                duration: 300,
              });
            }}
          >
            <Text
              className="font-JakartaSemiBold text-gray-700"
              style={{ textDecorationLine: "underline" }}
            >
              Back
            </Text>
          </Pressable>
        ) : (
          <View style={{ width: 60 }} />
        )}

        <View className="w-[180px]">
          <CustomButton
            title={step === steps.length - 1 ? "create listing" : "Next"}
            onPress={step === steps.length - 1 ? onCreateCarPress : nextStep}
            disabled={isUploading}
          />
        </View>
      </View>
    </>
  );
}