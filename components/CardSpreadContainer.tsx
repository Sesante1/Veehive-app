import React from 'react';
import { Pressable, View } from 'react-native';
import { SharedValue, useSharedValue } from 'react-native-reanimated';
import { PhotoCard } from './PhotoCard';
import { PhotoOverlay } from './PhotoOverlay';

interface CardSpreadContainerProps {
  images: { id: string; url: string }[];
  onPress: () => void;
  isSpread: boolean;
  // Animation shared values
  leftTranslateX: SharedValue<number>;
  rightTranslateX: SharedValue<number>;
  leftRotation: SharedValue<number>;
  rightRotation: SharedValue<number>;
  centerScale: SharedValue<number>;
  leftScale: SharedValue<number>;
  rightScale: SharedValue<number>;
}

export const CardSpreadContainer: React.FC<CardSpreadContainerProps> = ({
  images,
  onPress,
  isSpread,
  leftTranslateX,
  rightTranslateX,
  leftRotation,
  rightRotation,
  centerScale,
  leftScale,
  rightScale,
}) => {
  // Create a shared value of 0 for center card position (no translation)
  const centerTranslateX = useSharedValue(0);
  const centerRotation = useSharedValue(0);

  return (
    <Pressable onPress={onPress}>
      <View className="relative w-full h-52 mb-4 flex-row justify-center items-center">
        {/* Left image */}
        {images?.[1] && (
          <PhotoCard
            imageUrl={images[1].url}
            width="w-[60%]"
            height="h-44"
            translateX={leftTranslateX}
            rotation={leftRotation}
            scale={leftScale}
            zIndex={1}
          />
        )}

        {/* Center image */}
        {images?.[0] && (
          <PhotoCard
            imageUrl={images[0].url}
            width="w-[70%]"
            height="h-52"
            translateX={centerTranslateX}
            rotation={centerRotation}
            scale={centerScale}
            zIndex={3}
            shadowProps={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 10,
            }}
          />
        )}

        {/* Right image */}
        {images?.[2] && (
          <PhotoCard
            imageUrl={images[2].url}
            width="w-[60%]"
            height="h-44"
            translateX={rightTranslateX}
            rotation={rightRotation}
            scale={rightScale}
            zIndex={2}
          />
        )}

        {/* Overlays */}
        <PhotoOverlay photoCount={images.length} isSpread={isSpread} />
      </View>
    </Pressable>
  );
};