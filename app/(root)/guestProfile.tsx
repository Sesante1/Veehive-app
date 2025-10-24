import ProfileSkeleton from "@/components/ProfileSkeleton";
import { icons } from "@/constants";
import { useAuth, useUserData } from "@/hooks/useUser";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { encode as btoa } from "base-64";

const UserProfile = () => {
  const { userData, loading } = useUserData();
  const { user } = useAuth();

  const identityDocs = userData?.identityVerification;
  const allDocsUploaded =
    identityDocs?.frontId && identityDocs?.backId && identityDocs?.selfieWithId;

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white p-4">
        <ProfileSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex justify-between items-center mb-10 pt-4 bg-white px-4">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center active:bg-gray-200 absolute left-4 top-2"
        >
          <Image source={icons.exit} style={{ width: 20, height: 20 }} />
        </Pressable>

        <Text className="text-lg font-JakartaSemiBold text-gray-900 text-center">
          Personal Information
        </Text>
      </View>

      {/* Content */}
      <View className="flex-1 p-4">
        <Text className="text-sm font-JakartaBold text-gray-700 mb-10">
          LOGIN SETTINGS
        </Text>

        <View className="border-b border-gray-200 mb-6 pb-6 flex-row items-center justify-between">
          <View>
            <Text className="text-base font-JakartaMedium">Legal name</Text>
            <Text className="text-base font-JakartaRegular text-gray-700 mt-1">
              {userData?.firstName + " " + userData?.lastName}
            </Text>
          </View>

          <Pressable
            className="p-2"
            onPress={() =>
              router.push({
                pathname: "/editName",
                params: {
                  firstName: userData?.firstName,
                  lastName: userData?.lastName,
                  id: user?.uid,
                },
              })
            }
          >
            <Text className="text-lg font-JakartaBold underline">Edit</Text>
          </Pressable>
        </View>

        <View className="border-b border-gray-200 mb-6 pb-6 flex-row items-center justify-between">
          <View>
            <Text className="text-base font-JakartaMedium">Email</Text>
            <Text className="text-base font-JakartaRegular text-gray-700 mt-1">
              {userData?.email}
            </Text>
          </View>

          <View>
            <Ionicons name="checkmark-circle" size={24} color="green" />
          </View>
        </View>

        <View className="border-b border-gray-200 mb-6 pb-6 flex-row items-center justify-between">
          <View>
            <Text className="text-base font-JakartaMedium">Phone number</Text>
            <Text className="text-base font-JakartaRegular text-gray-700 mt-1">
              {userData?.phoneNumber ? userData.phoneNumber : "Not provided"}
            </Text>
          </View>

          <Pressable
            className="p-2"
            onPress={() =>
              router.push({
                pathname: "/editPhoneNumber",
                params: { phoneNumber: userData?.phoneNumber, id: user?.uid },
              })
            }
          >
            <Text className="text-lg font-JakartaBold underline">Edit</Text>
          </Pressable>
        </View>

        <View className="border-b border-gray-200 mb-6 pb-6 flex-row items-center justify-between">
          <View>
            <Text className="text-base font-JakartaMedium">Address</Text>
            <Text className="text-base font-JakartaRegular text-gray-700 mt-1">
              {userData?.address ? userData.address : "Not provided"}
            </Text>
          </View>

          <Pressable
            className="p-2"
            onPress={() =>
              router.push({
                pathname: "/editAddress",
                params: { id: user?.uid },
              })
            }
          >
            <Text className="text-lg font-JakartaBold underline">Edit</Text>
          </Pressable>
        </View>

        <View className="border-b border-gray-200 mb-6 pb-6 flex-row items-center justify-between">
          <View className="flex justify-center">
            <Text className="text-base font-JakartaMedium">
              Drivers license
            </Text>
            {!allDocsUploaded && (
              <Text className="text-base font-JakartaRegular text-gray-700 mt-1">
                Not started
              </Text>
            )}
          </View>

          <Pressable
            className="p-2"
            onPress={() =>
              router.push({
                pathname: "/driversLicenseVerification",
                params: {
                  documents: btoa(
                    JSON.stringify(userData?.driversLicense || {})
                  ),
                  userId: user?.uid,
                },
              })
            }
          >
            <Text className="text-lg font-JakartaBold underline">
              {allDocsUploaded ? "Edit" : "Start"}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default UserProfile;
