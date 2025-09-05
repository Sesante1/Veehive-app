import { useSignOut } from "@/hooks/useSignOut";
import {
  AntDesign,
  Feather,
  FontAwesome6,
  MaterialIcons,
  SimpleLineIcons,
} from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProfileSkeleton from "../../../components/ProfileSkeleton";
import { useUserData } from "../../../hooks/useUser";

export default function Profile() {
  const { userData, loading } = useUserData();
  const { SignOutModal, setVisible } = useSignOut();

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white p-4">
        <ProfileSkeleton />
      </SafeAreaView>
    );
  }

  if (!userData) {
    return (
      <SafeAreaView className="flex-1 bg-white p-4">
        <Text className="text-2xl font-JakartaBold">Account</Text>
        <Text className="my-5 font-Jakarta">
          Log in and start planning your next booking.
        </Text>

        <TouchableOpacity
          className="mt-5 p-4 bg-black rounded-lg"
          onPress={() => router.push("/(auth)/sign-in")}
        >
          <Text className="text-white text-center font-JakartaSemiBold">
            Log In or Sign Up
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="px-4"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-2xl font-JakartaBold mt-6">Account</Text>

        <View className="flex items-center justify-center my-5 mb-20">
          <Image
            source={{
              uri: userData.profileImage,
            }}
            style={{ width: 110, height: 110, borderRadius: 110 / 2 }}
            className=" rounded-full h-[110px] w-[110px] border-[3px] border-white shadow-sm shadow-neutral-300"
          />

          <Text className="mt-5 font-JakartaSemiBold">
            {userData.firstName + " " + userData.lastName}
          </Text>
          <Text className="font-Jakarta">Guest</Text>
        </View>

        <View className="flex-1">
          <View className="border-b border-gray-200 mb-4 pb-4">
            <Pressable
              className="flex flex-row items-center gap-4 p-4 rounded-lg"
              onPress={() => {}}
            >
              <Feather name="calendar" size={20} color="#00000" />
              <Text className="text-lg font-Jakarta">My Booking</Text>
              <MaterialIcons
                className="absolute right-0"
                name="navigate-next"
                size={30}
                color="#00000"
              />
            </Pressable>

            <Pressable
              className="flex flex-row items-center gap-4 p-4 rounded-lg"
              onPress={() => router.push("/create-car")}
            >
              <FontAwesome6 name="add" size={20} color="#00000" />
              <Text className="text-lg font-Jakarta">Create listing</Text>
              <MaterialIcons
                className="absolute right-0"
                name="navigate-next"
                size={30}
                color="#00000"
              />
            </Pressable>

            <Pressable
              className="flex flex-row items-center gap-3 p-4"
              onPress={() => router.push("/user-listing")}
            >
              <Feather name="list" size={20} color="black" />
              <Text className="text-lg font-Jakarta">Your listing</Text>
              <MaterialIcons
                className="absolute right-0"
                name="navigate-next"
                size={30}
                color="#00000"
              />
            </Pressable>

            <Pressable
              className="flex flex-row items-center gap-3 p-4"
              onPress={() => {}}
            >
              <Feather name="check" size={20} color="#00000" />
              <Text className="text-lg font-Jakarta">Booking Recieved</Text>
              <MaterialIcons
                className="absolute right-0"
                name="navigate-next"
                size={30}
                color="#00000"
              />
            </Pressable>

            <Pressable
              className="flex flex-row items-center gap-3 p-4"
              onPress={() => router.push("/favorites")}
            >
              <Feather name="heart" size={20} color="#00000" />
              <Text className="text-lg font-Jakarta">Wishlists</Text>
              <MaterialIcons
                className="absolute right-0"
                name="navigate-next"
                size={30}
                color="#00000"
              />
            </Pressable>
          </View>

          <View>
            <Pressable
              className="flex flex-row items-center gap-3 p-4"
              onPress={() => {}}
            >
              <AntDesign name="questioncircleo" size={20} color="#00000" />
              <Text className="text-lg font-Jakarta">Privacy Policy</Text>
              <MaterialIcons
                className="absolute right-0"
                name="navigate-next"
                size={30}
                color="#00000"
              />
            </Pressable>

            <Pressable
              className="flex flex-row items-center gap-3 p-4"
              onPress={() => {}}
            >
              <Feather name="user" size={20} color="#00000" />
              <Text className="text-lg font-Jakarta">Personal Information</Text>
              <MaterialIcons
                className="absolute right-0"
                name="navigate-next"
                size={30}
                color="#00000"
              />
            </Pressable>

            <Pressable
              className="flex flex-row items-center gap-3 p-4"
              onPress={() => setVisible(true)}
            >
              <SignOutModal />
              <SimpleLineIcons name="logout" size={20} color="#00000" />
              <Text className="text-lg font-Jakarta">Logout</Text>
              <MaterialIcons
                className="absolute right-0"
                name="navigate-next"
                size={30}
                color="#00000"
              />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
