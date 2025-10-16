import { icons } from "@/constants";
import { router } from "expo-router";
import { AlertCircle, Clock, DollarSign, Shield } from "lucide-react-native";
import React from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CancellationPolicyScreen() {
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
          Cancellation Policy
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          {/* Intro Text */}
          <Text className="text-gray-600 text-base mb-8 leading-6">
            We understand plans can change. Please review our policy before
            cancelling a booking.
          </Text>

          {/* For Renters Section */}
          <View className="mb-8">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
                <DollarSign size={20} color="#3B82F6" />
              </View>
              <Text className="text-xl font-bold text-gray-900">
                For Renters
              </Text>
            </View>

            <View className="bg-gray-50 rounded-2xl p-5 mb-3">
              <View className="flex-row items-start mb-2">
                <View className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3" />
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900 mb-1">
                    Full Refund
                  </Text>
                  <Text className="text-gray-600 leading-6">
                    Cancel at least 24 hours before the scheduled pickup time.
                  </Text>
                </View>
              </View>
            </View>

            <View className="bg-gray-50 rounded-2xl p-5 mb-3">
              <View className="flex-row items-start mb-2">
                <View className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3" />
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900 mb-1">
                    Partial Refund
                  </Text>
                  <Text className="text-gray-600 leading-6">
                    Cancel less than 24 hours before pickup, and up to 50% of
                    the booking amount may be charged.
                  </Text>
                </View>
              </View>
            </View>

            <View className="bg-gray-50 rounded-2xl p-5">
              <View className="flex-row items-start mb-2">
                <View className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3" />
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900 mb-1">
                    No Refund
                  </Text>
                  <Text className="text-gray-600 leading-6">
                    Once the trip has started or in case of no-show.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* For Hosts Section */}
          <View className="mb-8">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mr-3">
                <Shield size={20} color="#9333EA" />
              </View>
              <Text className="text-xl font-bold text-gray-900">For Hosts</Text>
            </View>

            <View className="bg-gray-50 rounded-2xl p-5 mb-3">
              <View className="flex-row items-start mb-2">
                <View className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3" />
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900 mb-1">
                    Before Accepting
                  </Text>
                  <Text className="text-gray-600 leading-6">
                    No payment is processed; the renter is not charged.
                  </Text>
                </View>
              </View>
            </View>

            <View className="bg-gray-50 rounded-2xl p-5">
              <View className="flex-row items-start mb-2">
                <View className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3" />
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900 mb-1">
                    After Accepting
                  </Text>
                  <Text className="text-gray-600 leading-6">
                    If the host cancels, the renter will receive a full refund,
                    and the host may face account penalties for repeated
                    cancellations.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Refunds Section */}
          <View className="mb-8">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3">
                <Clock size={20} color="#10B981" />
              </View>
              <Text className="text-xl font-bold text-gray-900">Refunds</Text>
            </View>

            <View className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-5">
              <Text className="text-gray-700 leading-6 mb-3">
                • Refunds are processed automatically through Stripe.
              </Text>
              <Text className="text-gray-700 leading-6">
                • It may take 5–10 business days for the refund to appear,
                depending on your bank or card provider.
              </Text>
            </View>
          </View>

          {/* Exceptions Section */}
          <View className="mb-6">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-amber-100 rounded-full items-center justify-center mr-3">
                <AlertCircle size={20} color="#F59E0B" />
              </View>
              <Text className="text-xl font-bold text-gray-900">
                Exceptions
              </Text>
            </View>

            <View className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <Text className="text-gray-700 leading-6">
                In verified emergency or technical cases, our team may issue a
                full or partial refund upon review.
              </Text>
            </View>
          </View>

          {/* Contact Support */}
          <View className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6">
            <Text className="text-gray-700 text-center leading-6">
              For assistance, contact{" "}
              <Text className="text-blue-600 font-semibold">
                support@Veehive.com
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
