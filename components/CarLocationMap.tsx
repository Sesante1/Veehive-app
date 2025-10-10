import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
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

interface RoutePoint {
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
  const [routeCoordinates, setRouteCoordinates] = useState<RoutePoint[]>([]);
  const [routeDistance, setRouteDistance] = useState<string>('');
  const [routeDuration, setRouteDuration] = useState<string>('');
  const [loadingRoute, setLoadingRoute] = useState<boolean>(false);
  const mapRef = useRef<MapView>(null);

  // Request location permission and get current location
  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
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

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const userLoc = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        setUserLocation(userLoc);
        setIsLoading(false);

        // Fetch route after getting user location
        setTimeout(() => {
          fetchRoute(userLoc);
          fitMarkersInView(userLoc);
        }, 500);

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

  // Fetch route from Google Directions API
  const fetchRoute = async (userLoc: LocationCoords) => {
    setLoadingRoute(true);
    try {
      const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      if (!googleMapsApiKey) {
        console.error('Google Maps API key not found');
        setLoadingRoute(false);
        return;
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${userLoc.latitude},${userLoc.longitude}&destination=${carLocation.latitude},${carLocation.longitude}&mode=driving&key=${googleMapsApiKey}`
      );

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        
        // Decode polyline
        const points = decodePolyline(route.overview_polyline.points);
        setRouteCoordinates(points);

        // Get distance and duration
        const leg = route.legs[0];
        setRouteDistance(leg.distance.text);
        setRouteDuration(leg.duration.text);
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    } finally {
      setLoadingRoute(false);
    }
  };

  // Decode polyline from Google Maps API
  const decodePolyline = (encoded: string): RoutePoint[] => {
    const poly: RoutePoint[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let result = 0;
      let shift = 0;
      let b;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      result = 0;
      shift = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      poly.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return poly;
  };

  // Fit both user and car markers in view
  const fitMarkersInView = (userLoc?: LocationCoords) => {
    if (mapRef.current) {
      const loc = userLoc || userLocation;
      if (loc) {
        const coordinates = [loc, carLocation];

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
    }
  };

  // Wrapper for fitMarkersInView to use as onPress callback
  const handleCenterMap = () => {
    fitMarkersInView();
  };

  // Navigate to car location - auto-detect device
  const navigateToCarLocation = () => {
    const { latitude, longitude } = carLocation;
    
    if (Platform.OS === 'ios') {
      // Use Apple Maps on iOS
      openAppleMaps(latitude, longitude);
    } else {
      // Use Google Maps on Android
      openGoogleMaps(latitude, longitude);
    }
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
        style={{ flex: 1 }}
        provider={PROVIDER_GOOGLE}
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
        {/* Route Polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#007DFC"
            strokeWidth={4}
            geodesic={true}
          />
        )}

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
          <View className="bg-red-500 p-1 rounded-full border-2 border-white shadow-lg">
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
        
        <Text className="text-sm text-gray-500 mb-2 leading-5" numberOfLines={2}>
          📍 {carLocation.address}
        </Text>

        {loadingRoute ? (
          <View className="flex-row items-center">
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text className="text-sm text-gray-500 ml-2">Loading route...</Text>
          </View>
        ) : routeDistance ? (
          <View>
            <Text className="text-sm text-blue-500 font-medium">
              📏 {routeDistance}
            </Text>
            <Text className="text-sm text-blue-500 font-medium">
              ⏱️ {routeDuration}
            </Text>
          </View>
        ) : null}
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
            onPress={handleCenterMap}
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