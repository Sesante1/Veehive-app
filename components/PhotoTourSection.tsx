import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { SharedValue } from 'react-native-reanimated';
import { CardSpreadContainer } from './CardSpreadContainer';

interface PhotoTourSectionProps {
  images: { id: string; url: string }[];
  isSpread: boolean;
  onToggleSpread: () => void;
  onCardPress: () => void; // Generic card press handler
  // Animation shared values
  leftTranslateX: SharedValue<number>;
  rightTranslateX: SharedValue<number>;
  leftRotation: SharedValue<number>;
  rightRotation: SharedValue<number>;
  centerScale: SharedValue<number>;
  leftScale: SharedValue<number>;
  rightScale: SharedValue<number>;
}

export const PhotoTourSection: React.FC<PhotoTourSectionProps> = ({
  images,
  isSpread,
  onToggleSpread,
  onCardPress,
  leftTranslateX,
  rightTranslateX,
  leftRotation,
  rightRotation,
  centerScale,
  leftScale,
  rightScale,
}) => {
  return (
    <View className="flex-1 pt-12 px-5 bg-white rounded-xl shadow-lg shadow-black/30 border border-gray-100">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-10">
        <Text className="text-lg font-JakartaSemiBold">
          Photo tour
        </Text>
      </View>

      {/* Card Container */}
      <CardSpreadContainer
        images={images}
        onPress={onCardPress}
        isSpread={isSpread}
        leftTranslateX={leftTranslateX}
        rightTranslateX={rightTranslateX}
        leftRotation={leftRotation}
        rightRotation={rightRotation}
        centerScale={centerScale}
        leftScale={leftScale}
        rightScale={rightScale}
      />

      {/* Footer */}
      <Text className="text-sm text-gray-600 text-center mb-4">
        Tap to manage photos
      </Text>
    </View>
  );
};