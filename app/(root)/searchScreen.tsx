import CarCard from "@/components/CarCard";
import {
  SearchFilters,
  applyFilters,
  getActiveFilterCount,
} from "@/components/FilterComponents";
import GoogleTextInput from "@/components/GoogleTextInput";
import { fetchAllCars } from "@/services/firestore";
import { AntDesign, Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  PanResponder,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
const HEADER_HEIGHT = 140;
const BOTTOM_SHEET_MIN_HEIGHT = 120;
const BOTTOM_SHEET_MAX_HEIGHT = height * 0.9;
const CAR_CARD_HEIGHT = 150;
const CAR_CARD_BOTTOM_MARGIN = 20;

interface Car {
  id: string;
  name: string;
  type: string;
  pricePerHour: number;
  seats: number;
  transmission: string;
  fuel: string;
  imageUrl: string | null;
  status: string;
  averageRating: string;
  reviewCount: number;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

// Memoized marker component for better performance
const CarMarker = React.memo(
  ({
    car,
    isSelected,
    onPress,
  }: {
    car: Car;
    isSelected: boolean;
    onPress: () => void;
  }) => {
    const [tracksChanges, setTracksChanges] = React.useState(true);

    React.useEffect(() => {
      // Stop tracking changes after initial render for performance
      const timer = setTimeout(() => {
        setTracksChanges(false);
      }, 1000);
      return () => clearTimeout(timer);
    }, []);

    // Track changes when selection changes
    React.useEffect(() => {
      setTracksChanges(true);
      const timer = setTimeout(() => {
        setTracksChanges(false);
      }, 500);
      return () => clearTimeout(timer);
    }, [isSelected]);

    if (!car.location) return null;

    return (
      <Marker
        coordinate={{
          latitude: car.location.latitude,
          longitude: car.location.longitude,
        }}
        onPress={onPress}
        tracksViewChanges={tracksChanges}
      >
        <View
          className={`rounded-full ${isSelected ? "bg-white" : "bg-gray-900"}`}
        >
          <Text
            className={`font-bold ${
              isSelected ? "text-gray-900" : "text-white"
            }`}
          >
            {car.pricePerHour}
          </Text>
        </View>
      </Marker>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for memo
    return (
      prevProps.car.id === nextProps.car.id &&
      prevProps.isSelected === nextProps.isSelected
    );
  }
);

const SearchScreen = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [filteredCars, setFilteredCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [searchLocation, setSearchLocation] = useState<string>("Anywhere");
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [makeModelSearch, setMakeModelSearch] = useState<string>("");
  const [mapRegion, setMapRegion] = useState({
    latitude: 10.3157,
    longitude: 123.8854,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });

  // Filter state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterType, setFilterType] = useState<
    "price" | "vehicleType" | "makeModel" | null
  >(null);
  const [filters, setFilters] = useState<SearchFilters>({
    priceRange: { min: 0, max: 999999 },
    vehicleTypes: [],
    makes: [],
    transmission: [],
    seats: [],
  });

  // Refs
  const mapRef = useRef<MapView>(null);
  const bottomSheetY = useRef(
    new Animated.Value(height - BOTTOM_SHEET_MIN_HEIGHT)
  ).current;
  const carCardY = useRef(new Animated.Value(height)).current;
  const [wishlistedCars, setWishlistedCars] = useState<Set<string>>(new Set());
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);
  const isMountedRef = useRef(true);

  // Pan responder for bottom sheet drag gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        const currentY = (bottomSheetY as any)._value;
        const newY = currentY + gestureState.dy;

        const minY = height - BOTTOM_SHEET_MAX_HEIGHT;
        const maxY = height - BOTTOM_SHEET_MIN_HEIGHT;

        if (newY >= minY && newY <= maxY) {
          bottomSheetY.setValue(newY);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const velocity = gestureState.vy;
        const currentY = (bottomSheetY as any)._value;
        const midPoint =
          height - (BOTTOM_SHEET_MAX_HEIGHT + BOTTOM_SHEET_MIN_HEIGHT) / 2;

        let finalY;
        if (velocity < -0.5) {
          finalY = height - BOTTOM_SHEET_MAX_HEIGHT;
          setIsBottomSheetExpanded(true);
        } else if (velocity > 0.5) {
          finalY = height - BOTTOM_SHEET_MIN_HEIGHT;
          setIsBottomSheetExpanded(false);
        } else if (currentY < midPoint) {
          finalY = height - BOTTOM_SHEET_MAX_HEIGHT;
          setIsBottomSheetExpanded(true);
        } else {
          finalY = height - BOTTOM_SHEET_MIN_HEIGHT;
          setIsBottomSheetExpanded(false);
        }

        Animated.spring(bottomSheetY, {
          toValue: finalY,
          useNativeDriver: true,
          tension: 50,
          friction: 10,
        }).start();
      },
    })
  ).current;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      bottomSheetY.removeAllListeners();
      carCardY.removeAllListeners();
    };
  }, []);

  const handleToggleWishlist = useCallback(
    (carId: string, isWishlisted: boolean) => {
      setWishlistedCars((prev) => {
        const newSet = new Set(prev);
        if (isWishlisted) {
          newSet.delete(carId);
        } else {
          newSet.add(carId);
        }
        return newSet;
      });
    },
    []
  );

  useEffect(() => {
    loadCars();
    getCurrentLocation();
  }, []);

  const loadCars = async () => {
    try {
      setLoading(true);

      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), 10000)
      );

      const fetchedCars = await Promise.race([fetchAllCars(), timeoutPromise]);

      if (!isMountedRef.current) return;

      const carsWithLocations = fetchedCars.map((car) => ({
        ...car,
        location: car.location || {
          latitude: 10.3157 + (Math.random() - 0.5) * 0.2,
          longitude: 123.8854 + (Math.random() - 0.5) * 0.2,
          address: "Cebu City, Philippines",
        },
      }));

      setCars(carsWithLocations);
      setFilteredCars(carsWithLocations);
    } catch (error) {
      // Set empty array on error so UI still loads
      if (isMountedRef.current) {
        setCars([]);
        setFilteredCars([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!isMountedRef.current) return;

        const userLoc = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        setUserLocation(userLoc);
        setMapRegion({
          ...userLoc,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        });
      }
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };

  const handleMarkerPress = useCallback((car: Car) => {
    setSelectedCar(car);

    if (car.location && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: car.location.latitude,
          longitude: car.location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        350
      );
    }

    Animated.parallel([
      Animated.spring(bottomSheetY, {
        toValue: height - BOTTOM_SHEET_MIN_HEIGHT,
        useNativeDriver: true,
        tension: 50,
        friction: 10,
      }),
      Animated.spring(carCardY, {
        toValue:
          height -
          BOTTOM_SHEET_MIN_HEIGHT -
          CAR_CARD_HEIGHT -
          CAR_CARD_BOTTOM_MARGIN,
        useNativeDriver: true,
        tension: 50,
        friction: 10,
      }),
    ]).start();

    setIsBottomSheetExpanded(false);
  }, []);

  const handleDeselectCar = useCallback(() => {
    setSelectedCar(null);

    Animated.spring(carCardY, {
      toValue: height,
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();
  }, []);

  const handleCardPress = useCallback((car: Car) => {
    router.push({
      pathname: "/car-details/[id]",
      params: { id: car.id },
    });
  }, []);

  const handleLocationSelect = useCallback(
    (location: { latitude: number; longitude: number; address: string }) => {
      setSearchLocation(location.address);
      setShowLocationSearch(false);

      setMapRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });

      const filtered = cars.filter((car) => {
        if (!car.location) return false;
        const distance = getDistance(
          location.latitude,
          location.longitude,
          car.location.latitude,
          car.location.longitude
        );
        return distance < 50;
      });

      setFilteredCars(filtered.length > 0 ? filtered : cars);
    },
    [cars]
  );

  const handleMakeModelSearch = useCallback(() => {
    let filtered = applyFilters(cars, filters);

    // Apply make/model search
    if (makeModelSearch.trim()) {
      filtered = filtered.filter((car) =>
        car.name.toLowerCase().includes(makeModelSearch.toLowerCase())
      );
    }

    setFilteredCars(filtered);
    setShowLocationSearch(false);
  }, [cars, filters, makeModelSearch]);

  const handleMyLocationPress = useCallback(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          ...userLocation,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        },
        350
      );
    }
  }, [userLocation]);

  const expandBottomSheet = useCallback(() => {
    if (selectedCar) {
      handleDeselectCar();
    }

    Animated.spring(bottomSheetY, {
      toValue: height - BOTTOM_SHEET_MAX_HEIGHT,
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();
    setIsBottomSheetExpanded(true);
  }, [selectedCar, handleDeselectCar]);

  const minimizeBottomSheet = useCallback(() => {
    Animated.spring(bottomSheetY, {
      toValue: height - BOTTOM_SHEET_MIN_HEIGHT,
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();
    setIsBottomSheetExpanded(false);
  }, []);

  const getDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    []
  );

  const activeFilterCount = useMemo(
    () => getActiveFilterCount(filters),
    [filters]
  );

  // Memoized render item
  const renderCarItem = useCallback(
    ({ item }: { item: Car }) => (
      <CarCard
        id={item.id}
        name={item.name}
        type={item.type}
        pricePerHour={item.pricePerHour}
        transmission={item.transmission}
        fuel={item.fuel}
        seats={item.seats}
        imageUrl={item.imageUrl}
        isWishlisted={wishlistedCars.has(item.id)}
        averageRating={item.averageRating}
        reviewCount={item.reviewCount}
        onToggleWishlist={handleToggleWishlist}
      />
    ),
    [wishlistedCars, handleToggleWishlist]
  );

  const keyExtractor = useCallback((item: Car) => item.id, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#007DFC" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="light-content" />

      {/* Full-Screen Map */}
      <MapView
        ref={mapRef}
        style={{ width, height }}
        initialRegion={mapRegion}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={userLocation !== null}
        showsMyLocationButton={false}
        maxZoomLevel={18}
        minZoomLevel={8}
        loadingEnabled
        loadingIndicatorColor="#007DFC"
      >
        {filteredCars.map((car) => (
          <CarMarker
            key={car.id}
            car={car}
            isSelected={selectedCar?.id === car.id}
            onPress={() => handleMarkerPress(car)}
          />
        ))}
      </MapView>

      {/* Search Bar */}
      <View className="absolute top-0 left-0 right-0 z-30 bg-white pt-12 px-4 pb-3">
        <TouchableOpacity
          onPress={() => setShowLocationSearch(!showLocationSearch)}
          className="bg-gray-100 rounded-lg px-4 py-3 flex-row items-center"
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <View className="flex-1 ml-3">
            <Text className="text-gray-900 font-semibold">
              {searchLocation}
            </Text>
          </View>
          <MaterialIcons name="tune" size={24} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Location Search Dropdown */}
        {showLocationSearch && (
          <View className="mt-5 bg-white rounded-lg">
            <GoogleTextInput
              icon={undefined}
              initialLocation="Search location..."
              containerStyle="mb-2"
              handlePress={handleLocationSelect}
            />

            {/* Make and Model Search Input */}
            <View className="mb-2">
              <View className="bg-gray-100 rounded-lg px-4 py-2 flex-row items-center">
                <Ionicons name="car-outline" size={20} color="#9CA3AF" />
                <TextInput
                  value={makeModelSearch}
                  onChangeText={setMakeModelSearch}
                  placeholder="Search make & model..."
                  placeholderTextColor="#9CA3AF"
                  className="flex-1 ml-3 text-gray-900"
                  onSubmitEditing={handleMakeModelSearch}
                  returnKeyType="search"
                />
                {makeModelSearch.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setMakeModelSearch("");
                      setFilteredCars(cars);
                    }}
                  >
                    <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <TouchableOpacity
              onPress={() => {
                if (userLocation) {
                  handleLocationSelect({
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                    address: "Current Location",
                  });
                } else {
                  getCurrentLocation();
                }
              }}
              className="flex-row items-center py-2 px-2 bg-gray-700 rounded-lg mb-2"
              activeOpacity={0.7}
            >
              <MaterialIcons name="my-location" size={20} color="#007DFC" />
              <Text className="text-white ml-2 font-medium">
                Use current location
              </Text>
            </TouchableOpacity>

            {/* Search Button */}
            {makeModelSearch.trim().length > 0 && (
              <TouchableOpacity
                onPress={handleMakeModelSearch}
                className="bg-blue-500 py-3 rounded-lg"
                activeOpacity={0.7}
              >
                <Text className="text-white text-center font-semibold">
                  Search
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Current Location Button */}
      <TouchableOpacity
        onPress={handleMyLocationPress}
        className="absolute right-4 bg-white rounded-full p-3"
        style={{
          top: HEADER_HEIGHT + 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}
        activeOpacity={0.7}
      >
        <MaterialIcons name="my-location" size={24} color="#1F2937" />
      </TouchableOpacity>

      {/* Car Details Card */}
      <Animated.View
        style={{
          position: "absolute",
          left: 16,
          right: 16,
          height: CAR_CARD_HEIGHT,
          transform: [{ translateY: carCardY }],
        }}
        pointerEvents={selectedCar ? "auto" : "none"}
      >
        {selectedCar && (
          <TouchableOpacity
            onPress={() => handleCardPress(selectedCar)}
            className="bg-white rounded-2xl overflow-hidden h-full"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 10,
            }}
            activeOpacity={0.9}
          >
            <View className="flex-row h-full">
              <View className="w-2/5">
                {selectedCar.imageUrl ? (
                  <Image
                    source={{ uri: selectedCar.imageUrl }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-full bg-gray-200" />
                )}
              </View>

              <View className="flex-1 p-4 justify-between">
                <View>
                  {selectedCar.averageRating && selectedCar.reviewCount > 0 && (
                    <View className="flex-row items-center mb-1">
                      <AntDesign name="star" size={14} color="#FFD700" />
                      <Text className="text-sm font-semibold ml-1">
                        {selectedCar.averageRating}
                      </Text>
                      <Text className="text-xs text-gray-500 ml-1">
                        ({selectedCar.reviewCount} trips)
                      </Text>
                    </View>
                  )}

                  <Text
                    className="text-lg font-bold text-gray-900 mb-1"
                    numberOfLines={2}
                  >
                    {selectedCar.name}
                  </Text>

                  {selectedCar.location && (
                    <View className="flex-row items-center mb-2">
                      <Ionicons
                        name="location-outline"
                        size={14}
                        color="#6B7280"
                      />
                      <Text
                        className="text-xs text-gray-500 ml-1 flex-1"
                        numberOfLines={1}
                      >
                        {selectedCar.location.address}
                      </Text>
                    </View>
                  )}

                  <View className="flex-row items-center">
                    <Text className="text-xs text-gray-500">
                      {selectedCar.transmission}
                    </Text>
                    <Text className="text-xs text-gray-400 mx-1">•</Text>
                    <Text className="text-xs text-gray-500">
                      {selectedCar.seats} seats
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-baseline">
                  <Text className="text-xl font-bold text-gray-900">
                    ₱{selectedCar.pricePerHour}
                  </Text>
                  <Text className="text-sm text-gray-500">/day</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleDeselectCar}
              className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
                elevation: 3,
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={18} color="#000" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Draggable Bottom Sheet */}
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: BOTTOM_SHEET_MAX_HEIGHT,
          transform: [{ translateY: bottomSheetY }],
          backgroundColor: "#ffffff",
          elevation: 10,
        }}
      >
        <View className="items-center py-3" {...panResponder.panHandlers}>
          {/* Handle bar removed as per original design */}
        </View>

        <View className="px-4 pb-3 flex-row items-center justify-between">
          <Text className="font-bold text-lg">
            {filteredCars.length}+ cars available
          </Text>
          <TouchableOpacity
            onPress={
              isBottomSheetExpanded ? minimizeBottomSheet : expandBottomSheet
            }
            className="bg-gray-700 px-4 py-2 rounded-full"
            activeOpacity={0.7}
          >
            <Text className="text-white text-xs font-medium">
              {isBottomSheetExpanded ? "Show Map" : "View List"}
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredCars}
          keyExtractor={keyExtractor}
          renderItem={renderCarItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          scrollEnabled={isBottomSheetExpanded}
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          updateCellsBatchingPeriod={50}
          windowSize={5}
          initialNumToRender={5}
        />
      </Animated.View>
    </SafeAreaView>
  );
};

export default SearchScreen;
