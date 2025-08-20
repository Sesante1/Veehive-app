import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export type ImageType = { id: string; uri: string };

type ImagePickerComponentProps = {
  title?: string;
  subtitle?: string;
  maxImages?: number;
  allowMultiple?: boolean;
  onImagesChange?: (images: ImageType[]) => void;
  buttonText?: string;
  initialImages?: ImageType[];
};

const ImagePickerComponent = ({
  title = "",
  subtitle = "",
  maxImages = 20,
  allowMultiple = true,
  onImagesChange,
  buttonText = "Add Images",
  initialImages = [],
}: ImagePickerComponentProps) => {
  const [images, setImages] = useState(initialImages);

  // Request permission for image picker
  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please grant camera roll permissions to upload images."
      );
      return false;
    }
    return true;
  };

  // Handle image selection
  const pickImages = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      Alert.alert(
        "Limit reached",
        `You can only upload up to ${maxImages} image${maxImages > 1 ? "s" : ""}.`
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsMultipleSelection: allowMultiple,
      selectionLimit: allowMultiple ? remainingSlots : 1,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      let newImages: ImageType[];

      if (allowMultiple) {
        newImages = result.assets.map((asset, index) => ({
          id: (Date.now() + index).toString(),
          uri: asset.uri,
        }));
        setImages((prev) => {
          const updated = [...prev, ...newImages];
          onImagesChange?.(updated);
          return updated;
        });
      } else {
        // For single selection, replace existing image
        const newImage: ImageType = {
          id: Date.now().toString(),
          uri: result.assets[0].uri,
        };
        setImages([newImage]);
        onImagesChange?.([newImage]);
      }
    }
  };

  // Remove image
  const removeImage = (imageId: string) => {
    setImages((prev) => {
      const updated = prev.filter((img) => img.id !== imageId);
      onImagesChange?.(updated);
      return updated;
    });
  };

  const showAddButton = allowMultiple
    ? images.length < maxImages
    : images.length === 0;
  const displayButtonText =
    allowMultiple && maxImages > 1
      ? buttonText
      : buttonText.replace("Images", "Image");

  return (
    <View className="bg-white">
      <Text className="text-2xl font-JakartaBold mt-5">{title}</Text>
      <Text className="text-[12px] font-Jakarta text-secondary-700 mb-10">
        {subtitle}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-4"
      >
        {images.map((image) => (
          <View key={image.id} className="mr-4 relative">
            <Image
              source={{ uri: image.uri }}
              className="rounded-lg"
              style={{ width: 200, height: 200 }}
            />
            <TouchableOpacity
              className="absolute top-2 right-2 bg-red-500 rounded-full w-6 h-6 justify-center items-center"
              onPress={() => removeImage(image.id)}
            >
              <Ionicons name="close" size={16} color="white" />
            </TouchableOpacity>
          </View>
        ))}

        {showAddButton && (
          <TouchableOpacity
            className="rounded-lg border border-gray-300 justify-center items-center bg-gray-50"
            style={{ width: 200, height: 200, borderStyle: "dashed" }}
            onPress={pickImages}
          >
            <View className="justify-center items-center mb-1">
              <Ionicons
                name="image"
                size={50}
                color="#007DFC"
                style={{ borderStyle: "dashed" }}
              />
            </View>
            <Text className="text-xs text-gray-600">{displayButtonText}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Text className="text-sm text-gray-600">
        {images.length} of {maxImages} image{maxImages > 1 ? "s" : ""} selected
      </Text>
    </View>
  );
};

// Example usage components
export const CarImagesComponent = ({
  onImagesChange,
}: {
  onImagesChange: (images: ImageType[]) => void;
}) => (
  <ImagePickerComponent
    title="Car Images"
    subtitle="Upload clear images of your car from different angles"
    maxImages={20}
    allowMultiple={true}
    onImagesChange={onImagesChange}
    buttonText="Add Images"
  />
);

export const OfficialReceiptComponent = ({
  onImagesChange,
}: {
  onImagesChange: (images: ImageType[]) => void;
}) => (
  <ImagePickerComponent
    title="Official Receipt (OR)"
    subtitle="Upload a clear image of your car's Official Receipt"
    maxImages={1}
    allowMultiple={false}
    onImagesChange={onImagesChange}
    buttonText="Add Image"
  />
);

export const CertificateRegistrationComponent = ({
  onImagesChange,
}: {
  onImagesChange: (images: ImageType[]) => void;
}) => (
  <ImagePickerComponent
    title="Certificate of Registration (CR)"
    subtitle="Upload a clear image of your car's Certificate of Registration"
    maxImages={1}
    allowMultiple={false}
    onImagesChange={onImagesChange}
    buttonText="Add Image"
  />
);

// Main component that uses all three
const CarDocumentsUploader = () => {
  const [carImages, setCarImages] = useState<ImageType[]>([]);
  const [officialReceipt, setOfficialReceipt] = useState<ImageType[]>([]);
  const [certificateRegistration, setCertificateRegistration] = useState<
    ImageType[]
  >([]);

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <CarImagesComponent onImagesChange={setCarImages} />
      <OfficialReceiptComponent onImagesChange={setOfficialReceipt} />
      <CertificateRegistrationComponent
        onImagesChange={setCertificateRegistration}
      />

      {/* Debug */}
      <View className="p-5 bg-white m-5 rounded-lg">
        <Text className="font-bold mb-2">Debug Info:</Text>
        <Text>Car Images: {carImages.length}</Text>
        <Text>Official Receipt: {officialReceipt.length}</Text>
        <Text>Certificate Registration: {certificateRegistration.length}</Text>
      </View>
    </ScrollView>
  );
};

export default CarDocumentsUploader;
