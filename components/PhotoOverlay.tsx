import React from 'react';
import { Text, View } from 'react-native';

interface PhotoOverlayProps {
  photoCount: number;
  isSpread: boolean;
}

export const PhotoOverlay: React.FC<PhotoOverlayProps> = ({ photoCount, isSpread }) => {
  return (
    <>
      {/* Photo count overlay */}
      <View
        className="absolute bg-black/70 px-4 py-2 rounded-full"
        style={{
          top: 12,
          left: "50%",
          transform: [{ translateX: -45 }],
          zIndex: 20,
        }}
      >
        <Text className="text-white text-sm font-JakartaSemiBold text-center">
          {photoCount} photos
        </Text>
      </View>
    </>
  );
};