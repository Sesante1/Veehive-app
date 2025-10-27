// ReportListing.tsx - Report Car Listing Screen
import { db } from "@/FirebaseConfig";
import { useAuth } from "@/hooks/useUser";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ReportReason = "inappropriate" | "misleading" | "other";

interface ReportOption {
  id: ReportReason;
  title: string;
  description: string;
  icon: string;
}

const ReportListing = () => {
  const { carId, carName } = useLocalSearchParams<{
    carId: string;
    carName: string;
  }>();

  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(
    null
  );
  const [otherReason, setOtherReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reportOptions: ReportOption[] = [
    {
      id: "inappropriate",
      title: "Inappropriate/offensive content",
      description: "Contains offensive images, text, or discriminatory content",
      icon: "alert-circle-outline",
    },
    {
      id: "misleading",
      title: "Misleading/suspicious information",
      description: "False details, fake photos, or suspicious pricing",
      icon: "shield-alert-outline",
    },
    {
      id: "other",
      title: "Other",
      description: "Report for a different reason",
      icon: "chatbox-ellipses-outline",
    },
  ];

  const handleSubmit = async () => {
    // Validation
    if (!selectedReason) {
      Alert.alert("Error", "Please select a reason for reporting");
      return;
    }

    if (selectedReason === "other" && !otherReason.trim()) {
      Alert.alert("Error", "Please provide details for your report");
      return;
    }

    if (!user) {
      Alert.alert("Error", "You must be logged in to report a listing");
      return;
    }

    try {
      setSubmitting(true);

      // Create report object
      const report = {
        carId,
        carName,
        reportedBy: user.uid,
        reporterEmail: user.email,
        reason: selectedReason,
        reasonText:
          selectedReason === "other"
            ? otherReason.trim()
            : reportOptions.find((opt) => opt.id === selectedReason)?.title,
        details: selectedReason === "other" ? otherReason.trim() : "",
        status: "pending", // pending, reviewed, resolved
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Save to Firestore
      await addDoc(collection(db, "reports"), report);

      // Show success
      Alert.alert(
        "Report Submitted",
        "Thank you for reporting this listing. Our team will review it shortly.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error("Error submitting report:", error);
      Alert.alert("Error", "Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full items-center justify-center active:bg-gray-100"
        >
          <AntDesign name="arrow-left" size={24} color="black" />
        </Pressable>
        <View className="flex-1 ml-3">
          <Text className="text-lg font-JakartaSemiBold">Report Listing</Text>
          {carName && (
            <Text className="text-sm text-gray-500 font-Jakarta">
              {carName}
            </Text>
          )}
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4">
          {/* Info Banner */}
          <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <View className="flex-row items-start gap-3">
              <Ionicons name="information-circle" size={24} color="#3B82F6" />
              <View className="flex-1">
                <Text className="font-JakartaSemiBold text-blue-900 mb-1">
                  Why are you reporting this listing?
                </Text>
                <Text className="text-sm text-blue-700 font-Jakarta">
                  Your report helps us maintain a safe and trustworthy platform.
                  All reports are reviewed by our team.
                </Text>
              </View>
            </View>
          </View>

          {/* Report Options */}
          <Text className="text-base font-JakartaSemiBold mb-3">
            Select a reason
          </Text>

          {reportOptions.map((option) => (
            <Pressable
              key={option.id}
              onPress={() => setSelectedReason(option.id)}
              className={`mb-3 p-4 rounded-xl border-2 ${
                selectedReason === option.id
                  ? "border-primary-500 bg-blue-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <View className="flex-row items-start gap-3">
                <View
                  className={`w-12 h-12 rounded-full items-center justify-center ${
                    selectedReason === option.id
                      ? "bg-primary-500"
                      : "bg-gray-100"
                  }`}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={24}
                    color={selectedReason === option.id ? "white" : "#6B7280"}
                  />
                </View>

                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="font-JakartaSemiBold text-gray-900">
                      {option.title}
                    </Text>
                    {selectedReason === option.id && (
                      <AntDesign
                        name="check-circle"
                        size={20}
                        color="#007DFC"
                      />
                    )}
                  </View>
                  <Text className="text-sm text-gray-600 font-Jakarta">
                    {option.description}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}

          {/* Other Reason Text Input */}
          {selectedReason === "other" && (
            <View className="mt-4">
              <Text className="text-base font-JakartaSemiBold mb-2">
                Please provide details
              </Text>
              <TextInput
                value={otherReason}
                onChangeText={setOtherReason}
                placeholder="Describe the issue with this listing..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                className="border-2 border-gray-200 rounded-xl p-4 font-Jakarta text-gray-900 min-h-[120px]"
                maxLength={500}
              />
              <Text className="text-xs text-gray-500 font-Jakarta mt-1 text-right">
                {otherReason.length}/500
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View className="p-4 border-t border-gray-200 bg-white">
        <Pressable
          onPress={handleSubmit}
          disabled={!selectedReason || submitting}
          className={`h-14 rounded-lg items-center justify-center ${
            !selectedReason || submitting ? "bg-gray-300" : "bg-primary-500"
          }`}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-JakartaBold text-base">
              Submit Report
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default ReportListing;
