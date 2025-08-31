import React from "react";
import { View, Image, Text } from "react-native";

type MapProps = {
  latitude: number;
  longitude: number;
  zoom?: number;
};

const Map: React.FC<MapProps> = ({ latitude, longitude, zoom = 14 }) => {
  const apiKey = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY;

  const mapUrl = `https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=600&height=400&center=lonlat:${longitude},${latitude}&zoom=${zoom}&apiKey=${apiKey}`;

  return (
    <View className="w-full h-[300px] rounded-2xl overflow-hidden">
      <Image
        source={{ uri: mapUrl }}
        className="w-full h-full"
        resizeMode="cover"
      />
      <Text>Map url: {mapUrl}</Text>
    </View>
    
  );
};

export default Map;
