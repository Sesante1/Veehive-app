import { useCustomAlert } from "@/components/CustomAlert";
import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/OAuth";
import { icons } from "@/constants";
import { signIn } from "@/services/authService";
import { Link, router } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

const SignIn = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { showAlert, AlertComponent } = useCustomAlert();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const onSignInPress = async () => {
    const { email, password } = form;
    if (!email || !password) {
      showAlert({
        title: "Error",
        message: "Email and password are required.",
        icon: "alert-circle",
        iconColor: "#EF4444",
        buttons: [{ text: "OK", style: "default" }],
      });
      return;
    }

    setIsLoading(true);
    try {
      await signIn(email, password);
      router.push("/(root)/(tabs)/home");
    } catch (error: any) {
      showAlert({
        title: "Login Failed",
        message: "Invalid email or password. Please try again.",
        icon: "close-circle",
        iconColor: "#EF4444",
        buttons: [{ text: "Try Again", style: "default" }],
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
            Login to Your Account
          </Text>
          <View className="p-5 w-full max-w-md">
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
                title="Sign In"
                onPress={onSignInPress}
                className="mt-6"
              />
            )}

            <OAuth />

            <Link
              href="/sign-up"
              className="text-lg text-center text-general-200 mt-10"
            >
              <Text className="font-Jakarta">Don't have an account? </Text>
              <Text className="text-primary-500 font-Jakarta">Sign Up</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
      <AlertComponent />
    </>
  );
};

export default SignIn;
