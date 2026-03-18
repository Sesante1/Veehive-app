import { Feather } from "@expo/vector-icons";
import { Modal, Text, TouchableOpacity, View } from "react-native";

interface CallDeclinedModalProps {
  visible: boolean;
  callerName: string;
  onBack: () => void;
  onCallAgain: () => void;
}

export default function CallDeclinedModal({
  visible,
  callerName,
  onBack,
  onCallAgain,
}: CallDeclinedModalProps) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View className="flex-1 items-center justify-center bg-black/60 px-6">
        <View className="bg-white rounded-3xl w-full p-7">
          {/* Icon */}
          <View className="w-16 h-16 rounded-full bg-red-100 items-center justify-center self-center mb-4">
            <Feather name="phone-off" size={28} color="#EF4444" />
          </View>

          {/* Text */}
          <Text className="text-[#1a1a2e] text-lg font-JakartaBold text-center">
            Call Declined
          </Text>
          <Text className="text-gray-400 text-sm font-Jakarta text-center mt-1 mb-6">
            {callerName} declined your video call
          </Text>

          {/* Buttons */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-gray-100 py-3.5 rounded-2xl items-center justify-center"
              onPress={onBack}
            >
              <Text className="text-gray-700 text-sm font-JakartaSemiBold">
                Back
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-blue-500 py-3.5 rounded-2xl flex-row items-center justify-center gap-2"
              onPress={onCallAgain}
            >
              <Feather name="phone" size={16} color="#fff" />
              <Text className="text-white text-sm font-JakartaSemiBold">
                Call again
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
