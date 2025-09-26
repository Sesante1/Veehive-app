import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface BottomSheetImagePickerProps {
  visible: boolean;
  onClose: () => void;
  onPickCamera: () => void;
  onPickGallery: () => void;
  mode?: "single" | "multi";
  title?: string;
  subtitle?: string;
}

const BottomSheetImagePicker: React.FC<BottomSheetImagePickerProps> = ({
  visible,
  onClose,
  onPickCamera,
  onPickGallery,
  mode = "single",
  title,
  subtitle,
}) => {
  const screenHeight = Dimensions.get("window").height;
  const translateY = useSharedValue(screenHeight);
  const context = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  const displayTitle =
    mode === "multi" ? title || "Add Photos" : title || "Add Document";

  const displaySubtitle =
    mode === "multi"
      ? subtitle || "Choose how you want to add photos to your collection"
      : subtitle || "Choose how you want to add your document";

  const bottomSheetHeight = 330;

  // animate open/close
  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, {
        damping: 50,
        stiffness: 400,
        mass: 0.8,
      });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(bottomSheetHeight + 100, { duration: 250 });
    }
  }, [visible, bottomSheetHeight]);

  const rBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const rBottomSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // pan gesture to drag down
  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = translateY.value;
    })
    .onUpdate((event) => {
      const newY = context.value + event.translationY;
      translateY.value = Math.max(newY, 0);
    })
    .onEnd((event) => {
      const closeThreshold = bottomSheetHeight * 0.3;
      if (event.velocityY > 500 || translateY.value > closeThreshold) {
        backdropOpacity.value = withTiming(0, { duration: 200 });
        translateY.value = withTiming(bottomSheetHeight + 100, {
          duration: 250,
        });
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, {
          damping: 50,
          stiffness: 400,
          mass: 0.8,
        });
      }
    });

  const handleBackdropPress = () => {
    backdropOpacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(bottomSheetHeight + 100, { duration: 250 });
    runOnJS(onClose)();
  };

  const handleCameraPress = () => {
    onPickCamera();
    handleBackdropPress();
  };

  const handleGalleryPress = () => {
    onPickGallery();
    handleBackdropPress();
  };

  if (!visible) return null;

  return (
    <>
      <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />

      {/* Full Screen Container */}
      <View className="absolute inset-0 z-50">
        {/* Full Height/Width Backdrop */}
        <Animated.View
          className="absolute inset-0 bg-black/50"
          style={[rBackdropStyle]}
        >
          <Pressable className="flex-1" onPress={handleBackdropPress} />
        </Animated.View>

        {/* Bottom Sheet Container */}
        <View
          className="absolute bottom-0 left-0 right-0"
          pointerEvents="box-none"
        >
          <GestureHandlerRootView>
            <Animated.View
              className="bg-white rounded-t-3xl shadow-2xl overflow-hidden"
              style={[rBottomSheetStyle, { height: bottomSheetHeight }]}
            >
              {/* Drag Handle + Header */}
              <GestureDetector gesture={panGesture}>
                <Animated.View>
                  <View className="items-center pt-4 pb-2">
                    <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
                  </View>

                  <View className="px-6 pb-6">
                    <Text className="text-xl font-JakartaBold text-gray-900 text-center mb-2">
                      {displayTitle}
                    </Text>
                    <Text className="text-gray-600 text-center text-sm leading-5">
                      {displaySubtitle}
                    </Text>
                  </View>
                </Animated.View>
              </GestureDetector>

              {/* Options */}
              <ScrollView
                className="px-6 pb-8"
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Camera */}
                <TouchableOpacity
                  onPress={handleCameraPress}
                  className="flex-row items-center p-4 bg-blue-50 rounded-2xl active:bg-blue-100 mb-3"
                  activeOpacity={0.7}
                >
                  <View className="w-14 h-14 bg-blue-500 rounded-2xl items-center justify-center mr-4">
                    <Ionicons name="camera" size={26} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-JakartaSemiBold text-gray-900">
                      Take Photo
                    </Text>
                    <Text className="text-gray-600 text-sm mt-1">
                      {mode === "multi"
                        ? "Capture new photos with your camera"
                        : "Use camera to capture document"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>

                {/* Gallery */}
                <TouchableOpacity
                  onPress={handleGalleryPress}
                  className="flex-row items-center p-4 bg-green-50 rounded-2xl active:bg-green-100 mb-6"
                  activeOpacity={0.7}
                >
                  <View className="w-14 h-14 bg-green-500 rounded-2xl items-center justify-center mr-4">
                    <Ionicons name="images" size={26} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-JakartaSemiBold text-gray-900">
                      Choose from Gallery
                    </Text>
                    <Text className="text-gray-600 text-sm mt-1">
                      {mode === "multi"
                        ? "Select photos from your gallery"
                        : "Select from your photos"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </ScrollView>
              {/* Cancel */}
              <TouchableOpacity
                onPress={handleBackdropPress}
                className="w-10 h-10 rounded-full flex justify-center items-center absolute top-6 right-4"
                activeOpacity={0.7}
              >
                <MaterialIcons name="cancel" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </Animated.View>
          </GestureHandlerRootView>
        </View>
      </View>
    </>
  );
};

export default BottomSheetImagePicker;
