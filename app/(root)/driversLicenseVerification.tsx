import BottomSheetImagePicker from "@/components/BottomSheetImagePicker";
import { icons } from "@/constants";
import {
  DriversLicenseDocType,
  DriversLicenseDocuments,
  IdentityDocument,
  removeDriversLicenseDocument,
  uploadDriversLicenseDocument,
} from "@/services/userService";
import { FontAwesome } from "@expo/vector-icons";
import { decode as atob } from "base-64";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
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

const DriversLicenseVerification = () => {
  const { documents, userId } = useLocalSearchParams<{
    documents: string;
    userId: string;
  }>();

  const [isLoading, setIsLoading] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [selectedDocType, setSelectedDocType] =
    useState<DriversLicenseDocType | null>(null);
  const [parsedDocs, setParsedDocs] = useState<DriversLicenseDocuments | null>(
    null
  );

  // Decode passed documents
  React.useEffect(() => {
    try {
      if (documents) {
        const documentsUrl = atob(documents);
        const parsed = JSON.parse(documentsUrl);
        setParsedDocs(parsed);
      }
    } catch (error) {
      console.error("Error parsing documents:", error);
      setParsedDocs(null);
    }
  }, [documents]);

  /** Show picker modal */
  const showImagePickerModal = (docType: DriversLicenseDocType) => {
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
    if (!userId) {
      Alert.alert("Error", "User information is required to upload documents");
      return;
    }

    setIsLoading(true);
    handleCloseBottomSheet();

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
    handleCloseBottomSheet();

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
    if (!selectedDocType || !userId) return;

    setIsLoading(true);
    try {
      const uploadedDoc = await uploadDriversLicenseDocument(
        imageUri,
        selectedDocType,
        userId
      );

      setParsedDocs((prev) => ({
        ...prev,
        [selectedDocType]: uploadedDoc,
      }));

      Alert.alert("Success", "Document uploaded successfully!");
    } catch (error) {
      console.error("Error uploading document:", error);
      Alert.alert("Error", "Failed to upload document. Please try again.");
    } finally {
      setIsLoading(false);
      setSelectedDocType(null);
    }
  };

  /** Remove document */
  const removeDocument = async (docType: DriversLicenseDocType) => {
    if (!userId || !parsedDocs?.[docType]) return;

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
              if (!document) throw new Error("Document not found");

              await removeDriversLicenseDocument(docType, userId, document);

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
    switch (selectedDocType) {
      case "frontLicense":
        return "Add Front License Photo";
      case "backLicense":
        return "Add Back License Photo";
      default:
        return "Add Document";
    }
  };

  const getBottomSheetSubtitle = () => {
    switch (selectedDocType) {
      case "frontLicense":
        return "Take a clear photo of the front of your driver's license";
      case "backLicense":
        return "Take a clear photo of the back of your driver's license";
      default:
        return "Choose how you want to add your document";
    }
  };

  /** Document Card */
  const DocumentCard = ({
    title,
    description,
    document,
    docType,
    icon,
  }: {
    title: string;
    description: string;
    document?: IdentityDocument;
    docType: DriversLicenseDocType;
    icon: string;
  }) => (
    <View className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
      <View className="p-4">
        <View className="flex-row items-center mb-3">
          <FontAwesome name={icon as any} size={20} color="#3B82F6" />
          <Text className="text-lg font-JakartaSemiBold text-gray-900 ml-2">
            {title}
          </Text>
        </View>

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
                  onPress={() => removeDocument(docType)}
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
              {description}
            </Text>
            <Text className="text-gray-400 text-sm text-center mb-4">
              Clear photo required for verification
            </Text>

            <TouchableOpacity
              onPress={() => showImagePickerModal(docType)}
              className="bg-blue-600 px-6 py-3 rounded-lg active:bg-blue-700"
            >
              <Text className="text-white font-JakartaSemiBold">Add Photo</Text>
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
            Driver's License Verification
          </Text>
        </View>
      </View>

      {/* Info Banner */}
      <View className="mx-4 mb-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <View className="flex-row items-start">
          <FontAwesome name="info-circle" size={20} color="#3B82F6" />
          <View className="flex-1 ml-3">
            <Text className="text-sm font-JakartaSemiBold text-gray-900 mb-1">
              License Verification Required
            </Text>
            <Text className="text-xs text-gray-600 leading-5">
              Please upload clear photos of both sides of your valid driver's
              license for verification purposes.
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <DocumentCard
          title="Front of License"
          description="No front license photo uploaded"
          document={parsedDocs?.frontLicense}
          docType="frontLicense"
          icon="id-card"
        />

        <DocumentCard
          title="Back of License"
          description="No back license photo uploaded"
          document={parsedDocs?.backLicense}
          docType="backLicense"
          icon="id-card-o"
        />

        <DocumentCard
          title="Selfie with License"
          description="No selfie uploaded"
          document={parsedDocs?.selfieWithLicense}
          docType="selfieWithLicense"
          icon="id-card-o"
        />

        {/* Instructions */}
        <View className="bg-gray-50 rounded-xl p-4 mb-4">
          <Text className="text-base font-JakartaSemiBold text-gray-900 mb-3">
            Photo Guidelines
          </Text>
          <View className="space-y-2">
            <View className="flex-row items-start">
              <FontAwesome
                name="check-circle"
                size={16}
                color="#10B981"
                style={{ marginTop: 2 }}
              />
              <Text className="text-sm text-gray-600 ml-2 flex-1">
                Ensure all text and details are clearly visible
              </Text>
            </View>
            <View className="flex-row items-start">
              <FontAwesome
                name="check-circle"
                size={16}
                color="#10B981"
                style={{ marginTop: 2 }}
              />
              <Text className="text-sm text-gray-600 ml-2 flex-1">
                License must be current and not expired
              </Text>
            </View>
            <View className="flex-row items-start">
              <FontAwesome
                name="check-circle"
                size={16}
                color="#10B981"
                style={{ marginTop: 2 }}
              />
              <Text className="text-sm text-gray-600 ml-2 flex-1">
                Take photos in good lighting conditions
              </Text>
            </View>
            <View className="flex-row items-start">
              <FontAwesome
                name="check-circle"
                size={16}
                color="#10B981"
                style={{ marginTop: 2 }}
              />
              <Text className="text-sm text-gray-600 ml-2 flex-1">
                Avoid glare and shadows on the document
              </Text>
            </View>
            <View className="flex-row items-start">
              <FontAwesome
                name="check-circle"
                size={16}
                color="#10B981"
                style={{ marginTop: 2 }}
              />
              <Text className="text-sm text-gray-600 ml-2 flex-1">
                Make sure the entire license fits in the frame
              </Text>
            </View>
          </View>
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

export default DriversLicenseVerification;
