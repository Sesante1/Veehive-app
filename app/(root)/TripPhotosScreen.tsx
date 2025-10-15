import { icons } from "@/constants";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { db, storage } from "@/FirebaseConfig";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

type PhotoCategory = 
  | "exterior"
  | "interior"
  | "odometer"
  | "fuel";

interface PhotoItem {
  id: string;
  uri: string;
  category: PhotoCategory;
  timestamp: number;
}

const TripPhotosScreen = () => {
  const router = useRouter();
  const { bookingId, photoType, userRole } = useLocalSearchParams<{
    bookingId: string;
    photoType: "checkin" | "checkout";
    userRole: "guest" | "host";
  }>();

  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<PhotoCategory>("exterior");

  const isCheckIn = photoType === "checkin";
  const isGuest = userRole === "guest";

  const categories: { key: PhotoCategory; label: string; minPhotos: number }[] = [
    { key: "exterior", label: "Exterior", minPhotos: isGuest ? 4 : 15 },
    { key: "interior", label: "Interior", minPhotos: isGuest ? 3 : 8 },
    { key: "odometer", label: "Odometer", minPhotos: 1 },
    { key: "fuel", label: "Fuel Level", minPhotos: 1 },
  ];

  const getInstructions = () => {
    if (isCheckIn) {
      switch (activeCategory) {
        case "exterior":
          return isGuest
            ? "Take photos documenting the vehicle's exterior from all angles, including close-ups of any scratches or dents."
            : "Take at least 15 clear, well-lit photos of the vehicle's exterior from various viewpoints. Include close-ups of any pre-existing damage.";
        case "interior":
          return isGuest
            ? "Take photos of the vehicle's interior, such as the dashboard, seats, and floor. Be sure to document any existing stains or debris."
            : "Take at least 8 photos of the vehicle's interior. Clearly document the seats, dashboard, and floor mats, as well as any existing issues.";
        case "odometer":
          return "Take a clear photo of the odometer reading.";
        case "fuel":
          return "Take a clear photo of the vehicle's current fuel or electric charge level.";
      }
    } else {
      switch (activeCategory) {
        case "exterior":
          return isGuest
            ? "Take new photos of the vehicle's exterior from all angles. Include close-ups of any new issues or to confirm there are none."
            : "Take photos of your vehicle's exterior to document its condition. Compare these to the pre-trip photos to check for any new damage or issues.";
        case "interior":
          return isGuest
            ? "Take new photos of the interior to show its cleanliness and condition upon return."
            : "Take photos of the interior to document its condition and cleanliness.";
        case "odometer":
          return isGuest
            ? "Take a photo of the final odometer reading. This confirms the mileage used during the trip."
            : "Take a photo of the final odometer reading to document mileage used.";
        case "fuel":
          return isGuest
            ? "Take a photo of the vehicle's fuel or electric charge level."
            : "Take a photo of the fuel/charge level. Document any discrepancies for reimbursement.";
      }
    }
  };

  const getCategoryPhotos = (category: PhotoCategory) => {
    return photos.filter((p) => p.category === category);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Camera permission is required to take photos.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newPhoto: PhotoItem = {
        id: Date.now().toString(),
        uri: result.assets[0].uri,
        category: activeCategory,
        timestamp: Date.now(),
      };
      setPhotos([...photos, newPhoto]);
    }
  };

  const removePhoto = (photoId: string) => {
    setPhotos(photos.filter((p) => p.id !== photoId));
  };

  const uploadPhotosToStorage = async (): Promise<string[]> => {
    const uploadPromises = photos.map(async (photo) => {
      const filename = `${bookingId}/${photoType}/${photo.category}/${photo.id}.jpg`;
      const storageRef = ref(storage, `trip-photos/${filename}`);
      
      const response = await fetch(photo.uri);
      const blob = await response.blob();
      
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      
      return {
        url: downloadURL,
        category: photo.category,
        timestamp: photo.timestamp,
      };
    });

    const uploadedPhotos = await Promise.all(uploadPromises);
    return uploadedPhotos.map(p => JSON.stringify(p));
  };

  const validatePhotos = (): boolean => {
    for (const category of categories) {
      const categoryPhotos = getCategoryPhotos(category.key);
      if (categoryPhotos.length < category.minPhotos) {
        Alert.alert(
          "Incomplete Photos",
          `Please upload at least ${category.minPhotos} photo(s) for ${category.label}.`
        );
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validatePhotos()) return;

    Alert.alert(
      "Confirm Submission",
      "Are you sure you want to submit these photos? You won't be able to change them later.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          onPress: async () => {
            setUploading(true);
            try {
              const uploadedPhotos = await uploadPhotosToStorage();

              const updateField = isCheckIn
                ? `${userRole}CheckInPhotos`
                : `${userRole}CheckOutPhotos`;

              await updateDoc(doc(db, "bookings", bookingId), {
                [updateField]: uploadedPhotos,
                [`${updateField}SubmittedAt`]: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });

              Alert.alert(
                "Success",
                `${isCheckIn ? "Check-in" : "Check-out"} photos submitted successfully!`,
                [{ text: "OK", onPress: () => router.back() }]
              );
            } catch (error) {
              console.error("Error uploading photos:", error);
              Alert.alert("Error", "Failed to upload photos. Please try again.");
            } finally {
              setUploading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex justify-between items-center mb-6 pt-4 bg-white px-4">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center active:bg-gray-200 absolute left-4 top-2"
        >
          <Image source={icons.backArrow} style={{ width: 20, height: 20 }} />
        </Pressable>

        <Text className="text-lg font-JakartaSemiBold text-gray-900 text-center">
          {isCheckIn ? "Check-In Photos" : "Check-Out Photos"}
        </Text>
      </View>

      <ScrollView className="flex-1 px-4">
        {/* Info Banner */}
        <View className="bg-blue-50 p-4 rounded-lg mb-6">
          <Text className="font-JakartaMedium text-sm text-blue-900">
            {isCheckIn
              ? isGuest
                ? "Document the vehicle's condition before your trip. These photos protect you from being held responsible for pre-existing damage."
                : "Document the vehicle's condition before the trip begins. This is required to be covered by your protection plan."
              : isGuest
              ? "Before ending your trip, please take photos documenting the vehicle's final condition. This protects you and serves as evidence should there be any claims."
              : "Your guest has ended their trip. Please inspect your vehicle and document its condition."}
          </Text>
        </View>

        {/* Category Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-6"
        >
          {categories.map((category) => {
            const categoryPhotos = getCategoryPhotos(category.key);
            const isComplete = categoryPhotos.length >= category.minPhotos;
            const isActive = activeCategory === category.key;

            return (
              <TouchableOpacity
                key={category.key}
                onPress={() => setActiveCategory(category.key)}
                className={`mr-3 px-4 py-2 rounded-full flex-row items-center ${
                  isActive ? "bg-primary-500" : "bg-secondary-100"
                }`}
              >
                <Text
                  className={`font-JakartaMedium ${
                    isActive ? "text-white" : "text-gray-700"
                  }`}
                >
                  {category.label}
                </Text>
                <Text
                  className={`ml-2 font-JakartaBold ${
                    isActive ? "text-white" : "text-gray-700"
                  }`}
                >
                  {categoryPhotos.length}/{category.minPhotos}
                </Text>
                {isComplete && (
                  <MaterialIcons
                    name="check-circle"
                    size={16}
                    color={isActive ? "white" : "#22c55e"}
                    style={{ marginLeft: 4 }}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Instructions */}
        <View className="bg-gray-50 p-4 rounded-lg mb-6">
          <Text className="font-JakartaMedium text-gray-700">
            {getInstructions()}
          </Text>
        </View>

        {/* Photo Grid */}
        <View className="flex-row flex-wrap gap-3 mb-6">
          {getCategoryPhotos(activeCategory).map((photo) => (
            <View key={photo.id} className="relative">
              <Image
                source={{ uri: photo.uri }}
                style={{ width: 110, height: 110, borderRadius: 8 }}
              />
              <Pressable
                onPress={() => removePhoto(photo.id)}
                className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
              >
                <MaterialIcons name="close" size={16} color="white" />
              </Pressable>
            </View>
          ))}
        </View>

        {/* Add Photo Button */}
        <TouchableOpacity
          onPress={pickImage}
          className="bg-primary-500 rounded-lg py-4 mb-6 flex-row items-center justify-center"
          disabled={uploading}
        >
          <MaterialIcons name="add-a-photo" size={24} color="white" />
          <Text className="font-JakartaSemiBold text-lg text-white ml-2">
            Take Photo
          </Text>
        </TouchableOpacity>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          className={`rounded-lg py-4 mb-10 items-center ${
            photos.length === 0 ? "bg-gray-300" : "bg-green-600"
          }`}
          disabled={uploading || photos.length === 0}
        >
          {uploading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="font-JakartaSemiBold text-lg text-white">
              Submit Photos ({photos.length})
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TripPhotosScreen;