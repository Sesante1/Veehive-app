import { icons } from "@/constants";
import { db } from "@/FirebaseConfig";
import { MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
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

const HostReviewGuestScreen = () => {
  const { bookingId, guestId, guestName, guestImage } = useLocalSearchParams<{
    bookingId: string;
    guestId: string;
    guestName: string;
    guestImage?: string;
  }>();

  const [rating, setRating] = useState(0);
  const [respect, setRespect] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [cleanliness, setCleanliness] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(false);

  const categories = [
    { label: "Respect for Vehicle", value: respect, setter: setRespect },
    { label: "Communication", value: communication, setter: setCommunication },
    { label: "Cleanliness", value: cleanliness, setter: setCleanliness },
  ];

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert("Rating Required", "Please provide an overall rating");
      return;
    }

    if (reviewText.trim().length < 10) {
      Alert.alert("Review Required", "Please write at least 10 characters");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "reviews"), {
        bookingId,
        guestId,
        // guestName,
        reviewType: "host_to_guest",
        rating,
        categories: {
          respect,
          communication,
          cleanliness,
        },
        comment: reviewText.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update booking to mark review as submitted
      await updateDoc(doc(db, "bookings", bookingId), {
        hostReviewSubmitted: true,
        updatedAt: serverTimestamp(),
      });

      Alert.alert("Review Submitted", "Thank you for your feedback!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Error submitting review:", error);
      Alert.alert("Error", "Failed to submit review. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (
    currentRating: number,
    onPress: (rating: number) => void
  ) => {
    return (
      <View className="flex-row gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => onPress(star)}>
            <MaterialIcons
              name={star <= currentRating ? "star" : "star-border"}
              size={40}
              color={star <= currentRating ? "#FFDF00" : "#D1D5DB"}
            />
          </TouchableOpacity>
        ))}
      </View>
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
          Review
        </Text>
      </View>

      <ScrollView className="flex-1 px-4">
        {/* Guest Info */}
        <View className="mt-6 p-4 bg-gray-50 rounded-lg flex-row items-center">
          {guestImage ? (
            <Image
              source={{ uri: guestImage }}
              className="w-16 h-16 rounded-full mr-4"
            />
          ) : (
            <View className="w-16 h-16 rounded-full bg-gray-300 items-center justify-center mr-4">
              <MaterialIcons name="person" size={32} color="#666" />
            </View>
          )}
          <View>
            <Text className="font-JakartaSemiBold text-lg">{guestName}</Text>
            <Text className="font-JakartaMedium text-gray-500 mt-1">
              How was your experience?
            </Text>
          </View>
        </View>

        {/* Overall Rating */}
        <View className="mt-8">
          <Text className="font-JakartaSemiBold text-lg mb-3">
            Overall Rating
          </Text>
          {renderStars(rating, setRating)}
        </View>

        {/* Category Ratings */}
        <View className="mt-8">
          <Text className="font-JakartaSemiBold text-lg mb-4">
            Rate the Guest
          </Text>
          {categories.map((category, index) => (
            <View key={index} className="mb-6">
              <Text className="font-JakartaMedium text-gray-700 mb-2">
                {category.label}
              </Text>
              {renderStars(category.value, category.setter)}
            </View>
          ))}
        </View>

        {/* Review Text */}
        <View className="mt-8">
          <Text className="font-JakartaSemiBold text-lg mb-3">
            Share Your Experience
          </Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-4 font-Jakarta text-base min-h-[120px]"
            placeholder="Tell us about this guest... (minimum 10 characters)"
            placeholderTextColor="#9CA3AF"
            multiline
            textAlignVertical="top"
            value={reviewText}
            onChangeText={setReviewText}
            maxLength={500}
          />
          <Text className="text-gray-500 text-sm mt-2 text-right">
            {reviewText.length}/500
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          className={`mt-8 mb-8 py-4 rounded-lg items-center ${
            rating === 0 || reviewText.trim().length < 10
              ? "bg-gray-300"
              : "bg-blue-600"
          }`}
          onPress={handleSubmitReview}
          disabled={loading || rating === 0 || reviewText.trim().length < 10}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="font-JakartaSemiBold text-lg text-white">
              Submit Review
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HostReviewGuestScreen;
