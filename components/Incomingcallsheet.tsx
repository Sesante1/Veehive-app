import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface IncomingCallSheetProps {
  visible: boolean;
  callerName: string;
  callerAvatar?: string;
  onAccept: () => void;
  onDecline: () => void;
}

export default function IncomingCallSheet({
  visible,
  callerName,
  callerAvatar,
  onAccept,
  onDecline,
}: IncomingCallSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View className="flex-1 justify-end bg-black/50">
        <Animated.View
          style={{
            transform: [{ translateY }],
            paddingBottom: insets.bottom + 16,
          }}
          className="bg-white rounded-t-3xl px-6 pt-3 pb-6"
        >
          {/* Drag handle */}
          <View className="w-10 h-1 bg-gray-200 rounded-full self-center mb-5" />

          {/* Caller info */}
          <View className="flex-row items-center gap-3 mb-6">
            <View className="w-14 h-14 rounded-full bg-gray-100 overflow-hidden items-center justify-center">
              {callerAvatar ? (
                <Image
                  source={{ uri: callerAvatar }}
                  className="w-14 h-14 rounded-full"
                />
              ) : (
                <Feather name="user" size={28} color="#9CA3AF" />
              )}
            </View>
            <View>
              <Text className="text-[#1a1a2e] text-base font-JakartaSemiBold">
                {callerName}
              </Text>
              <View className="flex-row items-center gap-1.5 mt-0.5">
                <View className="w-2 h-2 rounded-full bg-green-500" />
                <Text className="text-gray-400 text-sm font-Jakarta">
                  Veehive video call
                </Text>
              </View>
            </View>
          </View>

          {/* Accept / Decline buttons */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center gap-2 bg-gray-100 py-4 rounded-2xl"
              onPress={onDecline}
            >
              <Feather name="phone-off" size={18} color="#EF4444" />
              <Text className="text-red-500 text-base font-JakartaSemiBold">
                Decline
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center gap-2 bg-green-500 py-4 rounded-2xl"
              onPress={onAccept}
            >
              <Feather name="video" size={18} color="#fff" />
              <Text className="text-white text-base font-JakartaSemiBold">
                Accept
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
