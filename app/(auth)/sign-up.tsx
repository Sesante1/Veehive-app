import { useCustomAlert } from "@/components/CustomAlert"; 
import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/OAuth";
import { icons } from "@/constants";
import { signUp } from "@/services/authService";
import { Ionicons } from "@expo/vector-icons";
import Checkbox from "expo-checkbox";
import { Link } from "expo-router";
import LottieView from "lottie-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ReactNativeModal from "react-native-modal";

const SignUp = () => {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const { showAlert, AlertComponent } = useCustomAlert();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phoneNumber: "",
    address: "",
    birthDate: "",
    profileImage: "",
    role: {
      Guest: true,
      Hoster: true,
    },
  });

  const [errors, setErrors] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
  });

  const onSignUpPress = async () => {
    const newErrors = {
      firstName: !form.firstName,
      lastName: !form.lastName,
      email: !form.email,
      password: !form.password,
    };

    setErrors(newErrors);

    if (Object.values(newErrors).includes(true)) {
      showAlert({
        title: "Missing Fields",
        message: "Please fill out all required fields.",
        icon: "alert-circle-outline",
        iconColor: "#FF3B30",
        buttons: [{ text: "OK", style: "default" }],
      });
      return;
    }

    if (!isChecked) {
      showAlert({
        title: "Terms & Conditions",
        message: "You must agree to the Terms and Conditions to continue.",
        icon: "alert-circle-outline",
        iconColor: "#FF3B30",
        buttons: [{ text: "OK" }],
      });
      return;
    }

    setIsLoading(true);
    try {
      await signUp(form);
      setShowSuccessModal(true);
    } catch (error: any) {
      showAlert({
        title: "Sign Up Failed",
        message: error.message || "Something went wrong.",
        icon: "close-circle-outline",
        iconColor: "#FF3B30",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ScrollView
        className="flex-1 bg-white"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="flex-1 justify-center items-center bg-white">
          <Text className="text-2xl text-black font-JakartaSemiBold">
            Create Your Account
          </Text>
          <View className="p-5 w-full max-w-md">
            <InputField
              label="First Name"
              placeholder="Enter first name"
              icon={icons.person}
              value={form.firstName}
              hasError={errors.firstName}
              onChangeText={(value) => {
                setForm({ ...form, firstName: value });
                setErrors({ ...errors, firstName: false });
              }}
            />

            <InputField
              label="Last Name"
              placeholder="Enter last name"
              icon={icons.person}
              value={form.lastName}
              hasError={errors.lastName}
              onChangeText={(value) => {
                setForm({ ...form, lastName: value });
                setErrors({ ...errors, lastName: false });
              }}
            />

            <InputField
              label="Email"
              placeholder="Enter email"
              icon={icons.email}
              textContentType="emailAddress"
              value={form.email}
              hasError={errors.email}
              onChangeText={(value) => {
                setForm({ ...form, email: value });
                setErrors({ ...errors, email: false });
              }}
            />

            <InputField
              label="Password"
              placeholder="Enter password"
              icon={icons.lock}
              secureTextEntry={true}
              textContentType="password"
              value={form.password}
              hasError={errors.password}
              onChangeText={(value) => {
                setForm({ ...form, password: value });
                setErrors({ ...errors, password: false });
              }}
            />

            {/* ✅ Terms & Conditions Checkbox */}
            <View className="flex-row items-center mt-4">
              <Checkbox
                value={isChecked}
                onValueChange={setIsChecked}
                color={isChecked ? "#007bff" : undefined}
              />
              <Text className="ml-2 text-gray-700">
                I agree to the{" "}
                <Text
                  className="text-primary-500 font-JakartaBold"
                  onPress={() =>
                    Linking.openURL("https://veehive-web.vercel.app/")
                  }
                >
                  Terms and Conditions
                </Text>{" "}
                and{" "}
                <Text
                  className="text-primary-500 font-JakartaBold"
                  onPress={() =>
                    Linking.openURL("https://veehive-web.vercel.app/")
                  }
                >
                  Privacy Policy
                </Text>
              </Text>
            </View>

            {isLoading ? (
              <View className="flex-row items-center justify-center w-full bg-primary-500 p-4 rounded-lg mt-6">
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            ) : (
              <CustomButton
                title="Sign Up"
                onPress={onSignUpPress}
                className="mt-6"
              />
            )}

            <OAuth />

            <Link
              href="/sign-in"
              className="text-lg text-center text-general-200 mt-10"
            >
              <Text className="font-Jakarta">Already have an account? </Text>
              <Text className="text-primary-500 font-Jakarta">Log In</Text>
            </Link>
          </View>

          {/* ✅ Success Modal */}
          <ReactNativeModal
            isVisible={showSuccessModal}
            backdropColor="black"
            backdropOpacity={0.5}
          >
            <View className="bg-white px-7 py-9 rounded-2xl min-h-[300px] flex items-center justify-center">
              <LottieView
                source={require("../../assets/animations/Email Sent.json")}
                loop={false}
                autoPlay
                style={{ width: 150, height: 150 }}
              />
              <Text className="text-3xl font-JakartaBold text-center">
                Verify email
              </Text>
              <Text className="text-base text-gray-400 font-Jakarta text-center mt-2">
                A verification email has been sent to your inbox. Please verify
                your email before logging in.
              </Text>
              <TouchableOpacity
                className="absolute top-2 right-2 bg-gray-400 rounded-full w-6 h-6 justify-center items-center"
                onPress={() => setShowSuccessModal(false)}
              >
                <Ionicons name="close" size={16} color="white" />
              </TouchableOpacity>
            </View>
          </ReactNativeModal>
        </View>
      </ScrollView>

      {/* ✅ Render custom alert */}
      <AlertComponent />
    </>
  );
};

export default SignUp;
