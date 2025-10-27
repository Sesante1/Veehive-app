import React, { useEffect } from "react";
import { Dimensions, Modal, Pressable, StatusBar, View } from "react-native";
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
  const screenHeight = Dimensions.get("window").height;
  const translateY = useSharedValue(height);
  const context = useSharedValue(0);
  const backdropOpacityValue = useSharedValue(0);

  // Animate open/close
  useEffect(() => {
    if (visible) {
      backdropOpacityValue.value = withTiming(backdropOpacity, {
        duration: animationDuration,
      });
      translateY.value = withSpring(0, {
        damping: 50,
        stiffness: 400,
        mass: 0.8,
      });
    } else {
      backdropOpacityValue.value = withTiming(0, {
        duration: animationDuration * 0.7,
      });
      translateY.value = withTiming(height + 100, {
        duration: animationDuration * 0.8,
      });
    }
  }, [visible, height, animationDuration, backdropOpacity]);

  const rBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacityValue.value,
  }));

  const rBottomSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Pan gesture to drag down
  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = translateY.value;
    })
    .onUpdate((event) => {
      const newY = context.value + event.translationY;
      translateY.value = Math.max(newY, 0);
    })
    .onEnd((event) => {
      const closeThreshold = height * dismissThreshold;
      if (event.velocityY > 500 || translateY.value > closeThreshold) {
        backdropOpacityValue.value = withTiming(0, {
          duration: animationDuration * 0.7,
        });
        translateY.value = withTiming(height + 100, {
          duration: animationDuration * 0.8,
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
    backdropOpacityValue.value = withTiming(0, {
      duration: animationDuration * 0.7,
    });
    translateY.value = withTiming(height + 100, {
      duration: animationDuration * 0.8,
    });
    runOnJS(onClose)();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent={statusBarTranslucent}
      onRequestClose={onClose}
    >
      {statusBarTranslucent && (
        <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />
      )}

      {/* Full Screen Container */}
      <View
        style={{
          flex: 1,
          position: "relative",
        }}
      >
        {/* Full Height/Width Backdrop */}
        <Animated.View
          style={[
            rBackdropStyle,
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "#000000",
            },
          ]}
        >
          <Pressable style={{ flex: 1 }} onPress={handleBackdropPress} />
        </Animated.View>

        {/* Bottom Sheet Container */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
          }}
          pointerEvents="box-none"
        >
          <GestureHandlerRootView>
            <Animated.View
              style={[
                rBottomSheetStyle,
                {
                  height: height,
                  backgroundColor: backgroundColor,
                  borderTopLeftRadius: borderRadius,
                  borderTopRightRadius: borderRadius,
                  shadowColor: "#000",
                  shadowOffset: {
                    width: 0,
                    height: -4,
                  },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 10,
                  overflow: "hidden",
                },
              ]}
            >
              {/* Drag Handle */}
              {showDragHandle && (
                <GestureDetector
                  gesture={enablePanGesture ? panGesture : Gesture.Pan()}
                >
                  <Animated.View>
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
                          borderRadius: 3,
                        }}
                      />
                    </View>
                  </Animated.View>
                </GestureDetector>
              )}

              {/* Content */}
              <View style={{ flex: 1 }}>{children}</View>
            </Animated.View>
          </GestureHandlerRootView>
        </View>
      </View>
    </Modal>
  );
};

export default BottomSheet;
