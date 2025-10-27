import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/OAuth";
import { icons } from "@/constants";
import { signUp } from "@/services/authService";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import LottieView from "lottie-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ReactNativeModal from "react-native-modal";

const SignUp = () => {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  const onSignUpPress = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      Alert.alert("Error", "All fields are required.");
      return;
    }

    setIsLoading(true);
    try {
      await signUp(form);
      setShowSuccessModal(true);
    } catch (error: any) {
      Alert.alert("Sign Up Failed", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
            onChangeText={(value) => setForm({ ...form, firstName: value })}
          />

          <InputField
            label="Last Name"
            placeholder="Enter last name"
            icon={icons.person}
            value={form.lastName}
            onChangeText={(value) => setForm({ ...form, lastName: value })}
          />
          <InputField
            label="Email"
            placeholder="Enter email"
            icon={icons.email}
            textContentType="emailAddress"
            value={form.email}
            onChangeText={(value) => setForm({ ...form, email: value })}
          />
          <InputField
            label="Password"
            placeholder="Enter password"
            icon={icons.lock}
            secureTextEntry={true}
            textContentType="password"
            value={form.password}
            onChangeText={(value) => setForm({ ...form, password: value })}
          />

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
  );
};

export default SignUp;
