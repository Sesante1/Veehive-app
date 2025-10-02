import { icons } from "@/constants";
import { useAuth, UserData, useUserData } from "@/hooks/useUser";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CompleteRequiredSteps = () => {
  const { userData } = useUserData();
  const { user } = useAuth();

  const hasCompleteIdentity = (userData: UserData | null): boolean => {
    if (!userData) return false;

    const hasFrontId = !!userData.identityVerification?.frontId?.url;
    const hasBackId = !!userData.identityVerification?.backId?.url;
    const hasSelfieWithId = !!userData.identityVerification?.selfieWithId?.url;

    return hasFrontId && hasBackId && hasSelfieWithId;
  };

  const hasPhoneNumber = (userData: UserData | null): boolean => {
    if (!userData) return false;
    return !!userData.phoneNumber && userData.phoneNumber.trim() !== "";
  };

  const StatusBadge = ({ isCompleted }: { isCompleted: boolean }) => {
    return (
      <View className="flex-row items-center mt-3 gap-2">
        <View
          className={`w-3 h-3 rounded-full ${isCompleted ? "bg-green-500" : "bg-red-500"}`}
        />
        <Text className="text-sm font-JakartaMedium">
          {isCompleted ? "Completed" : "Required"}
        </Text>
      </View>
    );
  };

  const identityCompleted = hasCompleteIdentity(userData);
  const phoneCompleted = hasPhoneNumber(userData);

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="mb-4 px-4 pt-2 bg-white">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center active:bg-gray-200"
        >
          <Image source={icons.backArrow} style={{ width: 20, height: 20 }} />
        </Pressable>
      </View>

      {/* Content */}
      <View className="flex-1 px-4">
        <View className="mb-10">
          <Text className="text-2xl font-JakartaBold mb-2">
            Finish up and publish
          </Text>
          <Text className="text-base font-Jakarta text-gray-700">
            Complete these steps to make your car eligible for review.
          </Text>
        </View>

        <Pressable
          className="mb-10 flex-row items-center justify-between"
          onPress={() =>
            router.push({
              pathname: "/identityVerification",
              params: {
                documents: btoa(JSON.stringify(userData?.identityVerification)),
                userId: user?.uid,
              },
            })
          }
        >
          <View className="flex-1">
            <Text className="text-lg font-JakartaBold mb-2">
              Verify your identity
            </Text>
            <Text className="text-base font-Jakarta text-gray-700">
              We'll gather some information to help {"\n"} confirm you're you.
            </Text>
            <StatusBadge isCompleted={identityCompleted} />
          </View>

          <View>
            <MaterialIcons name="navigate-next" size={24} color="gray" />
          </View>
        </Pressable>

        <Pressable
          className="mb-10 flex-row items-center justify-between"
          onPress={() =>
            router.push({
              pathname: "/editPhoneNumber",
              params: { phoneNumber: userData?.phoneNumber, id: user?.uid },
            })
          }
        >
          <View className="flex-1">
            <Text className="text-lg font-JakartaBold mb-2">
              Confirm your phone number
            </Text>
            <Text className="text-base font-Jakarta text-gray-700">
              We'll call or text to confirm your number. Standard {"\n"}
              messaging rates apply.
            </Text>
            <StatusBadge isCompleted={phoneCompleted} />
          </View>

          <View>
            <MaterialIcons name="navigate-next" size={24} color="gray" />
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default CompleteRequiredSteps;
