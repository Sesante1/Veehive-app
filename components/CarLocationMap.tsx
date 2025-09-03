import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  Image,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { icons } from '@/constants';

interface CarLocationMapProps {
  carLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  carDetails?: {
    make?: string;
    model?: string;
    year?: string;
    dailyRate?: number;
  };
  onClose?: () => void;
}

interface LocationCoords {
  latitude: number;
  longitude: number;
}

const CarLocationMap: React.FC<CarLocationMapProps> = ({
  carLocation,
  carDetails,
  onClose,
}) => {
  const [userLocation, setUserLocation] = useState<LocationCoords | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const mapRef = useRef<MapView>(null);

  // Request location permission and get current location
  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        // Request permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          setLocationPermission(false);
          setIsLoading(false);
          Alert.alert(
            'Location Permission Required',
            'Please enable location permissions to see your current location and get directions.',
            [{ text: 'OK' }]
          );
          return;
        }

        setLocationPermission(true);

        // Get current location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        setIsLoading(false);

        // Fit both markers in view after getting location
        setTimeout(() => {
          fitMarkersInView();
        }, 1000);

      } catch (error) {
        console.error('Error getting location:', error);
        setIsLoading(false);
        Alert.alert(
          'Location Error',
          'Could not get your current location. You can still view the car location.',
          [{ text: 'OK' }]
        );
      }
    };

    requestLocationPermission();
  }, []);

  // Fit both user and car markers in view
  const fitMarkersInView = () => {
    if (mapRef.current && userLocation) {
      const coordinates = [
        userLocation,
        carLocation,
      ];

      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: {
          top: 100,
          right: 100,
          bottom: 100,
          left: 100,
        },
        animated: true,
      });
    }
  };

  // Navigate to car location
  const navigateToCarLocation = () => {
    const { latitude, longitude } = carLocation;
    
    Alert.alert(
      'Navigate to Car',
      'Choose your preferred navigation app:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Google Maps',
          onPress: () => openGoogleMaps(latitude, longitude),
        },
        {
          text: 'Apple Maps',
          onPress: () => openAppleMaps(latitude, longitude),
        },
        {
          text: 'Waze',
          onPress: () => openWaze(latitude, longitude),
        },
      ]
    );
  };

  // Open Google Maps
  const openGoogleMaps = (lat: number, lng: number) => {
    const url = Platform.select({
      ios: `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`,
      android: `google.navigation:q=${lat},${lng}&mode=d`,
    });
    
    const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    
    if (url) {
      Linking.canOpenURL(url)
        .then((supported) => {
          if (supported) {
            Linking.openURL(url);
          } else {
            Linking.openURL(fallbackUrl);
          }
        })
        .catch(() => Linking.openURL(fallbackUrl));
    } else {
      Linking.openURL(fallbackUrl);
    }
  };

  // Open Apple Maps
  const openAppleMaps = (lat: number, lng: number) => {
    const url = `maps:0,0?q=${lat},${lng}`;
    const fallbackUrl = `http://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(fallbackUrl);
        }
      })
      .catch(() => Linking.openURL(fallbackUrl));
  };

  // Open Waze
  const openWaze = (lat: number, lng: number) => {
    const url = `waze://?ll=${lat},${lng}&navigate=yes`;
    const fallbackUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(fallbackUrl);
        }
      })
      .catch(() => Linking.openURL(fallbackUrl));
  };

  // Calculate distance between two points (rough estimate)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): string => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
  };

  const [showMap, setShowMap] = useState(false);

  if (isLoading) {
    return (
      <View className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <Text className="text-base text-gray-600">Loading map...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={onClose} className="p-2">
          <Image source={icons.backArrow} className="w-6 h-6" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-semibold text-center text-gray-800">
          Car Location
        </Text>
        <View className="w-10" />
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        className="flex-1"
        provider="google"
        initialRegion={{
          latitude: carLocation.latitude,
          longitude: carLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={locationPermission}
        showsMyLocationButton={locationPermission}
        onMapReady={() => {
          setTimeout(() => {
            fitMarkersInView();
          }, 500);
        }}
      >
        {/* Car Location Marker */}
        <Marker
          coordinate={{
            latitude: carLocation.latitude,
            longitude: carLocation.longitude,
          }}
          title={carDetails ? `${carDetails.year} ${carDetails.make} ${carDetails.model}` : "Car Location"}
          description={carLocation.address}
          pinColor="red"
        >
          <View className="bg-red-500 p-2 rounded-full border-2 border-white shadow-lg">
            <Image source={icons.selectedMarker} className="w-6 h-6" style={{ tintColor: '#fff' }} />
          </View>
        </Marker>

        {/* User Location Marker (if available) */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="Your Location"
            description="You are here"
            pinColor="blue"
          >
            <View className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow-lg">
              <View className="w-2 h-2 rounded-full bg-white self-center mt-0.5" />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Car Info Card */}
      <View className="absolute bottom-24 left-4 right-4 bg-white rounded-xl p-4 shadow-lg">
        {carDetails && (
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-lg font-semibold text-gray-800 flex-1">
              {carDetails.year} {carDetails.make} {carDetails.model}
            </Text>
            {carDetails.dailyRate && (
              <Text className="text-base font-semibold text-emerald-600">
                ₱{carDetails.dailyRate}/day
              </Text>
            )}
          </View>
        )}
        
        <Text className="text-sm text-gray-500 mb-1 leading-5" numberOfLines={2}>
          📍 {carLocation.address}
        </Text>
        
        {userLocation && (
          <Text className="text-sm text-blue-500 font-medium">
            📏 Distance: {calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              carLocation.latitude,
              carLocation.longitude
            )}
          </Text>
        )}
      </View>

      {/* Navigation Buttons */}
      <View className="absolute bottom-5 left-4 right-4 flex-row gap-3">
        <TouchableOpacity
          className="flex-1 bg-blue-500 flex-row items-center justify-center py-3.5 rounded-lg shadow-lg"
          onPress={navigateToCarLocation}
        >
          <Image source={icons.pin} className="w-5 h-5 mr-2" style={{ tintColor: '#fff' }} />
          <Text className="text-white text-base font-semibold">Get Directions</Text>
        </TouchableOpacity>

        {userLocation && (
          <TouchableOpacity
            className="bg-white flex-row items-center justify-center py-3.5 px-4 rounded-lg border border-gray-300 shadow-sm"
            onPress={fitMarkersInView}
          >
            <Image source={icons.target} className="w-5 h-5 mr-1.5" style={{ tintColor: '#6b7280' }} />
            <Text className="text-gray-500 text-sm font-medium">Center Map</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default CarLocationMap;