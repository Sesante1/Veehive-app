import {
  getRecentlyViewedCars,
  RecentlyViewedCar,
} from "@/utils/recentlyViewed";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import CarCard from "./CarCard";

export default function RecentlyViewedCars() {
  const [recentCars, setRecentCars] = useState<RecentlyViewedCar[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecentCars = async () => {
    setLoading(true);
    const cars = await getRecentlyViewedCars();
    setRecentCars(cars);
    setLoading(false);
  };

  // Reload when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadRecentCars();
    }, [])
  );

  if (loading) {
    return (
      <View className="mt-5 items-center">
        <ActivityIndicator size="small" color="#007DFC" />
      </View>
    );
  }

  if (recentCars.length === 0) return null;

  return (
    <View className="mt-5">
      <Text className="text-xl font-JakartaBold mb-3 px-5">
        Recently Viewed
      </Text>
      <FlatList
        data={recentCars}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ width: 320, marginRight: 15 }}>
            <CarCard
              id={item.id}
              name={item.name}
              type={item.type}
              pricePerHour={item.pricePerHour}
              transmission={item.transmission}
              fuel={item.fuel}
              seats={item.seats}
              imageUrl={item.imageUrl}
              isWishlisted={false} 
              averageRating={item.averageRating}
              reviewCount={item.reviewCount}
            />
          </View>
        )}
      />
    </View>
  );
}
