import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmColor = "#007bff",
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <SafeAreaView className="flex-1 bg-black/50 justify-center items-center px-6">
        <View className="bg-white w-full rounded-2xl p-6">
          <Text className="text-lg font-JakartaBold mb-2">{title}</Text>
          <Text className="text-gray-600 mb-6 font-Jakarta">{message}</Text>
          <View className="flex-row justify-end gap-3">
            <TouchableOpacity
              onPress={onCancel}
              className="px-4 py-2 bg-gray-200 rounded-lg"
            >
              <Text className="text-gray-700 font-JakartaMedium">{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: confirmColor }}
            >
              <Text className="text-white font-medium font-JakartaMedium">{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default ConfirmationModal;
