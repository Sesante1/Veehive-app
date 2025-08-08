import { Link } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/OAuth";
import { icons } from "@/constants";
import { ActivityIndicator, Alert } from "react-native";

import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  updateProfile,
} from "firebase/auth";
// import { FIREBASE_AUTH } from "../../FirebaseConfig";
import { getAuth } from "firebase/auth";

const SignUp = () => {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const onSignUpPress = async () => {
    const { firstName, lastName, email, password } = form;

    if (!firstName || !lastName || !email || !password) {
      Alert.alert("Error", "All fields are required.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        getAuth(),
        email,
        password
      );
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`,
      });

      await sendEmailVerification(user);

      await signOut(getAuth());

      Alert.alert(
        "Verify Email",
        "A verification email has been sent to your inbox. Please verify your email before logging in."
      );

      setShowSuccessModal(true);
      // router.push("/sign-in");
    } catch (error) {
      // console.error("Sign Up Error", error);
      Alert.alert("Sign Up Failed", String(error));
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

          {true ? (
            <View className="flex-row items-center justify-center w-full bg-primary-500 p-4 rounded-full mt-6">
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
      </View>
    </ScrollView>
  );
};
export default SignUp;
