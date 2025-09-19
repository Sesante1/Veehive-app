import React from 'react';
import { Image } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

interface PhotoCardProps {
  imageUrl: string;
  width: string;
  height: string;
  translateX: SharedValue<number>;
  rotation: SharedValue<number>;
  scale: SharedValue<number>;
  zIndex: number;
  shadowProps?: {
    shadowColor?: string;
    shadowOffset?: { width: number; height: number };
    shadowOpacity?: number;
    shadowRadius?: number;
    elevation?: number;
  };
}

export const PhotoCard: React.FC<PhotoCardProps> = ({
  imageUrl,
  width,
  height,
  translateX,
  rotation,
  scale,
  zIndex,
  shadowProps = {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      className={`absolute ${width} ${height} rounded-xl overflow-hidden`}
      style={[
        {
          zIndex,
          ...shadowProps,
        },
        animatedStyle,
      ]}
    >
      <Image
        source={{ uri: imageUrl }}
        className="w-full h-full"
        resizeMode="cover"
      />
    </Animated.View>
  );
};