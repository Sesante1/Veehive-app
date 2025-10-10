import React, { useEffect, useRef } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";

interface LocationCoords {
  latitude: number;
  longitude: number;
}

interface StaticCarLocationMapProps {
  carLocation: LocationCoords;
  width?: number;
  height?: number;
  zoom?: number;
}

interface CarDirectionsMapProps extends StaticCarLocationMapProps {
  userLocation?: LocationCoords;
  carDetails?: {
    make?: string;
    model?: string;
    year?: string;
    dailyRate?: number;
  };
}

const screenWidth = Dimensions.get("window").width;

/**
 * StaticCarLocationMap - Shows a static Google Map with just the car pinpoint
 */
export const StaticCarLocationMap: React.FC<StaticCarLocationMapProps> = ({
  carLocation,
  width,
  height = 200,
  zoom = 14,
}) => {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: carLocation.latitude,
        longitude: carLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    }
  }, [carLocation]);

  return (
    <View
      style={
        {
          width: "100%",
          height: height,
          borderRadius: 10,
          overflow: "hidden",
        } as any
      }
    >
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: carLocation.latitude,
          longitude: carLocation.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        <Marker
          coordinate={{
            latitude: carLocation.latitude,
            longitude: carLocation.longitude,
          }}
          title="Car Location"
          pinColor="red"
        />
      </MapView>
    </View>
  );
};

/**
 * StaticCarDirectionsMap - Shows a Google Map with directions line from user to car
 */
export const StaticCarDirectionsMap: React.FC<CarDirectionsMapProps> = ({
  carLocation,
  userLocation,
  width,
  height = 200,
  carDetails,
}) => {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (mapRef.current && userLocation) {
      const coordinates = [userLocation, carLocation];

      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: {
          top: 50,
          right: 50,
          bottom: 50,
          left: 50,
        },
        animated: true,
      });
    }
  }, [userLocation, carLocation]);

  // If no user location, just show car pinpoint
  if (!userLocation) {
    return (
      <StaticCarLocationMap
        carLocation={carLocation}
        width={width}
        height={height}
      />
    );
  }

  return (
    <View
      style={
        {
          width: width ?? screenWidth,
          height: height,
          borderRadius: 10,
          overflow: "hidden",
        } as any
      }
    >
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: (userLocation.latitude + carLocation.latitude) / 2,
          longitude: (userLocation.longitude + carLocation.longitude) / 2,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        {/* Directions line */}
        <Polyline
          coordinates={[userLocation, carLocation]}
          strokeColor="#3B82F6"
          strokeWidth={3}
          lineDashPattern={[0]}
          geodesic={true}
        />

        {/* User location marker */}
        <Marker
          coordinate={userLocation}
          title="Your Location"
          pinColor="blue"
        />

        {/* Car location marker */}
        <Marker
          coordinate={carLocation}
          title={
            carDetails
              ? `${carDetails.year} ${carDetails.make} ${carDetails.model}`
              : "Car Location"
          }
          pinColor="red"
        />
      </MapView>
    </View>
  );
};
