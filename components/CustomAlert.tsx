import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons?: Array<{
    text: string;
    onPress?: () => void;
    style?: "default" | "cancel" | "destructive";
  }>;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  onDismiss?: () => void;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  buttons = [{ text: "OK", style: "default" }],
  icon,
  iconColor = "#007DFC",
  onDismiss,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);

      // Animate in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleButtonPress = (onPress?: () => void) => {
    if (onPress) {
      onPress();
    }
    if (onDismiss) {
      onDismiss();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <Pressable
        className="flex-1 bg-black/50 justify-center items-center px-5"
        onPress={onDismiss}
      >
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          }}
        >
          <Pressable
            className="bg-white rounded-2xl p-6 w-full max-w-[340px] items-center"
            style={{
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            {icon && (
              <View className="mb-4">
                <Ionicons name={icon} size={40} color={iconColor} />
              </View>
            )}

            {/* Title */}
            <Text className="text-lg font-JakartaSemiBold text-gray-900 mb-3 text-center">
              {title}
            </Text>

            {/* Message */}
            <Text className="text-sm font-Jakarta text-gray-600 text-center mb-6 leading-5">
              {message}
            </Text>

            {/* Buttons */}
            <View className="flex-row w-full">
              {buttons.map((button, index) => {
                const isDestructive = button.style === "destructive";
                const isCancel = button.style === "cancel";

                return (
                  <TouchableOpacity
                    key={index}
                    className={`
                      flex-1 py-3 px-4 rounded-lg items-center justify-center
                      ${isDestructive ? "bg-red-500" : isCancel ? "bg-gray-200" : "bg-primary-500"}
                      ${index > 0 ? "ml-3" : ""}
                    `}
                    onPress={() => handleButtonPress(button.onPress)}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`
                        text-base font-JakartaSemiBold
                        ${isDestructive ? "text-white" : isCancel ? "text-gray-700" : "text-white"}
                      `}
                    >
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

// Hook for easier usage
export const useCustomAlert = () => {
  const [alertConfig, setAlertConfig] = React.useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons?: Array<{
      text: string;
      onPress?: () => void;
      style?: "default" | "cancel" | "destructive";
    }>;
    icon?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
  }>({
    visible: false,
    title: "",
    message: "",
  });

  const showAlert = React.useCallback(
    (config: Omit<typeof alertConfig, "visible">) => {
      setAlertConfig({ ...config, visible: true });
    },
    []
  );

  const hideAlert = React.useCallback(() => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  }, []);

  const AlertComponent = React.useCallback(
    () => <CustomAlert {...alertConfig} onDismiss={hideAlert} />,
    [alertConfig, hideAlert]
  );

  return { showAlert, hideAlert, AlertComponent };
};
