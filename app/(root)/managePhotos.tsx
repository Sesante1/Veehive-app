import BottomSheetImagePicker from "@/components/BottomSheetImagePicker";
import { PhotoManagementContent } from "@/components/PhotoManagementContent";
import { icons } from "@/constants";
import { db } from "@/FirebaseConfig";
import { decode as atob } from "base-64";
import { router, useLocalSearchParams } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import React, { useState } from "react";
import { Alert, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Photo {
  id: string;
  url: string;
  filename?: string;
  uploadedAt?: string;
}

const ManagePhotos = () => {
  const { images, carDocId, carId } = useLocalSearchParams();
  const imageArray = images ? JSON.parse(atob(images as string)) : null;

  const [isSaving, setIsSaving] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>(imageArray || []);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [pickerAction, setPickerAction] = useState<"camera" | "gallery" | null>(
    null
  );

  // Update Firestore when photos change
  const updateFirebasePhotos = async (updatedPhotos: Photo[]) => {
    if (!carDocId) {
      console.error("Car document ID is required to update photos");
      return;
    }

    try {
      setIsSaving(true);

      // Convert photos into Firestore-safe format
      const firebaseImages = updatedPhotos.map((photo) => ({
        url: photo.url,
        filename: photo.filename || photo.url.split("/").pop() || "",
        uploadedAt: photo.uploadedAt || new Date().toISOString(),
      }));

      const carRef = doc(db, "cars", carDocId as string);
      await updateDoc(carRef, {
        images: firebaseImages,
        updatedAt: new Date(),
      });

      console.log("Photos updated in Firestore successfully");
    } catch (error) {
      console.error("❌ Error updating photos in Firestore:", error);
      Alert.alert("Error", "Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Add photo(s)
  const handleAddPhoto = async (newPhotos: Photo | Photo[]) => {
    const photosArray = Array.isArray(newPhotos) ? newPhotos : [newPhotos];

    console.log("Add new photos:", photosArray);

    const updatedPhotos = [...photos, ...photosArray];
    setPhotos(updatedPhotos);

    await updateFirebasePhotos(updatedPhotos);
  };

  // 🔹 Delete photo
  const handleDeletePhoto = async (photoId: string, filename?: string) => {
    console.log("Delete photo with ID:", photoId, "filename:", filename);

    const updatedPhotos = photos.filter((photo) => photo.id !== photoId);
    setPhotos(updatedPhotos);

    await updateFirebasePhotos(updatedPhotos);
  };

  // Track upload progress
  const handleUploadProgress = (progress: number, message: string) => {
    console.log(`Upload progress: ${progress}% - ${message}`);
  };

  // Open/close picker
  const handleShowImagePicker = () => setShowImagePicker(true);
  const handleCloseImagePicker = () => {
    setShowImagePicker(false);
    setPickerAction(null);
  };

  // Camera or gallery actions
  const handleTakePhoto = () => {
    setShowImagePicker(false);
    setPickerAction("camera");
  };

  const handlePickGallery = () => {
    setShowImagePicker(false);
    setPickerAction("gallery");
  };

  const handleActionProcessed = () => setPickerAction(null);

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex justify-center items-center mb-10 pt-4 bg-white px-4 relative">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center active:bg-gray-200 absolute left-4 top-2"
        >
          <Image source={icons.exit} style={{ width: 20, height: 20 }} />
        </Pressable>
        <Text className="text-lg font-JakartaSemiBold text-gray-900">
          Manage Photos
        </Text>
      </View>

      {/* Content */}
      <View className="flex-1 px-4">
        <PhotoManagementContent
          images={photos}
          carId={carId as string}
          onAddPhoto={handleAddPhoto}
          onDeletePhoto={handleDeletePhoto}
          onUploadProgress={handleUploadProgress}
          onShowImagePicker={handleShowImagePicker}
          pickerAction={pickerAction}
          onActionProcessed={handleActionProcessed}
        />
      </View>

      {/* Bottom Sheet Image Picker */}
      <BottomSheetImagePicker
        visible={showImagePicker}
        onClose={handleCloseImagePicker}
        onPickCamera={handleTakePhoto}
        onPickGallery={handlePickGallery}
        mode="multi"
        title="Add Photos"
        subtitle="Choose how you want to add photos to your collection"
      />
    </SafeAreaView>
  );
};

export default ManagePhotos;
