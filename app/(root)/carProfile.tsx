import { PhotoManagementContent } from "@/components/PhotoManagementContent";
import { PhotoTourSection } from "@/components/PhotoTourSection";
import { ReusableBottomSheet } from "@/components/ReusableBottomSheet";
import { icons } from "@/constants";
import { useCardSpreadAnimation } from "@/hooks/useCardSpreadAnimation";
import { getCarWithOwner } from "@/services/firestore";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Car = {
  id: string;
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
  const [showPhotoBottomSheet, setShowPhotoBottomSheet] = useState(false);

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
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [car, spreadCards]);

  useEffect(() => {
    if (!id) return;

    const fetchCar = async () => {
      try {
        setLoading(true);
        const data = await getCarWithOwner(id);
        setCar(data);
      } catch (e) {
        console.log("Error fetching car:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchCar();
  }, [id]);

  const handleShowPhotoBottomSheet = () => {
    setShowPhotoBottomSheet(true);
  };

  const handleClosePhotoBottomSheet = () => {
    setShowPhotoBottomSheet(false);
  };

  const handleAddPhoto = () => {
    console.log("Add photo pressed");
  };

  const handleDeletePhoto = (imageId: string) => {
    console.log("Delete photo:", imageId);
  };

  if (loading)
    return (
      <SafeAreaView className="flex-1 bg-white">
        <ActivityIndicator size={"large"} color={"black"} />
      </SafeAreaView>
    );

  if (!car) {
    return (
      <View className="bg-white h-full flex justify-center items-center">
        <Text>Car not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white pt-7">
      <View className="flex-row justify-between items-center mb-4 px-4">
        <Pressable onPress={() => router.back()}>
          <Image source={icons.backArrow} style={{ width: 30, height: 30 }} />
        </Pressable>
        <Text className="text-lg font-JakartaSemiBold">Listing editor</Text>
        <Pressable>
          <Ionicons name="settings-outline" size={24} color="black" />
        </Pressable>
      </View>

      <ScrollView className="flex-col gap-6 px-4" showsVerticalScrollIndicator={false}>
        <View className="flex-1 flex-col gap-7">
          {/* Photo Tour Section */}
          <PhotoTourSection
            images={car.images}
            isSpread={isSpread}
            onToggleSpread={toggleSpread}
            onCardPress={handleShowPhotoBottomSheet}
            leftTranslateX={leftTranslateX}
            rightTranslateX={rightTranslateX}
            leftRotation={leftRotation}
            rightRotation={rightRotation}
            centerScale={centerScale}
            leftScale={leftScale}
            rightScale={rightScale}
          />

          <Pressable className="flex-1 px-5 py-4 bg-white rounded-xl border border-gray-100 flex-row justify-between items-center">
            <View className="flex-row justify-between items-center gap-4">
              <Feather name="list" size={22} color="black" />
              <Text className="text-lg font-JakartaSemiBold">
                Car Details
              </Text>
            </View>
            <MaterialIcons size={27} name="navigate-next" color="black" />
          </Pressable>

          <Pressable className="flex-1 px-5 py-4 bg-white rounded-xl border border-gray-100 flex-row justify-between items-center">
            <View className="flex-row justify-between items-center gap-4">
              <Ionicons name="pricetag-outline" size={22} color="black" />
              <Text className="text-lg font-JakartaSemiBold">
                Pricing
              </Text>
            </View>
            <MaterialIcons size={27} name="navigate-next" color="black" />
          </Pressable>

          <Pressable className="flex-1 px-5 py-4 bg-white rounded-xl border border-gray-100 flex-row justify-between items-center">
            <View className="flex-row justify-between items-center gap-4">
              <Ionicons name="location-outline" size={22} color="black" />
              <Text className="text-lg font-JakartaSemiBold">
                Location
              </Text>
            </View>
            <MaterialIcons size={27} name="navigate-next" color="black" />
          </Pressable>

          <Pressable className="flex-1 px-5 py-4 bg-white rounded-xl border border-gray-100 flex-row justify-between items-center">
            <View className="flex-row justify-between items-center gap-4">
              <Ionicons name="document-text-outline" size={22} color="black" />
              <Text className="text-lg font-JakartaSemiBold">
                Description
              </Text>
            </View>
            <MaterialIcons size={27} name="navigate-next" color="black" />
          </Pressable>
        </View>
      </ScrollView>

      {/* Reusable Photo Management Bottom Sheet */}
      <ReusableBottomSheet
        isVisible={showPhotoBottomSheet}
        onClose={handleClosePhotoBottomSheet}
        title={`Manage Photos (${car.images.length})`}
        height={0.9}
      >
        <PhotoManagementContent
          images={car.images}
          onAddPhoto={handleAddPhoto}
          onDeletePhoto={handleDeletePhoto}
        />
      </ReusableBottomSheet>
    </SafeAreaView>
  );
};

export default CreateCar;