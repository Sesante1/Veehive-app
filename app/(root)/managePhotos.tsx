// screens/ManagePhotos.tsx
import { PhotoManagementContent } from "@/components/PhotoManagementContent";
import { icons } from "@/constants";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "@/FirebaseConfig";
import { decode as atob } from "base-64";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Image, Pressable, Text, View, Alert, ActivityIndicator } from "react-native";
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

  // Update Firestore when photos change
  const updateFirebasePhotos = async (updatedPhotos: Photo[]) => {
    if (!carDocId) {
      console.error('Car document ID is required to update photos');
      return;
    }

    try {
      setIsSaving(true);
      
      // Convert photos to the format expected by Firebase
      const firebaseImages = updatedPhotos.map(photo => ({
        url: photo.url,
        filename: photo.filename || photo.url.split('/').pop() || '',
        uploadedAt: photo.uploadedAt || new Date().toISOString(),
      }));

      // Update the car document in Firestore
      const carRef = doc(db, 'cars', carDocId as string);
      await updateDoc(carRef, {
        images: firebaseImages,
        updatedAt: new Date(),
      });

      console.log('Photos updated in Firestore successfully');
    } catch (error) {
      console.error('Error updating photos in Firestore:', error);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPhoto = async (newPhoto: Photo) => {
    console.log("Add new photo:", newPhoto);
    const updatedPhotos = [...photos, newPhoto];
    setPhotos(updatedPhotos);
    
    // Update Firebase
    await updateFirebasePhotos(updatedPhotos);
  };

  const handleDeletePhoto = async (photoId: string, filename?: string) => {
    console.log("Delete photo with ID:", photoId, "filename:", filename);
    const updatedPhotos = photos.filter(photo => photo.id !== photoId);
    setPhotos(updatedPhotos);
    
    // Update Firebase
    await updateFirebasePhotos(updatedPhotos);
  };

  const handleUploadProgress = (progress: number, message: string) => {
    console.log(`Upload progress: ${progress}% - ${message}`);
    // You can show a progress indicator here if needed
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex justify-between items-center mb-10 pt-4 bg-white px-4 relative">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center active:bg-gray-200 absolute left-4 top-2"
        >
          <Image source={icons.exit} style={{ width: 20, height: 20 }} />
        </Pressable>

        <View className="flex-1 items-center">
          <Text className="text-lg font-JakartaSemiBold text-gray-900">
            Manage Photos
          </Text>
          {isSaving && (
            <View className="flex-row items-center mt-1">
              <ActivityIndicator size="small" color="#3b82f6" />
              <Text className="text-sm text-blue-600 ml-2">Saving...</Text>
            </View>
          )}
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 px-4">
        <PhotoManagementContent
          images={photos}
          carId={carId as string}
          onAddPhoto={handleAddPhoto}
          onDeletePhoto={handleDeletePhoto}
          onUploadProgress={handleUploadProgress}
        />
      </View>

      {/* Optional: Footer with additional actions */}
      {photos.length > 0 && (
        <View className="px-4 pb-4 pt-2">
          <View className="bg-gray-50 rounded-xl p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-sm font-JakartaSemiBold text-gray-900">
                  Auto-save enabled
                </Text>
                <Text className="text-xs text-gray-600">
                  Changes are automatically saved to your listing
                </Text>
              </View>
              <View className="w-8 h-8 bg-green-100 rounded-full items-center justify-center">
                <Text className="text-green-600 text-lg">✓</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default ManagePhotos;

// Alternative: If you want to pass carId through navigation params instead
// You would navigate like this from your previous screen:
// router.push({
//   pathname: "/managePhotos",
//   params: {
//     images: btoa(JSON.stringify(car.images)),
//     carDocId: docRef.id, // Firestore document ID
//     carId: car.carId,    // Storage folder ID
//   }
// });