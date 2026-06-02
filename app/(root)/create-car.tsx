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
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import ReactNativeModal from "react-native-modal";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCustomAlert } from "@/components/CustomAlert";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SPRING_CONFIG = {
  damping: 20,
  stiffness: 180,
  mass: 0.9,
};

// Step definitions 
const STEPS = [
  { id: 0, title: "Basic Info",       subtitle: "Tell us about your car"         },
  { id: 1, title: "Pricing",          subtitle: "Set your rate and location"     },
  { id: 2, title: "Specifications",   subtitle: "Engine and seat details"        },
  { id: 3, title: "Photos",           subtitle: "Show off your car"              },
  { id: 4, title: "Documents",        subtitle: "Required for verification"      },
];

// Animated Step Slide
type StepSlideProps = {
  children: React.ReactNode;
  stepIndex: number;
  currentStep: number;
  direction: "forward" | "back";
};

const StepSlide = ({ children, stepIndex, currentStep, direction }: StepSlideProps) => {
  const translateX = useSharedValue(
    stepIndex === 0 ? 0 : SCREEN_WIDTH
  );
  const opacity = useSharedValue(stepIndex === 0 ? 1 : 0);

  useEffect(() => {
    if (stepIndex === currentStep) {
      // Slide in from right (forward) or left (back)
      translateX.value = direction === "forward" ? SCREEN_WIDTH : -SCREEN_WIDTH;
      opacity.value = 0;
      translateX.value = withSpring(0, SPRING_CONFIG);
      opacity.value = withTiming(1, { duration: 250 });
    } else {
      // Slide out
      const outX = stepIndex < currentStep ? -SCREEN_WIDTH : SCREEN_WIDTH;
      translateX.value = withSpring(outX, SPRING_CONFIG);
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [currentStep]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
    position: "absolute",
    width: "100%",
  }));

  return <Animated.View style={animStyle}>{children}</Animated.View>;
};

// Progress Bar
const StepProgressBar = ({ current, total }: { current: number; total: number }) => {
  return (
    <View className="flex-row gap-1 mb-6 px-1">
      {Array.from({ length: total }).map((_, i) => {
        const isComplete = i < current;
        const isActive = i === current;
        return (
          <View
            key={i}
            className="flex-1 h-1 rounded-full overflow-hidden bg-gray-200"
          >
            {(isComplete || isActive) && (
              <Animated.View
                className="h-full rounded-full bg-black"
                style={{
                  width: isComplete ? "100%" : "100%",
                  opacity: isComplete ? 1 : 0.85,
                }}
              />
            )}
          </View>
        );
      })}
    </View>
  );
};

const CreateCar = () => {
  const { userData } = useUserData();
  const { showAlert, AlertComponent } = useCustomAlert();

  const [carImages, setCarImages] = useState<ImageType[]>([]);
  const [receipt, setReceipt] = useState<ImageType[]>([]);
  const [certificateRegistration, setCertificateRegistration] = useState<ImageType[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [errors, setErrors] = useState<Set<string>>(new Set());

  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  // Header animation
  const headerOpacity = useSharedValue(1);
  const headerTranslateY = useSharedValue(0);

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

  const isHostApproved = () => {
    const iv = userData?.identityVerification as any;
    return iv?.verificationStatus === "approved";
  };

  useEffect(() => {
    if (userData && !isHostApproved()) {
      setShowApprovalModal(true);
    }
  }, [userData]);

  const handleFormChange = (field: keyof FormFields, value: string) => {
    setForm({ ...form, [field]: value });
    if (errors.has(field)) {
      const newErrors = new Set(errors);
      newErrors.delete(field);
      setErrors(newErrors);
    }
  };

  const handlePress = (location: {
    address: string;
    latitude: number;
    longitude: number;
  }) => {
    setForm({
      ...form,
      location: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
    });
    if (errors.has("location")) {
      const newErrors = new Set(errors);
      newErrors.delete("location");
      setErrors(newErrors);
    }
  };

  // Animate header out, change step, animate back in
  const animateStepChange = (nextStep: number, dir: "forward" | "back") => {
    headerOpacity.value = withTiming(0, { duration: 150 }, () => {
      runOnJS(setCurrentStep)(nextStep);
      runOnJS(setDirection)(dir);
      headerOpacity.value = withTiming(1, { duration: 250 });
      headerTranslateY.value = withSpring(0, SPRING_CONFIG);
    });
    headerTranslateY.value = withTiming(dir === "forward" ? -8 : 8, { duration: 150 });
  };

  // Per-step validation
  const validateStep = (step: number): boolean => {
    const newErrors = new Set<string>();

    if (step === 0) {
      if (!form.make) newErrors.add("make");
      if (!form.model) newErrors.add("model");
      if (!form.year) newErrors.add("year");
      if (!form.carType) newErrors.add("carType");
    } else if (step === 1) {
      if (!form.dailyRate) newErrors.add("dailyRate");
      if (!form.location) newErrors.add("location");
    } else if (step === 2) {
      if (!form.transmission) newErrors.add("transmission");
      if (!form.seats) newErrors.add("seats");
      if (!form.fuel) newErrors.add("fuel");
    } else if (step === 3) {
      if (carImages.length < 3) {
        showAlert({
          title: "Missing Images",
          message: "Please upload at least 3 car photos to continue.",
          icon: "images-outline",
          iconColor: "#EF4444",
          buttons: [{ text: "OK", style: "default" }],
        });
        return false;
      }
    } else if (step === 4) {
      if (receipt.length === 0) {
        showAlert({
          title: "Missing Document",
          message: "Please upload the Official Receipt.",
          icon: "document-text-outline",
          iconColor: "#EF4444",
          buttons: [{ text: "OK", style: "default" }],
        });
        return false;
      }
      if (certificateRegistration.length === 0) {
        showAlert({
          title: "Missing Document",
          message: "Please upload the Certificate of Registration.",
          icon: "document-text-outline",
          iconColor: "#EF4444",
          buttons: [{ text: "OK", style: "default" }],
        });
        return false;
      }
    }

    if (newErrors.size > 0) {
      setErrors(newErrors);
      showAlert({
        title: "Missing Information",
        message: "Please fill in all required fields.",
        icon: "alert-circle",
        iconColor: "#EF4444",
        buttons: [{ text: "OK", style: "default" }],
      });
      return false;
    }

    return true;
  };

  const goNext = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < STEPS.length - 1) {
      animateStepChange(currentStep + 1, "forward");
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      animateStepChange(currentStep - 1, "back");
    } else {
      router.back();
    }
  };

  const onSubmit = async () => {
    if (!isHostApproved()) {
      setShowApprovalModal(true);
      return;
    }
    if (!validateStep(4)) return;

    setIsUploading(true);
    try {
      await uploadCarListing(form, carImages, receipt, certificateRegistration);
      showAlert({
        title: "Listing Submitted!",
        message: "Your car is pending approval. We'll notify you once it's live.",
        icon: "checkmark-circle",
        iconColor: "#10B981",
        buttons: [
          {
            text: "Done",
            style: "default",
            onPress: () => {
              router.back();
              resetForm();
            },
          },
        ],
      });
    } catch (error) {
      showAlert({
        title: "Upload Failed",
        message:
          error instanceof Error ? error.message : "Something went wrong.",
        icon: "close-circle",
        iconColor: "#EF4444",
        buttons: [{ text: "OK", style: "default" }],
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setForm({
      make: "", model: "", year: "", carType: "", description: "",
      dailyRate: "", location: "", latitude: 0, longitude: 0,
      transmission: "", fuel: "", seats: "",
    });
    setCarImages([]);
    setReceipt([]);
    setCertificateRegistration([]);
    setErrors(new Set());
    setCurrentStep(0);
  };

  const getApprovalStatusMessage = () => {
    const iv = userData?.identityVerification as any;
    const status = iv?.verificationStatus;
    if (!userData?.identityVerification) {
      return { title: "Identity Verification Required", message: "Submit your identity documents before creating a listing.", actionText: "Complete Verification" };
    }
    if (status === "pending") {
      return { title: "Verification Pending", message: "Your identity is under review. You'll be able to list once approved.", actionText: "Go Back" };
    }
    if (status === "rejected") {
      return { title: "Verification Rejected", message: "Your verification was rejected. Please resubmit your documents.", actionText: "Resubmit Documents" };
    }
    return { title: "Approval Required", message: "Your host account must be approved before listing.", actionText: "Go Back" };
  };

  const handleApprovalModalAction = () => {
    const iv = userData?.identityVerification as any;
    const status = iv?.verificationStatus;
    setShowApprovalModal(false);
    if (!userData?.identityVerification || status === "rejected") {
      router.push("/completeRequiredSteps");
    } else {
      router.back();
    }
  };

  const approvalMessage = getApprovalStatusMessage();

  const headerAnimStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* ── Top Bar ── */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
        <Pressable
          onPress={goBack}
          className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
        >
          <Image source={icons.backArrow} style={{ width: 20, height: 20 }} />
        </Pressable>

        <View className="flex-1 items-center">
          <Text className="text-sm font-JakartaMedium text-gray-400">
            Step {currentStep + 1} of {STEPS.length}
          </Text>
        </View>

        {/* spacer to balance the back button */}
        <View className="w-10" />
      </View>

      {/* ── Progress Bar ── */}
      <View className="px-4 pt-4">
        <StepProgressBar current={currentStep} total={STEPS.length} />

        {/* Animated Step Title */}
        <Animated.View style={headerAnimStyle} className="mb-6">
          <Text className="text-3xl font-JakartaBold text-gray-900">
            {STEPS[currentStep].title}
          </Text>
          <Text className="text-base font-Jakarta text-gray-500 mt-1">
            {STEPS[currentStep].subtitle}
          </Text>
        </Animated.View>
      </View>

      {/* ── Sliding Step Content ── */}
      <View className="flex-1" style={{ overflow: "hidden" }}>
        {/* Step 0 — Basic Info */}
        <StepSlide stepIndex={0} currentStep={currentStep} direction={direction}>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
            <InputField
              label="Make"
              placeholder="e.g. Toyota"
              icon={icons.email}
              textContentType="none"
              value={form.make}
              onChangeText={(v) => handleFormChange("make", v)}
              hasError={errors.has("make")}
            />
            <InputField
              label="Model"
              placeholder="e.g. Camry"
              icon={icons.email}
              textContentType="none"
              value={form.model}
              onChangeText={(v) => handleFormChange("model", v)}
              hasError={errors.has("model")}
            />
            <InputField
              label="Year"
              keyboardType="numeric"
              placeholder="e.g. 2023"
              maxLength={4}
              icon={icons.email}
              textContentType="none"
              value={form.year}
              onChangeText={(v) => handleFormChange("year", v)}
              hasError={errors.has("year")}
            />
            <InputField
              label="Car Type"
              placeholder="e.g. SUV, Van, Truck"
              icon={icons.email}
              textContentType="none"
              value={form.carType}
              onChangeText={(v) => handleFormChange("carType", v)}
              hasError={errors.has("carType")}
            />
            <TextAreaField
              label="Description"
              placeholder="Describe your car (optional)"
              value={form.description}
              onChangeText={(v) => handleFormChange("description", v)}
            />
          </ScrollView>
        </StepSlide>

        {/* Step 1 — Pricing & Location */}
        <StepSlide stepIndex={1} currentStep={currentStep} direction={direction}>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
            <InputField
              label="Daily Rate"
              keyboardType="numeric"
              placeholder="e.g. ₱2,500"
              icon={icons.email}
              textContentType="none"
              value={form.dailyRate}
              onChangeText={(v) => handleFormChange("dailyRate", v)}
              hasError={errors.has("dailyRate")}
            />
            <View className="mb-4" style={{ zIndex: 1000 }}>
              <Text className="text-lg font-JakartaSemiBold mb-3">
                Location{" "}
                {errors.has("location") && (
                  <Text className="text-red-500">*</Text>
                )}
              </Text>
              <GoogleTextInput
                icon={icons.pin}
                handlePress={handlePress}
                containerStyle={
                  errors.has("location")
                    ? "border border-red-500 rounded-xl"
                    : ""
                }
              />
            </View>
          </ScrollView>
        </StepSlide>

        {/* Step 2 — Specifications */}
        <StepSlide stepIndex={2} currentStep={currentStep} direction={direction}>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
            <DropdownField
              label="Transmission"
              items={[
                { label: "Automatic", value: "Automatic" },
                { label: "Manual", value: "Manual" },
                { label: "Electric", value: "Electric" },
              ]}
              placeholder="Select Transmission"
              onChangeValue={(v) => handleFormChange("transmission", v ?? "")}
              value={form.transmission}
              hasError={errors.has("transmission")}
            />
            <InputField
              label="Seats"
              placeholder="e.g. 5"
              keyboardType="numeric"
              maxLength={2}
              icon={icons.email}
              textContentType="none"
              value={form.seats}
              onChangeText={(v) => handleFormChange("seats", v)}
              hasError={errors.has("seats")}
            />
            <DropdownField
              label="Fuel Type"
              items={[
                { label: "Gasoline", value: "Gasoline" },
                { label: "Diesel", value: "Diesel" },
                { label: "Electric", value: "Electric" },
              ]}
              placeholder="Select Fuel Type"
              onChangeValue={(v) => handleFormChange("fuel", v ?? "")}
              value={form.fuel}
              hasError={errors.has("fuel")}
            />
          </ScrollView>
        </StepSlide>

        {/* Step 3 — Photos */}
        <StepSlide stepIndex={3} currentStep={currentStep} direction={direction}>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
            <Text className="text-sm font-Jakarta text-gray-500 mb-4">
              Upload at least 3 photos — front, rear, interior, and any notable
              features.
            </Text>
            <CarImagesComponent onImagesChange={setCarImages} />
          </ScrollView>
        </StepSlide>

        {/* Step 4 — Documents */}
        <StepSlide stepIndex={4} currentStep={currentStep} direction={direction}>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
            <Text className="text-sm font-Jakarta text-gray-500 mb-4">
              These documents are required to verify your vehicle before it goes
              live.
            </Text>
            <OfficialReceiptComponent onImagesChange={setReceipt} />
            <CertificateRegistrationComponent
              onImagesChange={setCertificateRegistration}
            />
          </ScrollView>
        </StepSlide>
      </View>

      {/* Bottom Navigation Bar */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4"
        style={{ paddingBottom: 28 }}
      >
        <View className="flex-row items-center gap-3">
          {currentStep > 0 && (
            <Pressable
              onPress={goBack}
              className="flex-1 h-14 rounded-xl border border-gray-300 items-center justify-center"
            >
              <Text className="text-base font-JakartaSemiBold text-gray-700">
                Back
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={isLastStep ? onSubmit : goNext}
            disabled={isUploading}
            className="flex-1 h-14 rounded-xl bg-black items-center justify-center"
            style={{ opacity: isUploading ? 0.6 : 1 }}
          >
            <Text className="text-base font-JakartaSemiBold text-white">
              {isLastStep ? "Submit Listing" : "Continue"}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* ── Uploading Modal ── */}
      <ReactNativeModal
        isVisible={isUploading}
        backdropColor="black"
        backdropOpacity={0.5}
      >
        <View className="bg-white px-7 py-9 rounded-2xl flex items-center justify-center">
          <ActivityIndicator size="large" color="#000" />
          <Text className="text-base text-gray-400 font-Jakarta text-center mt-3">
            Uploading your listing…
          </Text>
        </View>
      </ReactNativeModal>

      {/* ── Approval Modal ── */}
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
        </View>
      </ReactNativeModal>

      <AlertComponent />
    </SafeAreaView>
  );
};

export default CreateCar;