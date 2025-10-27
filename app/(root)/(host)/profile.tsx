import { icons } from "@/constants";
import { useSignOut } from "@/hooks/useSignOut";
import {
  Feather,
  FontAwesome6,
  MaterialIcons,
  SimpleLineIcons,
} from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProfileSkeleton from "../../../components/ProfileSkeleton";
import { useRole } from "../../../context/RoleContext";
import { UserData, useUserData } from "../../../hooks/useUser";

export default function Profile() {
  const { userData, loading } = useUserData();
  const { SignOutModal, setVisible } = useSignOut();

  const { role, toggleRole, setRole } = useRole();

  const needsRequiredSteps = (userData: UserData | null) => {
    if (!userData) {
      console.log("No userData - showing banner");
      return true;
    }

    const hasPhone =
      !!userData.phoneNumber && userData.phoneNumber.trim() !== "";

    const hasFrontId = !!userData.identityVerification?.frontId?.url;
    const hasBackId = !!userData.identityVerification?.backId?.url;
    const hasSelfieWithId = !!userData.identityVerification?.selfieWithId?.url;

    const hasCompleteIdentity = hasFrontId && hasBackId && hasSelfieWithId;

    // Check if identity verification (host identification) is approved
    const isIdentityApproved =
      (userData.identityVerification as any)?.verificationStatus === "approved";

    const shouldShow = !hasPhone || !hasCompleteIdentity;

    return shouldShow;
  };

  const handleCreateListing = () => {
    if (needsRequiredSteps(userData)) {
      router.push("/completeRequiredSteps");
    } else {
      router.push("/create-car");
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white p-4">
        <ProfileSkeleton />
      </SafeAreaView>
    );
  }

  if (!userData) {
    return (
      <SafeAreaView className="flex-1 bg-white p-4 -mb-14">
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
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-2xl font-JakartaBold mt-6 px-4">Account</Text>

        <View className="flex items-center justify-center my-5 mb-32">
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
          <Text className="font-Jakarta">Hoster</Text>
        </View>

        <View className="flex-1">
          <View className="border-b border-gray-200 mb-4 pb-4">
            <Pressable
              className="flex flex-row items-center gap-4 py-4 px-6 rounded-lg"
              onPress={handleCreateListing}
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
              className="flex flex-row items-center gap-3 py-4 px-6"
              onPress={() => router.push("/bookingsReceived")}
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
          </View>

          <Pressable
            className="flex flex-row items-center gap-3 py-4 px-6"
            onPress={() => router.push("/userProfile")}
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

          <View>
            <Pressable
              className="flex flex-row items-center gap-3 py-4 px-6"
              onPress={() => Linking.openURL("https://veehive-web.vercel.app/")}
            >
              <Feather name="book" size={20} color="#000000" />
              <Text className="text-lg font-Jakarta">Privacy Policy</Text>
              <MaterialIcons
                className="absolute right-0"
                name="navigate-next"
                size={30}
                color="#000000"
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
