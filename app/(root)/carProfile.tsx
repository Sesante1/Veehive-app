import { PhotoTourSection } from "@/components/PhotoTourSection";
import { icons } from "@/constants";
import { useCardSpreadAnimation } from "@/hooks/useCardSpreadAnimation";
import { getCarWithOwner } from "@/services/firestore";
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { encode as btoa } from "base-64";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Car = {
  id: string;
  storageFolder: string;
  make: string;
  model: string;
  type: string;
  pricePerHour: number;
  transmission: string;
  year: string;
  fuel: string;
  seats: number;
  description: string;
  images: { id: string; url: string }[];
  documents: {
    officialReceipt: {
      filename: string;
      uploadedAt: string;
      url: string;
    } | null;
    certificateOfRegistration: {
      filename: string;
      uploadedAt: string;
      url: string;
    } | null;
  };
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    profileImage?: string;
  } | null;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  } | null;
};

const CreateCar = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Use the custom hook for animation logic
  const {
    isSpread,
    spreadCards,
    toggleSpread,
    leftTranslateX,
    rightTranslateX,
    leftRotation,
    rightRotation,
    centerScale,
    leftScale,
    rightScale,
  } = useCardSpreadAnimation();

  // Auto-trigger spread animation on mount
  React.useEffect(() => {
    if (car) {
      const timer = setTimeout(() => {
        spreadCards();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [car, spreadCards]);

  const fetchCar = async () => {
    try {
      if (!id) return;
      if (!refreshing) setLoading(true);

      const data = await getCarWithOwner(id);
      setCar(data);
    } catch (e) {
      console.log("Error fetching car:", e);
      Alert.alert("Error", "Failed to load car details");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCar();
  }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCar();
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-gray-600 font-JakartaMedium">
            Loading car details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!car) {
    return (
      <SafeAreaView className="bg-white h-full flex justify-center items-center">
        <Ionicons name="car-outline" size={64} color="#D1D5DB" />
        <Text className="text-xl font-JakartaSemiBold text-gray-900 mt-4">
          Car not found
        </Text>
        <Text className="text-gray-600 font-JakartaMedium mt-2">
          The car you're looking for doesn't exist
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-6 px-6 py-3 bg-blue-500 rounded-lg"
        >
          <Text className="text-white font-JakartaSemiBold">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4 px-4 pt-2 bg-white">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center active:bg-gray-200"
        >
          <Image source={icons.backArrow} style={{ width: 20, height: 20 }} />
        </Pressable>
        <Text className="text-lg font-JakartaSemiBold text-gray-900">
          Listing Editor
        </Text>
        <Pressable className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center active:bg-gray-200">
          <Ionicons name="settings-outline" size={22} color="black" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={"#007DFC"}
            colors={["#007DFC"]}
          />
        }
      >
        <View className="flex-col gap-4">
          <Pressable
            className="px-5 py-4 bg-white rounded-xl border border-gray-200 active:bg-gray-50 shadow-sm"
            onPress={() => router.push("/completeRequiredSteps")}
          >
            <View className="flex-row items-center gap-3">
              <View className="bg-red-500 w-3 h-3 rounded-full items-center justify-center"></View>
              <Text className="text-lg font-JakartaSemiBold text-gray-900">
                Complete required steps
              </Text>
            </View>

            <Text className="text-sm text-gray-500 font-JakartaMedium mt-4">
              Finish these final tasks to publish your listing and start getting
              booked
            </Text>
          </Pressable>

          {/* Photo Tour Section */}
          <PhotoTourSection
            images={car.images}
            isSpread={isSpread}
            onToggleSpread={toggleSpread}
            onCardPress={() =>
              router.push({
                pathname: "/managePhotos",
                params: {
                  images: btoa(JSON.stringify(car.images)),
                  carDocId: car.id,
                  carId: car.storageFolder,
                },
              })
            }
            leftTranslateX={leftTranslateX}
            rightTranslateX={rightTranslateX}
            leftRotation={leftRotation}
            rightRotation={rightRotation}
            centerScale={centerScale}
            leftScale={leftScale}
            rightScale={rightScale}
          />

          {/* Action Cards */}
          <View className="gap-3">
            <Pressable
              className="px-5 py-4 bg-white rounded-xl border border-gray-100 flex-row justify-between items-center active:bg-gray-50 shadow-sm"
              onPress={() =>
                router.push({
                  pathname: "/editCarDetails",
                  params: {
                    make: car.make,
                    model: car.model,
                    year: String(car.year),
                    carType: car.type,
                    carDocId: car.id,
                  },
                })
              }
            >
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
                  <Feather name="list" size={20} color="#3B82F6" />
                </View>
                <View>
                  <Text className="text-lg font-JakartaSemiBold text-gray-900">
                    Car Details
                  </Text>
                  <Text className="text-sm text-gray-500 font-JakartaMedium">
                    {car.make} {car.model} • {car.year}
                  </Text>
                </View>
              </View>
              <MaterialIcons size={24} name="navigate-next" color="#9CA3AF" />
            </Pressable>

            <Pressable
              className="px-5 py-4 bg-white rounded-xl border border-gray-100 flex-row justify-between items-center active:bg-gray-50 shadow-sm"
              onPress={() =>
                router.push({
                  pathname: "/managePricing",
                  params: {
                    pricePerDay: Number(car.pricePerHour),
                    carDocId: car.id,
                  },
                })
              }
            >
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center">
                  <Ionicons name="pricetag-outline" size={20} color="#10B981" />
                </View>
                <View>
                  <Text className="text-lg font-JakartaSemiBold text-gray-900">
                    Pricing
                  </Text>
                  <Text className="text-sm text-gray-500 font-JakartaMedium">
                    ₱{car.pricePerHour}/hour
                  </Text>
                </View>
              </View>
              <MaterialIcons size={24} name="navigate-next" color="#9CA3AF" />
            </Pressable>

            <Pressable
              className="px-5 py-4 bg-white rounded-xl border border-gray-100 flex-row justify-between items-center active:bg-gray-50 shadow-sm"
              onPress={() =>
                router.push({
                  pathname: "/manageLocation",
                  params: {
                    location: car.location ? JSON.stringify(car.location) : "",
                    carDocId: car.id,
                  },
                })
              }
            >
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center">
                  <Ionicons name="location-outline" size={20} color="#EF4444" />
                </View>
                <View>
                  <Text className="text-lg font-JakartaSemiBold text-gray-900">
                    Location
                  </Text>
                  <Text
                    className="text-sm text-gray-500 font-JakartaMedium"
                    numberOfLines={3}
                  >
                    {car.location?.address || "Not set"}
                  </Text>
                </View>
              </View>
              <MaterialIcons size={24} name="navigate-next" color="#9CA3AF" />
            </Pressable>

            <Pressable
              className="px-5 py-4 bg-white rounded-xl border border-gray-100 flex-row justify-between items-center active:bg-gray-50 shadow-sm"
              onPress={() =>
                router.push({
                  pathname: "/manageDescription",
                  params: { description: car.description, carId: car.id },
                })
              }
            >
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center">
                  <Ionicons
                    name="document-text-outline"
                    size={20}
                    color="#8B5CF6"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-JakartaSemiBold text-gray-900">
                    Description
                  </Text>
                  <Text
                    className="text-sm text-gray-500 font-JakartaMedium"
                    numberOfLines={1}
                  >
                    {car.description || "Add a description..."}
                  </Text>
                </View>
              </View>
              <MaterialIcons size={24} name="navigate-next" color="#9CA3AF" />
            </Pressable>

            <Pressable
              className="px-5 py-4 bg-white rounded-xl border border-gray-100 flex-row justify-between items-center active:bg-gray-50 shadow-sm"
              onPress={() =>
                router.push({
                  pathname: "/manageDocuments",
                  params: {
                    documents: btoa(JSON.stringify(car.documents)),
                    carDocId: car.id,
                    storageFolder: car.storageFolder,
                  },
                })
              }
            >
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center">
                  <Ionicons
                    name="document-text-outline"
                    size={20}
                    color="#8B5CF6"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-JakartaSemiBold text-gray-900">
                    OR and CR
                  </Text>
                </View>
              </View>
              <MaterialIcons size={24} name="navigate-next" color="#9CA3AF" />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateCar;
