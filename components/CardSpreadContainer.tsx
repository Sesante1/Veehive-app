import React from 'react';
import { Pressable, View } from 'react-native';
import { SharedValue } from 'react-native-reanimated';
import { PhotoCard } from './PhotoCard';
import { PhotoOverlay } from './PhotoOverlay';

interface CardSpreadContainerProps {
  images: { id: string; url: string }[];
  onPress: () => void;
  onToggleSpread: () => void;
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
  onToggleSpread,
  isSpread,
  leftTranslateX,
  rightTranslateX,
  leftRotation,
  rightRotation,
  centerScale,
  leftScale,
  rightScale,
}) => {
  // Create shared values for center card (no translation/rotation)
  const centerTranslateX = React.useRef({ value: 0 } as SharedValue<number>);
  const centerRotation = React.useRef({ value: 0 } as SharedValue<number>);

  return (
    <>
      {/* Main card press area - navigates to photos screen */}
      <Pressable onPress={onPress} className="mb-4">
        <View className="relative w-full h-52 flex-row justify-center items-center">
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
              translateX={centerTranslateX.current}
              rotation={centerRotation.current}
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

      {/* Separate button for animation toggle */}
      {/* <Pressable
        onPress={onToggleSpread}
        className="bg-blue-100 px-4 py-2 rounded-full self-center mb-2"
      >
      </Pressable> */}
    </>
  );
};