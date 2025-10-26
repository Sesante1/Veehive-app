import CustomButton from "@/components/CustomButton";
import DropdownField from "@/components/DropDownField";
import GoogleTextInput from "@/components/GoogleTextInput";
import type { ImageType } from "@/components/ImagePicker";
import {
  CarImagesComponent,
  CertificateRegistrationComponent,
  OfficialReceiptComponent,
} from "@/components/ImagePicker";
import InputField from "@/components/InputField";
import TextAreaField from "@/components/TextAreaField";
import { icons } from "@/constants";
import { useUserData } from "@/hooks/useUser";
import { uploadCarListing } from "@/services/carService";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import ReactNativeModal from "react-native-modal";
import { SafeAreaView } from "react-native-safe-area-context";

const CreateCar = () => {
  const { userData } = useUserData();
  const [carImages, setCarImages] = useState<ImageType[]>([]);
  const [receipt, setReceipt] = useState<ImageType[]>([]);
  const [certificateRegistration, setCertificateRegistration] = useState<
    ImageType[]
  >([]);

  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

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

  // Check if host identity is approved
  const isHostApproved = () => {
    // Type assertion to access verificationStatus
    const identityVerification = userData?.identityVerification as any;
    return identityVerification?.verificationStatus === "approved";
  };

  // Check approval status on component mount
  useEffect(() => {
    if (userData && !isHostApproved()) {
      setShowApprovalModal(true);
    }
  }, [userData]);

  // Validation function
  const validateForm = () => {
    const required: (keyof FormFields)[] = [
      "make",
      "model",
      "year",
      "carType",
      "dailyRate",
      "location",
      "transmission",
      "fuel",
      "seats",
    ];
    const missing = required.filter((field) => !form[field]);

    if (missing.length > 0) {
      Alert.alert(
        "Missing Information",
        `Please fill in: ${missing.join(", ")}`
      );
      return false;
    }

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

  const onCreateCarPress = async () => {
    // Check if host is approved first
    if (!isHostApproved()) {
      setShowApprovalModal(true);
      return;
    }

    if (!validateForm()) return;

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
              router.back();
              resetForm();
            },
          },
        ]
      );
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error(String(error));
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

  const getApprovalStatusMessage = () => {
    const identityVerification = userData?.identityVerification as any;
    const status = identityVerification?.verificationStatus;

    if (!userData?.identityVerification) {
      return {
        title: "Identity Verification Required",
        message:
          "You need to submit your identity verification documents before creating a listing.",
        actionText: "Complete Verification",
      };
    }

    if (status === "pending") {
      return {
        title: "Verification Pending",
        message:
          "Your identity verification is currently under review. You'll be able to create listings once approved.",
        actionText: "Go Back",
      };
    }

    if (status === "rejected") {
      return {
        title: "Verification Rejected",
        message:
          "Your identity verification was rejected. Please resubmit your documents for review.",
        actionText: "Resubmit Documents",
      };
    }

    return {
      title: "Approval Required",
      message:
        "Your host account must be approved before you can create listings.",
      actionText: "Go Back",
    };
  };

  const handleApprovalModalAction = () => {
    const identityVerification = userData?.identityVerification as any;
    const status = identityVerification?.verificationStatus;

    setShowApprovalModal(false);

    if (!userData?.identityVerification || status === "rejected") {
      router.push("/completeRequiredSteps");
    } else {
      router.back();
    }
  };

  const approvalMessage = getApprovalStatusMessage();

  return (
    <SafeAreaView className="flex-1 bg-white px-4">
      <View className="flex bg-gray items-center py-2 mb-2">
        <Pressable
          className="bg-white rounded-full p-1 absolute left-0 top-1"
          onPress={() => {
            router.back();
          }}
        >
          <Image source={icons.backArrow} style={{ width: 30, height: 30 }} />
        </Pressable>

        <Text className="text-2xl font-JakartaSemiBold">Create Listing</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 45 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-2xl font-JakartaBold my-5">
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

        <View className="mb-4" style={{ zIndex: 1000 }}>
          <Text className="text-lg font-JakartaSemiBold mb-3">Location</Text>
          <GoogleTextInput icon={icons.pin} handlePress={handlePress} />
        </View>

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

        <DropdownField
          label="Fuel Type"
          items={[
            { label: "Gasoline", value: "Gasoline" },
            { label: "Diesel", value: "Diesel" },
            { label: "Electric", value: "Electric" },
          ]}
          placeholder="Select Fuel Type"
          onChangeValue={(value) => setForm({ ...form, fuel: value ?? "" })}
          value={form.fuel}
        />

        <CarImagesComponent onImagesChange={setCarImages} />

        <OfficialReceiptComponent onImagesChange={setReceipt} />

        <CertificateRegistrationComponent
          onImagesChange={setCertificateRegistration}
        />

        <CustomButton
          title="Upload listing"
          onPress={onCreateCarPress}
          disabled={isUploading}
          className="mt-10"
        />

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

        {/* Approval Required Bottom Sheet */}
        <ReactNativeModal
          isVisible={showApprovalModal}
          onBackdropPress={() => {}}
          onBackButtonPress={() => {}}
          backdropColor="black"
          backdropOpacity={0.5}
          style={{ margin: 0, justifyContent: "flex-end" }}
        >
          <View className="bg-white rounded-t-3xl px-6 py-8">
            <View className="items-center mb-6">
              <View className="w-16 h-16 bg-orange-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="alert-circle" size={32} color="#F97316" />
              </View>
              <Text className="text-2xl font-JakartaBold text-gray-900 text-center">
                {approvalMessage.title}
              </Text>
            </View>

            <Text className="text-base text-gray-600 font-JakartaMedium text-center mb-8 leading-6">
              {approvalMessage.message}
            </Text>

            <CustomButton
              title={approvalMessage.actionText}
              onPress={handleApprovalModalAction}
              className="mb-3"
            />

            {/* {(userData?.identityVerification as any)?.verificationStatus ===
              "pending" && (
              <Pressable
                onPress={() => setShowApprovalModal(false)}
                className="py-3"
              >
                <Text className="text-center text-gray-500 font-JakartaMedium">
                  Continue Editing
                </Text>
              </Pressable>
            )} */}
          </View>
        </ReactNativeModal>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateCar;
