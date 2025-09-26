import BottomSheetImagePicker from "@/components/BottomSheetImagePicker"; 
import { icons } from "@/constants";
import { db, storage } from "@/FirebaseConfig";
import { FontAwesome } from "@expo/vector-icons";
import { decode as atob } from "base-64";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import {
  deleteField,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
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
  Image,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Document {
  filename: string;
  uploadedAt: string;
  url: string;
  path?: string;
}

interface ParsedDocuments {
  officialReceipt?: Document;
  certificateOfRegistration?: Document;
}

const ManageDocuments = () => {
  const { documents, carDocId, storageFolder } = useLocalSearchParams<{
    documents: string;
    carDocId: string;
    storageFolder: string;
  }>();

  const [isLoading, setIsLoading] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<
    "officialReceipt" | "certificateOfRegistration" | null
  >(null);
  const [parsedDocs, setParsedDocs] = useState<ParsedDocuments | null>(null);

  // Decode passed documents
  React.useEffect(() => {
    try {
      const documentsUrl = atob(documents);
      const parsed = JSON.parse(documentsUrl);
      setParsedDocs(parsed);
    } catch (error) {
      console.error("Error parsing documents:", error);
      setParsedDocs(null);
    }
  }, [documents]);

  /** Show picker modal */
  const showImagePickerModal = (
    docType: "officialReceipt" | "certificateOfRegistration"
  ) => {
    setSelectedDocType(docType);
    setShowImagePicker(true);
  };

  /** Close picker */
  const handleCloseBottomSheet = () => {
    setShowImagePicker(false);
    setSelectedDocType(null);
  };

  /** Take photo */
  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Camera access is needed to take photos"
      );
      return;
    }
    if (!carDocId || !storageFolder) {
      Alert.alert("Error", "Car information is required to upload documents");
      return;
    }

    setIsLoading(true);

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadDocument(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to take photo. Please try again.");
      console.error("Camera error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /** Pick image */
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Media library access is needed to select photos"
      );
      return;
    }

    setIsLoading(true);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadDocument(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to select image. Please try again.");
      console.error("Gallery error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /** Upload to Firebase */
  const uploadDocument = async (imageUri: string) => {
    if (!selectedDocType || !carDocId || !storageFolder) return;

    setIsLoading(true);
    try {
      const timestamp = Date.now();

      const filename =
        selectedDocType === "officialReceipt"
          ? `receipt_${timestamp}.jpg`
          : `certificate_${timestamp}.jpg`;

      const storagePath = `cars/${storageFolder}/documents/${filename}`;
      const storageRef = ref(storage, storagePath);

      const response = await fetch(imageUri);
      const blob = await response.blob();

      await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
      const downloadURL = await getDownloadURL(storageRef);

      const carDocRef = doc(db, "cars", carDocId);
      const updateData = {
        [`documents.${selectedDocType}`]: {
          url: downloadURL,
          filename,
          uploadedAt: new Date().toISOString(),
          path: storagePath,
        },
        updatedAt: serverTimestamp(),
      };

      await updateDoc(carDocRef, updateData);

      setParsedDocs((prev) => ({
        ...prev,
        [selectedDocType]: {
          url: downloadURL,
          filename,
          uploadedAt: new Date().toISOString(),
          path: storagePath,
        },
      }));

      Alert.alert("Success", "Document updated successfully!");
    } catch (error) {
      console.error("Error uploading document:", error);
      Alert.alert("Error", "Failed to upload document. Please try again.");
    } finally {
      setIsLoading(false);
      setSelectedDocType(null);
    }
  };

  /** Remove document */
  const removeDocument = async (
    docType: "officialReceipt" | "certificateOfRegistration",
    carId = storageFolder as string
  ) => {
    if (!carDocId || !parsedDocs?.[docType]) return;

    Alert.alert(
      "Remove Document",
      "Are you sure you want to remove this document?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            try {
              const document = parsedDocs[docType];
              console.log("Removing document:", document?.filename);
              if (!document?.filename)
                throw new Error("Document filename missing");

              // Build storage path dynamically
              const storagePath = `cars/${carId}/documents/${document.filename}`;
              const storageRef = ref(storage, storagePath);

              // Delete from Firebase Storage
              await deleteObject(storageRef);

              // Update Firestore (remove the field)
              const carDocRef = doc(db, "cars", carDocId);
              await updateDoc(carDocRef, {
                [`documents.${docType}`]: deleteField(),
                updatedAt: serverTimestamp(),
              });

              // Update local state
              setParsedDocs((prev) => {
                if (!prev) return prev;
                const updated = { ...prev };
                delete updated[docType];
                return updated;
              });

              Alert.alert("Success", "Document removed successfully!");
            } catch (error) {
              console.error("Error removing document:", error);
              Alert.alert(
                "Error",
                "Failed to remove document. Please try again."
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  /** Get bottom sheet title based on selected document type */
  const getBottomSheetTitle = () => {
    if (selectedDocType === "officialReceipt") {
      return "Add Official Receipt";
    }
    if (selectedDocType === "certificateOfRegistration") {
      return "Add Certificate of Registration";
    }
    return "Add Document";
  };

  const getBottomSheetSubtitle = () => {
    if (selectedDocType === "officialReceipt") {
      return "Upload your official receipt document";
    }
    if (selectedDocType === "certificateOfRegistration") {
      return "Upload your certificate of registration";
    }
    return "Choose how you want to add your document";
  };

  /** Document Card */
  const DocumentCard = ({
    title,
    document,
    docType,
  }: {
    title: string;
    document?: Document;
    docType: "officialReceipt" | "certificateOfRegistration";
  }) => (
    <View className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <View className="p-4">
        <Text className="text-lg font-JakartaSemiBold text-gray-900 mb-3">
          {title}
        </Text>

        {document?.url ? (
          <View>
            <View className="relative">
              <Image
                source={{ uri: document.url }}
                style={{ width: "100%", height: 200 }}
                resizeMode="cover"
                className="rounded-lg"
              />
              <View className="absolute top-2 right-2 bg-green-500 px-2 py-1 rounded-full">
                <Text className="text-white text-xs font-JakartaSemiBold">
                  Uploaded
                </Text>
              </View>
            </View>

            <View className="mt-3 flex-row items-center justify-between">
              <View className="flex-1">
                <Text
                  className="text-sm font-JakartaMedium text-gray-700"
                  numberOfLines={1}
                >
                  {document.filename}
                </Text>
                <Text className="text-xs text-gray-500 mt-1">
                  {new Date(document.uploadedAt).toLocaleDateString()}
                </Text>
              </View>

              <View className="flex-row space-x-2 ml-3">
                <TouchableOpacity
                  onPress={() => showImagePickerModal(docType)}
                  className="bg-blue-50 px-3 py-2 rounded-lg active:bg-blue-100"
                >
                  <Text className="text-blue-600 text-sm font-JakartaSemiBold">
                    Update
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    removeDocument(docType, storageFolder as string)
                  }
                  className="bg-red-50 px-3 py-2 rounded-lg active:bg-red-100"
                >
                  <Text className="text-red-600 text-sm font-JakartaSemiBold">
                    Remove
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View className="border-2 border-dashed border-gray-300 rounded-lg p-8 items-center">
            <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-3">
              <FontAwesome name="upload" size={24} color="#9CA3AF" />
            </View>
            <Text className="text-gray-600 text-center mb-1 font-JakartaMedium">
              No document uploaded
            </Text>
            <Text className="text-gray-400 text-sm text-center mb-4">
              Add your {title.toLowerCase()} here
            </Text>

            <TouchableOpacity
              onPress={() => showImagePickerModal(docType)}
              className="bg-blue-600 px-6 py-3 rounded-lg active:bg-blue-700"
            >
              <Text className="text-white font-JakartaSemiBold">
                Add Document
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-white px-4 py-4">
        <View className="flex-row items-center justify-center relative">
          <Pressable
            onPress={() => router.back()}
            className="absolute left-0 w-10 h-10 rounded-full bg-gray-100 items-center justify-center active:bg-gray-200"
          >
            <Image source={icons.exit} style={{ width: 20, height: 20 }} />
          </Pressable>

          <Text className="text-lg font-JakartaSemiBold text-gray-900">
            Manage Documents
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingVertical: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="space-y-6">
          <DocumentCard
            title="Official Receipt"
            document={parsedDocs?.officialReceipt}
            docType="officialReceipt"
          />

          <DocumentCard
            title="Certificate of Registration"
            document={parsedDocs?.certificateOfRegistration}
            docType="certificateOfRegistration"
          />
        </View>
      </ScrollView>

      {/* Reusable Bottom Sheet Image Picker */}
      <BottomSheetImagePicker
        visible={showImagePicker}
        onClose={handleCloseBottomSheet}
        onPickCamera={handleTakePhoto}
        onPickGallery={handlePickImage}
        mode="single"
        title={getBottomSheetTitle()}
        subtitle={getBottomSheetSubtitle()}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <View className="absolute inset-0 bg-black/50 items-center justify-center">
          <View className="bg-white p-6 rounded-xl items-center">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="mt-3 text-gray-900 font-JakartaSemiBold">
              Processing...
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default ManageDocuments;
