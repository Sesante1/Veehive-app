import { icons } from "@/constants";
import { useSignOut } from "@/hooks/useSignOut";
import { Feather, MaterialIcons, SimpleLineIcons } from "@expo/vector-icons";
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
import { useRole } from "../../../context/RoleContext";
import { useUserData } from "../../../hooks/useUser";

export default function Profile() {
  const { userData, loading } = useUserData();
  const { SignOutModal, setVisible } = useSignOut();

  const { role, toggleRole, setRole } = useRole();

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
        <Text className="my-5 font-JakartaMedium">
          Log in and start planning your next booking.
        </Text>

        <TouchableOpacity
          className="mt-5 p-4 bg-black rounded-lg"
          onPress={() => router.push("/(auth)/signInOrSignUpScreen")}
        >
          <Text className="text-white text-center font-JakartaSemiBold">
            Log In or Sign Up
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleToggle = () => {
    const newRole = role === "renter" ? "host" : "renter";
    setRole(newRole);

    if (newRole === "renter") {
      router.replace("/(root)/(tabs)/home");
    } else {
      router.replace("/(root)/(host)/listing");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white -mb-14">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-2xl font-JakartaBold mt-6 px-4">Account</Text>

        <View className="flex items-center justify-center my-5 mb-10">
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
          {/* <Pressable className="px-6">
            <View className="bg-gray-700 h-[230px] mb-8 rounded-2xl overflow-hidden shadow-lg">
              <View className="flex-row h-full">
                <View className="flex-1 p-6 justify-between">
                  <View>
                    <Text className="text-white font-JakartaBold mb-4">
                      Become a host
                    </Text>
                    <Text className="text-white font-Jakarta text-base leading-6">
                      Join thousands of hosts building businesses and earning
                      meaningful income on Veehive.
                    </Text>
                  </View>

                  <Pressable
                    className="bg-primary-500 rounded-xl py-4 px-6 self-start"
                    onPress={() => router.push("/(root)/OnboardingListing")}
                  >
                    <Text className="text-white font-semibold">
                      Become a host
                    </Text>
                  </Pressable>
                </View>

                <View className="w-[45%]">
                  <Image
                    source={{
                      uri: "https://millennialmoney.com/wp-content/uploads/2021/06/Turo-Review-500x500.jpeg",
                    }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </View>
              </View>
            </View>
          </Pressable> */}

          <View className="border-b border-gray-200 mb-4 mt-20 pb-4">
            <Pressable
              className="flex flex-row items-center gap-4 py-4 px-6 rounded-lg"
              onPress={() => router.push("/myBooking")}
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
              className="flex flex-row items-center gap-3 py-4 px-6"
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
              className="flex flex-row items-center gap-3 py-4 px-6"
              onPress={() => router.push("/guestProfile")}
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
              className="flex flex-row items-center gap-3 py-4 px-6"
              onPress={() => {}}
            >
              <Feather name="shield" size={20} color="#00000" />
              <Text className="text-lg font-Jakarta">Privacy Policy</Text>
              <MaterialIcons
                className="absolute right-0"
                name="navigate-next"
                size={30}
                color="#00000"
              />
            </Pressable>

            <Pressable
              className="flex flex-row items-center gap-3 py-4 px-6"
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
      <Pressable
        className="flex-row justify-center gap-2 items-center absolute bottom-16 left-1/2 -translate-x-1/2 bg-black/70 rounded-full px-4 py-3"
        onPress={handleToggle}
      >
        <Image source={icons.arrow} style={{ width: 15, height: 15 }} />
        <Text className="color-white">
          {role === "renter" ? "Switch to Hosting" : "Switch to Renting"}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}
