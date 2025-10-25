import { images } from "@/constants";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SignInOrSignUpScreen = () => {
  return (
    <View className="flex-1 bg-white">
      <View className="flex-1 bg-white">
        <Image
          source={images.SignInImage}
          className="w-full h-full"
          resizeMode="cover"
        />
        <View className="absolute inset-0 bg-black" style={{ opacity: 0.2 }} />

        <SafeAreaView className="absolute top-0 left-0 p-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-black/30 p-2 rounded-full"
          >
            <Feather name="x" size={24} color="white" />
          </TouchableOpacity>
        </SafeAreaView>

        <View
          className="absolute inset-0 justify-center items-center"
          style={{ marginTop: -400 }}
        >
          <Text className="text-white text-6xl font-JakartaBold">Veehive</Text>
        </View>

        <SafeAreaView className="absolute bottom-5 w-full px-6">
          <Text className="text-white text-3xl font-JakartaBold text-center">
            Find your drive
          </Text>
          <TouchableOpacity
            className="p-4 mt-10 bg-primary-500 rounded-lg"
            onPress={() => router.push("/(auth)/sign-up")}
          >
            <Text className="text-white text-center font-JakartaSemiBold">
              Sign up
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-5 p-4 bg-gray-800 rounded-lg border border-white"
            onPress={() => router.push("/(auth)/sign-in")}
          >
            <Text className="text-white text-center font-JakartaSemiBold">
              Log In
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </View>
  );
};

export default SignInOrSignUpScreen;
