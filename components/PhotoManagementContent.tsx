// components/PhotoManagementContent.tsx
import { FIREBASE_AUTH, storage } from "@/FirebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { width: screenWidth } = Dimensions.get("window");
const PHOTO_SIZE = (screenWidth - 48) / 2 - 1; // 2 columns with padding

const uploadPhotoToFirebase = async (
  imageUri: string,
  carId: string,
  index: number,
  onProgress?: (progress: number, message: string) => void
): Promise<Photo> => {
  try {
    onProgress?.(10, "Preparing upload...");

    const currentUser = FIREBASE_AUTH.currentUser;
    if (!currentUser) throw new Error("User must be authenticated");

    const timestamp = Date.now();
    const filename = `image_${index + 1}_${timestamp}.jpg`;
    const imagePath = `cars/${carId}/images/${filename}`;

    onProgress?.(30, "Uploading to storage...");

    // Convert URI to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Upload to Firebase Storage
    const fileRef = ref(storage, imagePath);
    await uploadBytes(fileRef, blob, { contentType: "image/jpeg" });

    onProgress?.(70, "Getting download URL...");

    // Get download URL
    const downloadURL = await getDownloadURL(fileRef);

    onProgress?.(100, "Upload complete!");

    return {
      id: `${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      url: downloadURL,
      filename: filename,
      uploadedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Firebase upload error:", error);
    throw error;
  }
};

// Firebase Delete Function
const deletePhotoFromFirebase = async (
  carId: string,
  filename: string
): Promise<void> => {
  try {
    const imagePath = `cars/${carId}/images/${filename}`;
    const fileRef = ref(storage, imagePath);
    await deleteObject(fileRef);
  } catch (error) {
    console.error("Firebase delete error:", error);
    // Don't throw here - photo might already be deleted
  }
};

interface Photo {
  id: string;
  url: string;
  uri?: string; // For newly added photos
  filename?: string; // Firebase storage filename
  uploadedAt?: string;
}

interface PhotoManagementContentProps {
  images: Photo[] | null;
  carId?: string; // Firebase storage folder ID
  onAddPhoto: (newPhoto: Photo) => void;
  onDeletePhoto: (photoId: string, filename?: string) => void;
  onUploadProgress?: (progress: number, message: string) => void;
}

// Individual Photo Item Component
const PhotoItem: React.FC<{
  photo: Photo;
  onDelete: () => void;
  index: number;
}> = ({ photo, onDelete, index }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeletePress = () => {
    Alert.alert("Delete Photo", "Are you sure you want to delete this photo?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setIsDeleting(true);
          // Animate out before deleting
          scale.value = withTiming(0.8, { duration: 200 });
          opacity.value = withTiming(0, { duration: 200 }, () => {
            runOnJS(onDelete)();
          });
        },
      },
    ]);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View
      style={[
        {
          width: PHOTO_SIZE,
          height: PHOTO_SIZE,
          marginBottom: 16,
        },
        animatedStyle,
      ]}
    >
      <Pressable
        className="relative rounded-xl overflow-hidden bg-gray-100"
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{ width: "100%", height: "100%" }}
      >
        <Image
          source={{ uri: photo.uri || photo.url }}
          className="w-full h-full"
          resizeMode="cover"
        />

        {/* Photo index badge */}
        <View className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded-full">
          <Text className="text-white text-xs font-JakartaMedium">
            {index + 1}
          </Text>
        </View>

        {/* Delete button */}
        <Pressable
          onPress={handleDeletePress}
          className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
          hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="close" size={14} color="white" />
          )}
        </Pressable>

        {/* Primary photo indicator */}
        {index === 0 && (
          <View className="absolute bottom-2 left-2 bg-white/80 py-1 px-3 rounded-full items-center justify-center">
            <Text className="text-black text-xs font-JakartaMedium">Cover</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

// Add Photo Button Component
const AddPhotoButton: React.FC<{
  onPress: () => void;
  isUploading: boolean;
  uploadProgress: number;
  uploadMessage: string;
}> = ({ onPress, isUploading, uploadProgress, uploadMessage }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View
      style={[
        {
          width: PHOTO_SIZE,
          height: PHOTO_SIZE,
          marginBottom: 16,
        },
        animatedStyle,
      ]}
    >
      <Pressable
        className="w-full h-full border-2 border-dashed border-gray-300 rounded-xl items-center justify-center bg-gray-50"
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isUploading}
      >
        {isUploading ? (
          <View className="items-center">
            <ActivityIndicator size="large" color="#3b82f6" />
            <View className="items-center mt-2">
              <Text className="text-gray-500 text-sm font-JakartaMedium">
                {uploadMessage}
              </Text>
              {uploadProgress > 0 && (
                <View className="w-20 h-1 bg-gray-200 rounded-full mt-1">
                  <View
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </View>
              )}
            </View>
          </View>
        ) : (
          <View className="items-center">
            <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mb-2">
              <Ionicons name="camera" size={24} color="#3b82f6" />
            </View>
            <Text className="text-gray-600 text-sm font-JakartaMedium">
              Add Photo
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

// Main PhotoManagementContent Component
export const PhotoManagementContent: React.FC<PhotoManagementContentProps> = ({
  images,
  carId,
  onAddPhoto,
  onDeletePhoto,
  onUploadProgress,
}) => {
  const [photos, setPhotos] = useState<Photo[]>(images || []);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMessage, setUploadMessage] = useState("");

  // Request permissions on component mount
  React.useEffect(() => {
    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Sorry, we need camera roll permissions to add photos!"
        );
      }
    })();
  }, []);

  const showImagePickerOptions = () => {
    Alert.alert("Add Photo", "Choose how you want to add a photo", [
      {
        text: "Camera",
        onPress: openCamera,
      },
      {
        text: "Gallery",
        onPress: openImageLibrary,
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Camera access is needed to take photos"
      );
      return;
    }

    if (!carId) {
      Alert.alert("Error", "Car ID is required to upload photos");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadMessage("Taking photo...");

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const currentIndex = photos.length;

        // Upload to Firebase
        const uploadedPhoto = await uploadPhotoToFirebase(
          result.assets[0].uri,
          carId,
          currentIndex,
          (progress, message) => {
            setUploadProgress(progress);
            setUploadMessage(message);
            onUploadProgress?.(progress, message);
          }
        );

        setPhotos((prev) => [...prev, uploadedPhoto]);
        onAddPhoto(uploadedPhoto);

        Alert.alert("Success", "Photo uploaded successfully!");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to upload photo. Please try again.");
      console.error("Camera upload error:", error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadMessage("");
    }
  };

  const openImageLibrary = async () => {
    if (!carId) {
      Alert.alert("Error", "Car ID is required to upload photos");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadMessage("Selecting image...");

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        // allowsEditing: true,
        // aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 0,
      });

      if (!result.canceled && result.assets[0]) {
        const currentIndex = photos.length;

        // Upload to Firebase
        const uploadedPhoto = await uploadPhotoToFirebase(
          result.assets[0].uri,
          carId,
          currentIndex,
          (progress, message) => {
            setUploadProgress(progress);
            setUploadMessage(message);
            onUploadProgress?.(progress, message);
          }
        );

        setPhotos((prev) => [...prev, uploadedPhoto]);
        onAddPhoto(uploadedPhoto);

        Alert.alert("Success", "Photo uploaded successfully!");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to upload photo. Please try again.");
      console.error("Image library upload error:", error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadMessage("");
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    const photoToDelete = photos.find((photo) => photo.id === photoId);
    if (!photoToDelete) return;

    // Delete from Firebase Storage if it has a filename and carId
    if (photoToDelete.filename && carId) {
      try {
        await deletePhotoFromFirebase(carId, photoToDelete.filename);
      } catch (error) {
        console.error("Failed to delete from Firebase:", error);
      }
    }

    // Update local state
    setPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
    onDeletePhoto(photoId, photoToDelete.filename);
  };

  const photoCount = photos.length;
  const maxPhotos = 20; // You can adjust this limit

  return (
    <View className="flex-1">
      {/* Stats Header */}
      <View className="bg-blue-50 rounded-xl p-4 mb-6">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-lg font-JakartaBold text-gray-900">
              {photoCount} Photos
            </Text>
            <Text className="text-sm text-gray-600">
              {maxPhotos - photoCount} more can be added
            </Text>
          </View>
          <View className="bg-blue-500 px-3 py-2 rounded-full">
            <Text className="text-white font-JakartaMedium text-sm">
              {photoCount}/{maxPhotos}
            </Text>
          </View>
        </View>
      </View>

      {/* Photo Grid */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {photoCount === 0 ? (
          // Empty State
          <View className="flex-1 items-center justify-center py-20">
            <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="images-outline" size={40} color="#9ca3af" />
            </View>
            <Text className="text-lg font-JakartaSemiBold text-gray-900 mb-2">
              No Photos Yet
            </Text>
            <Text className="text-gray-500 text-center mb-6 px-8">
              Add photos to showcase your car. The first photo will be the
              primary image.
            </Text>
            <AddPhotoButton
              onPress={showImagePickerOptions}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              uploadMessage={uploadMessage}
            />
          </View>
        ) : (
          // Photo Grid Layout
          <View className="flex-row flex-wrap justify-between">
            {photos.map((photo, index) => (
              <PhotoItem
                key={photo.id}
                photo={photo}
                index={index}
                onDelete={() => handleDeletePhoto(photo.id)}
              />
            ))}

            {/* Add Photo Button (if under limit) */}
            {photoCount < maxPhotos && (
              <AddPhotoButton
                onPress={showImagePickerOptions}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
                uploadMessage={uploadMessage}
              />
            )}
          </View>
        )}
      </ScrollView>

      {/* Tips Section */}
      {photoCount > 0 && (
        <View className="bg-yellow-50 rounded-xl p-4 mt-4">
          <View className="flex-row items-start">
            <Ionicons name="bulb-outline" size={20} color="#f59e0b" />
            <View className="ml-3 flex-1">
              <Text className="font-JakartaSemiBold text-yellow-800 mb-1">
                Photo Tips
              </Text>
              <Text className="text-yellow-700 text-sm">
                • First photo is your primary image{"\n"}• Use good lighting and
                clean backgrounds{"\n"}• Show different angles of your car
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};
