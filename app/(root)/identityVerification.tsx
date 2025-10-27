import BottomSheetImagePicker from "@/components/BottomSheetImagePicker";
import { icons } from "@/constants";
import {
  IdentityDocType,
  IdentityDocument,
  IdentityDocuments,
  removeIdentityDocument,
  submitIdentityVerification,
  uploadIdentityDocument,
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
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const IdentityVerification = () => {
  const { documents, userId } = useLocalSearchParams<{
    documents: string;
    userId: string;
  }>();

  const [isLoading, setIsLoading] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<IdentityDocType | null>(
    null
  );
  const [parsedDocs, setParsedDocs] = useState<IdentityDocuments | null>(null);
  
  // New states for expiration date and verification status
  const [expirationDate, setExpirationDate] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false); // Track if user already submitted
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "approved" | "declined" | null>(null);
  
  // Decode passed documents
  React.useEffect(() => {
    try {
      if (documents) {
        const documentsUrl = atob(documents);
        const parsed = JSON.parse(documentsUrl);
        setParsedDocs(parsed);
        
        // Set verification status from parsed data
        if (parsed.verificationStatus) {
          setVerificationStatus(parsed.verificationStatus);
          setIsSubmitted(true);
        }
        
        // Set expiration date if exists
        if (parsed.expirationDate) {
          setExpirationDate(parsed.expirationDate);
        }
      }
    } catch (error) {
      console.error("Error parsing documents:", error);
      setParsedDocs(null);
    }
  }, [documents]);

  /** Format expiration date input */
  const handleExpirationDateChange = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, "");
    
    // Format as YYYY/MM/DD
    let formatted = cleaned;
    if (cleaned.length >= 4) {
      formatted = cleaned.slice(0, 4);
      if (cleaned.length > 4) {
        formatted += "/" + cleaned.slice(4, 6);
      }
      if (cleaned.length > 6) {
        formatted += "/" + cleaned.slice(6, 8);
      }
    }
    
    // Limit to 10 characters (YYYY/MM/DD)
    if (formatted.length <= 10) {
      setExpirationDate(formatted);
    }
  };

  /** Validate expiration date format */
  const isValidDate = (dateString: string): boolean => {
    const regex = /^\d{4}\/\d{2}\/\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const [year, month, day] = dateString.split("/").map(Number);
    const date = new Date(year, month - 1, day);
    
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day &&
      date > new Date() // Must be a future date
    );
  };

  /** Check if all required documents are uploaded */
  const hasAllDocuments = (): boolean => {
    return !!(
      parsedDocs?.frontId &&
      parsedDocs?.backId &&
      parsedDocs?.selfieWithId
    );
  };

  /** Handle submission of identity verification */
  const handleSubmitVerification = async () => {
    // Validation
    if (!hasAllDocuments()) {
      Alert.alert(
        "Missing Documents",
        "Please upload all required documents (front ID, back ID, and selfie with ID)."
      );
      return;
    }

    if (!expirationDate || !isValidDate(expirationDate)) {
      Alert.alert(
        "Invalid Date",
        "Please enter a valid expiration date in format YYYY/MM/DD (e.g., 2027/01/01)"
      );
      return;
    }

    if (!userId) {
      Alert.alert("Error", "User information is required");
      return;
    }

    Alert.alert(
      "Submit Verification",
      "Please verify that all photos are clear and readable before submitting. Once submitted, you cannot modify them until admin reviews your submission.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          onPress: async () => {
            setIsLoading(true);
            try {
              const result = await submitIdentityVerification(
                userId,
                expirationDate
              );

              if (result.success) {
                setIsSubmitted(true);
                setVerificationStatus("pending");
                
                // Update local parsed docs
                setParsedDocs((prev) => ({
                  ...prev,
                  expirationDate,
                  verificationStatus: "pending",
                  submittedAt: new Date().toISOString(),
                }));
                
                Alert.alert(
                  "Success",
                  "Your identity verification has been submitted successfully! We'll review it shortly."
                );
              } else {
                throw new Error(result.error || "Submission failed");
              }
            } catch (error: any) {
              console.error("Error submitting verification:", error);
              Alert.alert(
                "Error",
                error.message || "Failed to submit verification. Please try again."
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  /** Check if submit button should be disabled */
  const isSubmitDisabled = (): boolean => {
    // Disable if already submitted and not declined
    if (isSubmitted && verificationStatus !== "declined") {
      return true;
    }
    // Enable if declined (user can resubmit)
    return false;
  };

  /** Get submit button text based on status */
  const getSubmitButtonText = (): string => {
    if (verificationStatus === "pending") return "Verification Pending";
    if (verificationStatus === "approved") return "Verification Approved";
    if (verificationStatus === "declined") return "Resubmit Verification";
    return "Submit Verification";
  };

  /** Show picker modal */
  const showImagePickerModal = (docType: IdentityDocType) => {
    // Prevent editing if already submitted and not declined
    if (isSubmitted && verificationStatus !== "declined") {
      Alert.alert(
        "Cannot Edit",
        "Your verification is currently under review. You can only edit documents if your submission is declined."
      );
      return;
    }
    
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
      const uploadedDoc = await uploadIdentityDocument(
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
  const removeDocument = async (docType: IdentityDocType) => {
    if (!userId || !parsedDocs?.[docType]) return;

    // Prevent removing if already submitted and not declined
    if (isSubmitted && verificationStatus !== "declined") {
      Alert.alert(
        "Cannot Remove",
        "Your verification is currently under review. You can only modify documents if your submission is declined."
      );
      return;
    }

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

              await removeIdentityDocument(docType, userId, document);

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
      case "frontId":
        return "Add Front ID Photo";
      case "backId":
        return "Add Back ID Photo";
      case "selfieWithId":
        return "Add Selfie with ID";
      default:
        return "Add Document";
    }
  };

  const getBottomSheetSubtitle = () => {
    switch (selectedDocType) {
      case "frontId":
        return "Take a clear photo of the front of your ID";
      case "backId":
        return "Take a clear photo of the back of your ID";
      case "selfieWithId":
        return "Take a selfie holding your ID next to your face";
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
    docType: IdentityDocType;
    icon: string;
  }) => {
    const isLocked = isSubmitted && verificationStatus !== "declined";
    
    return (
      <View className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <View className="p-4">
          <View className="flex-row items-center mb-3">
            <FontAwesome name={icon as any} size={20} color="#3B82F6" />
            <Text className="text-lg font-JakartaSemiBold text-gray-900 ml-2">
              {title}
            </Text>
            {isLocked && (
              <View className="ml-auto">
                <FontAwesome name="lock" size={16} color="#9CA3AF" />
              </View>
            )}
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

                {!isLocked && (
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
                )}
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
                className={`px-6 py-3 rounded-lg ${
                  isLocked 
                    ? "bg-gray-300" 
                    : "bg-blue-600 active:bg-blue-700"
                }`}
                disabled={isLocked}
              >
                <Text className="text-white font-JakartaSemiBold">
                  {isLocked ? "Locked" : "Add Photo"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

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
            Identity Verification
          </Text>
        </View>
      </View>

      {/* Info Banner */}
      <View className="mx-4 mb-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <View className="flex-row items-start">
          <FontAwesome name="info-circle" size={20} color="#3B82F6" />
          <View className="flex-1 ml-3">
            <Text className="text-sm font-JakartaSemiBold text-gray-900 mb-1">
              Verification Required
            </Text>
            <Text className="text-xs text-gray-600 leading-5">
              Please upload clear photos of your government-issued ID and a
              selfie holding your ID, and enter the expiration date. Make sure all photos are clear
              and readable before submitting.
            </Text>
          </View>
        </View>
      </View>

      {/* Verification Status Banner */}
      {verificationStatus && (
        <View className={`mx-4 mb-4 p-4 rounded-xl border ${
          verificationStatus === "pending" 
            ? "bg-yellow-50 border-yellow-100"
            : verificationStatus === "approved"
            ? "bg-green-50 border-green-100"
            : "bg-red-50 border-red-100"
        }`}>
          <View className="flex-row items-center">
            <FontAwesome 
              name={
                verificationStatus === "pending" 
                  ? "clock-o"
                  : verificationStatus === "approved"
                  ? "check-circle"
                  : "times-circle"
              } 
              size={20} 
              color={
                verificationStatus === "pending" 
                  ? "#F59E0B"
                  : verificationStatus === "approved"
                  ? "#10B981"
                  : "#EF4444"
              }
            />
            <Text className={`ml-2 font-JakartaSemiBold ${
              verificationStatus === "pending" 
                ? "text-yellow-700"
                : verificationStatus === "approved"
                ? "text-green-700"
                : "text-red-700"
            }`}>
              {verificationStatus === "pending" 
                ? "Verification Pending"
                : verificationStatus === "approved"
                ? "Verification Approved"
                : "Verification Declined - Please Resubmit"}
            </Text>
          </View>
        </View>
      )}

      {/* Content */}
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <DocumentCard
          title="Front of ID"
          description="No front ID photo uploaded"
          document={parsedDocs?.frontId}
          docType="frontId"
          icon="id-card"
        />

        <DocumentCard
          title="Back of ID"
          description="No back ID photo uploaded"
          document={parsedDocs?.backId}
          docType="backId"
          icon="id-card-o"
        />

        <DocumentCard
          title="Selfie with ID"
          description="No selfie uploaded"
          document={parsedDocs?.selfieWithId}
          docType="selfieWithId"
          icon="user"
        />

        {/* Expiration Date Input */}
        <View className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <View className="p-4">
            <View className="flex-row items-center mb-3">
              <FontAwesome name="calendar" size={20} color="#3B82F6" />
              <Text className="text-lg font-JakartaSemiBold text-gray-900 ml-2">
                ID Expiration Date
              </Text>
            </View>

            <View className="mb-2">
              <Text className="text-sm text-gray-600 mb-2">
                Enter expiration date (YYYY/MM/DD format)
              </Text>
              <TextInput
                value={expirationDate}
                onChangeText={handleExpirationDateChange}
                placeholder="2027/01/01"
                keyboardType="numeric"
                maxLength={10}
                editable={!isSubmitDisabled()}
                className={`border rounded-lg px-4 py-3 text-base font-JakartaMedium ${
                  isSubmitDisabled()
                    ? "bg-gray-100 border-gray-200 text-gray-500"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              />
              <Text className="text-xs text-gray-500 mt-1">
                Example: 2027/01/01
              </Text>
            </View>
          </View>
        </View>

        {/* Important Note */}
        <View className="bg-orange-50 rounded-xl p-4 mb-6 border border-orange-100">
          <View className="flex-row items-start">
            <FontAwesome name="exclamation-triangle" size={20} color="#F97316" />
            <View className="flex-1 ml-3">
              <Text className="text-sm font-JakartaSemiBold text-orange-900 mb-2">
                Important: Verify Before Submitting
              </Text>
              <Text className="text-xs text-orange-700 leading-5">
                • Double-check that all photos are clear and readable{"\n"}
                • Ensure the expiration date is correct{"\n"}
                • Once submitted, you cannot edit until admin reviews{"\n"}
                • If declined, you can resubmit with corrections
              </Text>
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmitVerification}
          disabled={isSubmitDisabled()}
          className={`rounded-xl py-4 items-center mb-4 ${
            isSubmitDisabled()
              ? "bg-gray-300"
              : "bg-blue-600 active:bg-blue-700"
          }`}
        >
          <View className="flex-row items-center">
            {verificationStatus === "pending" && (
              <ActivityIndicator size="small" color="white" className="mr-2" />
            )}
            <Text className="text-white text-base font-JakartaBold">
              {getSubmitButtonText()}
            </Text>
          </View>
        </TouchableOpacity>
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

export default IdentityVerification;