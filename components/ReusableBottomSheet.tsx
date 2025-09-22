import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface ReusableBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  showHandle?: boolean;
  showCloseButton?: boolean;
  snapPoints?: number[];
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAX_TRANSLATE_Y = -SCREEN_HEIGHT + 50; // top padding

export const ReusableBottomSheet: React.FC<ReusableBottomSheetProps> = ({
  isVisible,
  onClose,
  title,
  children,
  showHandle = true,
  showCloseButton = true,
  snapPoints = [0.4, 0.85],
}) => {
  const translateY = useSharedValue(0);
  const active = useSharedValue(false);

  const scrollRef = useRef<ScrollView>(null);

  const [backdropPointerEvents, setBackdropPointerEvents] = useState<
    "auto" | "none"
  >("none");

  const expandedHeight = SCREEN_HEIGHT * snapPoints[1];

  const springConfig = {
    damping: 50,
    stiffness: 400,
    mass: 0.8,
  };

  // Show/hide animation
  useEffect(() => {
    if (isVisible) {
      translateY.value = withSpring(-expandedHeight, springConfig);
      active.value = true;
      setBackdropPointerEvents("auto");
    } else {
      translateY.value = withSpring(100, { duration: 250 });
      active.value = false;
      setBackdropPointerEvents("none");
    }
  }, [isVisible, expandedHeight]);

  const scrollTo = useCallback((destination: number) => {
    "worklet";
    translateY.value = withSpring(destination, springConfig);
  }, []);

  // Pan gesture handler
  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      "worklet";
      const offsetY = event.translationY;
      const newTranslateY = Math.min(offsetY - expandedHeight, 100);
      translateY.value = newTranslateY;
    })
    .onEnd((event) => {
      "worklet";
      const offsetY = event.translationY;
      const velocity = event.velocityY;

      if (offsetY > 100 || velocity > 800) {
        translateY.value = withSpring(100, { duration: 250 });
        runOnJS(onClose)();
        return;
      } else if (offsetY < -100 || velocity < -800) {
        scrollTo(MAX_TRANSLATE_Y); // expand to full screen
      } else {
        scrollTo(-expandedHeight);
      }
    });

  // Bottom sheet animated style
  const rBottomSheetStyle = useAnimatedStyle(() => {
    const borderRadius = interpolate(
      translateY.value,
      [MAX_TRANSLATE_Y, -expandedHeight, 100],
      [25, 20, 20]
    );

    return {
      borderTopLeftRadius: borderRadius,
      borderTopRightRadius: borderRadius,
      transform: [{ translateY: translateY.value }],
    };
  }, []);

  // Backdrop animated style
  const rBackdropStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(active.value ? 1 : 0),
    };
  }, []);

  // Handle line animated style
  const rLineStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateY.value,
      [MAX_TRANSLATE_Y, -expandedHeight],
      [0, 1]
    );
    return { opacity };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <View className="absolute inset-0 z-50 pointer-events-box-none">
      {/* Backdrop */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
          },
          rBackdropStyle,
        ]}
        pointerEvents={backdropPointerEvents}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      <GestureHandlerRootView
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: SCREEN_HEIGHT,
          pointerEvents: "box-none",
        }}
      >
        {/* Bottom Sheet */}
        <Animated.View
          className="absolute left-0 right-0 bg-white"
          style={[
            {
              height: SCREEN_HEIGHT,
              bottom: -SCREEN_HEIGHT,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.15,
              shadowRadius: 16,
              elevation: 20,
            },
            rBottomSheetStyle,
          ]}
        >
          <GestureDetector gesture={gesture}>
            <View className="bg-white rounded-t-[20px]">
              {/* Handle */}
              {showHandle && (
                <Animated.View
                  className="self-center mt-3 mb-2"
                  style={rLineStyle}
                >
                  <View className="w-12 h-1 bg-gray-300 rounded-full" />
                </Animated.View>
              )}

              {/* Header */}
              <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
                <Text className="text-lg font-JakartaSemiBold text-gray-900">
                  {title}
                </Text>
                {showCloseButton && (
                  <Pressable
                    onPress={onClose}
                    className="w-8 h-8 rounded-full bg-gray-50 items-center justify-center"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={18} color="#666" />
                  </Pressable>
                )}
              </View>
            </View>
          </GestureDetector>

          {/* ✅ Content with KeyboardAvoidingView */}
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={80} // adjust if header overlaps
          >
            <ScrollView
              ref={scrollRef}
              className="flex-1"
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom: 100,
              }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={true}
            >
              {children}
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      </GestureHandlerRootView>
    </View>
  );
};
