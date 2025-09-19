import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Dimensions, Pressable, Text, View } from "react-native";
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ReusableBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  height?: number; // Custom height as percentage of screen (0.1 to 0.9)
  showHandle?: boolean;
  showCloseButton?: boolean;
}

export const ReusableBottomSheet: React.FC<ReusableBottomSheetProps> = ({
  isVisible,
  onClose,
  title,
  children,
  height = 0.7, // Default to 70% of screen height
  showHandle = true,
  showCloseButton = true,
}) => {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const context = useSharedValue({ y: 0 });

  const SHEET_HEIGHT = SCREEN_HEIGHT * height;

  React.useEffect(() => {
    if (isVisible) {
      translateY.value = withSpring(SCREEN_HEIGHT - SHEET_HEIGHT, {
        damping: 50,
        stiffness: 400,
      });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, {
        duration: 300,
      });
    }
  }, [isVisible, SHEET_HEIGHT]);

  const rBottomSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onStart: () => {
      context.value = { y: translateY.value };
    },
    onActive: (event) => {
      const newY = context.value.y + event.translationY;
      // Only allow dragging down, prevent dragging above the open position
      translateY.value = Math.max(newY, SCREEN_HEIGHT - SHEET_HEIGHT);
    },
    onEnd: (event) => {
      const { velocityY } = event;
      const currentY = translateY.value;
      const openPosition = SCREEN_HEIGHT - SHEET_HEIGHT;
      const closeThreshold = openPosition + SHEET_HEIGHT * 0.3;

      if (velocityY > 500 || currentY > closeThreshold) {
        // Close the sheet
        translateY.value = withTiming(SCREEN_HEIGHT, {
          duration: 300,
        });
        runOnJS(onClose)();
      } else {
        // Snap back to open position
        translateY.value = withSpring(openPosition, {
          damping: 50,
          stiffness: 400,
        });
      }
    },
  });

  if (!isVisible) return null;

  return (
    <View className="absolute inset-0 z-50">
      {/* Full screen backdrop */}
      <Pressable
        className="flex-1 bg-black/50"
        onPress={onClose}
      />

      <GestureHandlerRootView style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View
            className="absolute left-0 right-0 bg-white rounded-t-[20px] shadow-lg"
            style={[
              {
                top: 0,
                height: SHEET_HEIGHT,
                paddingHorizontal: 20,
                paddingTop: showHandle ? 12 : 20,
                paddingBottom: 34, // Safe area for bottom
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.25,
                shadowRadius: 10,
                elevation: 10,
              },
              rBottomSheetStyle,
            ]}
          >
            {/* Handle */}
            {showHandle && (
              <View className="w-10 h-1 bg-gray-300 rounded-full self-center mb-5" />
            )}

            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-JakartaSemiBold text-gray-900">{title}</Text>
              {showCloseButton && (
                <Pressable
                  onPress={onClose}
                  className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={18} color="#666" />
                </Pressable>
              )}
            </View>

            {/* Content area with proper flex */}
            <View className="flex-1 pb-4">{children}</View>
          </Animated.View>
        </PanGestureHandler>
      </GestureHandlerRootView>
    </View>
  );
};