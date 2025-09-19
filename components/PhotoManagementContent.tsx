import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";

interface PhotoManagementContentProps {
  images: { id: string; url: string }[];
  onAddPhoto?: () => void;
  onDeletePhoto?: (imageId: string) => void;
  onReorderPhotos?: (images: { id: string; url: string }[]) => void;
}

export const PhotoManagementContent: React.FC<PhotoManagementContentProps> = ({
  images,
  onAddPhoto,
  onDeletePhoto,
  onReorderPhotos,
}) => {
  return (
    <>
      {/* Add Photo Button */}
      <View className="mb-4">
        <Pressable
          onPress={onAddPhoto}
          className="flex-row items-center justify-center py-4 bg-blue-500 rounded-xl"
        >
          <Ionicons name="add" size={24} color="white" />
          <Text className="text-white font-JakartaSemiBold ml-2">
            Add Photo
          </Text>
        </Pressable>
      </View>

      {/* Photo Grid */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="flex-row flex-wrap justify-between">
          {images.map((image, index) => (
            <View key={image.id} className="w-[48%] mb-4">
              <View className="relative">
                <Image
                  source={{ uri: image.url }}
                  className="w-full h-32 rounded-lg"
                  resizeMode="cover"
                />

                {/* Primary badge for first image */}
                {index === 0 && (
                  <View className="absolute top-2 left-2 bg-green-500 px-2 py-1 rounded">
                    <Text className="text-white text-xs font-JakartaMedium">
                      Primary
                    </Text>
                  </View>
                )}

                {/* Delete button */}
                <Pressable
                  onPress={() => onDeletePhoto?.(image.id)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
                >
                  <Ionicons name="close" size={16} color="white" />
                </Pressable>

                {/* Image number */}
                <View className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded">
                  <Text className="text-white text-xs font-JakartaMedium">
                    {index + 1}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Tips */}
        <View className="bg-blue-50 p-4 rounded-xl mb-6">
          <Text className="text-blue-800 font-JakartaMedium mb-2">
            Photo Tips:
          </Text>
          <Text className="text-blue-700 text-sm font-Jakarta">
            • The first photo will be your primary listing image
          </Text>
          <Text className="text-blue-700 text-sm font-Jakarta">
            • Add up to 10 high-quality photos
          </Text>
          <Text className="text-blue-700 text-sm font-Jakarta">
            • Show different angles and interior/exterior views
          </Text>
        </View>
      </ScrollView>
    </>
  );
};
