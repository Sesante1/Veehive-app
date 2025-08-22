import { View, Image, Text, TextInput, TouchableOpacity } from "react-native";
import React, { useState, useEffect } from "react";

import { icons } from "@/constants";
import { GoogleInputProps } from "@/types/type";

const googlePlacesApiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

const GoogleTextInput = ({
  icon,
  initialLocation,
  containerStyle,
  textInputBackgroundColor,
  handlePress,
}: GoogleInputProps) => {
  const [searchText, setSearchText] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [showPredictions, setShowPredictions] = useState(false);

  // Check if API key exists
  if (!googlePlacesApiKey) {
    console.warn("Google Places API key is not configured");
    return (
      <View className={`p-4 bg-red-100 rounded-xl ${containerStyle || ""}`}>
        <Text className="text-red-600 text-center">
          Google Places API key not configured
        </Text>
      </View>
    );
  }

  const searchPlaces = async (text: string) => {
    if (text.length < 2) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          text
        )}&key=${googlePlacesApiKey}&language=en&types=address`
      );
      
      const data = await response.json();
      
      if (data.status === "OK" && Array.isArray(data.predictions)) {
        setPredictions(data.predictions.slice(0, 5)); // Limit to 5 results
        setShowPredictions(true);
      } else {
        setPredictions([]);
        setShowPredictions(false);
        console.warn("Places API error:", data.status, data.error_message);
      }
    } catch (error) {
      console.error("Error fetching places:", error);
      setPredictions([]);
      setShowPredictions(false);
    }
  };

  const getPlaceDetails = async (placeId: string, description: string) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${googlePlacesApiKey}&fields=geometry`
      );
      
      const data = await response.json();
      
      if (data.status === "OK" && data.result?.geometry?.location) {
        const location = {
          latitude: data.result.geometry.location.lat,
          longitude: data.result.geometry.location.lng,
          address: description,
        };
        
        if (handlePress) {
          handlePress(location);
        }
      } else {
        // Fallback without coordinates
        if (handlePress) {
          handlePress({
            latitude: 0,
            longitude: 0,
            address: description,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching place details:", error);
      // Fallback without coordinates
      if (handlePress) {
        handlePress({
          latitude: 0,
          longitude: 0,
          address: description,
        });
      }
    }
  };

  const handleSelectPlace = async (prediction: any) => {
    setSearchText(prediction.description);
    setShowPredictions(false);
    setPredictions([]);
    
    if (prediction.place_id) {
      await getPlaceDetails(prediction.place_id, prediction.description);
    } else if (handlePress) {
      handlePress({
        latitude: 0,
        longitude: 0,
        address: prediction.description,
      });
    }
  };

  const handleTextChange = (text: string) => {
    setSearchText(text);
    
    // Debounce the API call
    const timeoutId = setTimeout(() => {
      searchPlaces(text);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  return (
    <View className={`relative z-50 ${containerStyle || ""}`}>
      <View className="relative">
        {/* Search Input */}
        <View className={'flex-row items-center bg-general-500 rounded-full px-4 '}>
          <View className="mr-3">
            <Image
              source={icon || icons.pin}
              className="w-5 h-5"
              resizeMode="contain"
            />
          </View>

          <TextInput
            value={searchText}
            onChangeText={handleTextChange}
            placeholder={initialLocation || "e.g Cebu, Philippines"}
            placeholderTextColor="#4d4d4d"
            className={`rounded-full p-4 font-JakartaSemiBold text-[15px] flex-1 text-left`}
            style={{
              backgroundColor: textInputBackgroundColor || "transparent",
            }}
            onFocus={() => {
              if (predictions.length > 0) {
                setShowPredictions(true);
              }
            }}
          />
        </View>

        {/* Predictions Dropdown */}
        {showPredictions && predictions.length > 0 && (
          <View className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg shadow-neutral-300 z-50 ">
            {predictions.map((prediction: any, index: number) => (
              <TouchableOpacity
                key={prediction.place_id || index}
                onPress={() => handleSelectPlace(prediction)}
                className={`px-4 py-3 ${
                  index !== predictions.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                <View className="flex-row items-center">
                  <Image
                    source={icons.search}
                    className="w-4 h-4 mr-3 opacity-50"
                    resizeMode="contain"
                  />
                  <Text className="flex-1 text-sm text-gray-700" numberOfLines={2}>
                    {prediction.description || "Unknown location"}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Invisible overlay to close predictions */}
      {showPredictions && (
        <TouchableOpacity
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 40,
          }}
          onPress={() => setShowPredictions(false)}
        />
      )}
    </View>
  );
};

export default GoogleTextInput;