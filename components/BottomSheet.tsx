import React, { useEffect } from "react";
import { Dimensions, Modal, TouchableOpacity, View } from "react-native";
import {
  GestureHandlerRootView,
  PanGestureHandler,
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

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: number;
  showDragHandle?: boolean;
  enablePanGesture?: boolean;
  animationDuration?: number;
  backdropOpacity?: number;
  dismissThreshold?: number;
  snapToOffsets?: number[];
  borderRadius?: number;
  backgroundColor?: string;
  statusBarTranslucent?: boolean;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  children,
  height = 400,
  showDragHandle = true,
  enablePanGesture = true,
  animationDuration = 300,
  backdropOpacity = 0.5,
  dismissThreshold = 0.3,
  borderRadius = 24,
  backgroundColor = "#FFFFFF",
  statusBarTranslucent = true,
}) => {
  const translateY = useSharedValue(height);
  const opacity = useSharedValue(0);

  // Calculate threshold based on height
  const threshold = height * dismissThreshold;

  // Animation for showing/hiding bottom sheet
  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: animationDuration });
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 300,
      });
    } else {
      opacity.value = withTiming(0, { duration: animationDuration * 0.7 });
      translateY.value = withSpring(height, {
        damping: 20,
        stiffness: 300,
      });
    }
  }, [visible, height, animationDuration]);

  // Close bottom sheet function
  const closeBottomSheet = () => {
    opacity.value = withTiming(0, { duration: animationDuration * 0.7 });
    translateY.value = withSpring(height, {
      damping: 20,
      stiffness: 300,
    });
    // Delay onClose to allow animation to complete
    setTimeout(() => onClose(), animationDuration * 0.7);
  };

  // Pan gesture handler for drag-to-close
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startY = translateY.value;
    },
    onActive: (event, context: any) => {
      const newTranslateY = context.startY + event.translationY;
      if (newTranslateY >= 0) {
        translateY.value = newTranslateY;
        // Adjust opacity based on drag distance
        const dragProgress = Math.min(newTranslateY / height, 1);
        opacity.value = Math.max(1 - dragProgress * 0.5, 0.3);
      }
    },
    onEnd: (event) => {
      const shouldClose =
        event.translationY > threshold || event.velocityY > 500;

      if (shouldClose) {
        runOnJS(closeBottomSheet)();
      } else {
        // Snap back to original position
        translateY.value = withSpring(0, {
          damping: 20,
          stiffness: 300,
        });
        opacity.value = withTiming(1, { duration: 200 });
      }
    },
  });

  // Animated styles
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * backdropOpacity,
  }));

  const bottomSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent={statusBarTranslucent}
      onRequestClose={closeBottomSheet}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          {/* Backdrop */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={closeBottomSheet}
            style={{ position: "absolute", inset: 0 }}
          >
            <Animated.View
              style={[backdropStyle, { flex: 1, backgroundColor: "#000000" }]}
            />
          </TouchableOpacity>

          {/* Bottom Sheet Container */}
          <PanGestureHandler
            onGestureEvent={enablePanGesture ? gestureHandler : undefined}
            enabled={enablePanGesture}
          >
            <Animated.View
              style={[
                bottomSheetStyle,
                {
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: height,
                  backgroundColor: backgroundColor,
                  borderTopLeftRadius: borderRadius,
                  borderTopRightRadius: borderRadius,
                },
              ]}
            >
              {/* Drag Handle */}
              {showDragHandle && (
                <View
                  style={{
                    alignItems: "center",
                    paddingTop: 16,
                    paddingBottom: 8,
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 4,
                      backgroundColor: "#D1D5DB",
                      borderRadius: 2,
                    }}
                  />
                </View>
              )}

              {/* Content */}
              <View style={{ flex: 1 }}>{children}</View>
            </Animated.View>
          </PanGestureHandler>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

export default BottomSheet;
