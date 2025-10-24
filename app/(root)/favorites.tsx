import CustomButton from "@/components/CustomButton";
import { icons } from "@/constants";
import { FIREBASE_AUTH } from "@/FirebaseConfig";
import { useAuth } from "@/hooks/useUser";
import {
  fetchUserWishlist,
  fetchWishlistCars,
  toggleWishlist,
} from "@/services/firestore";
import {
  getRecentlyViewedCars,
  RecentlyViewedCar,
} from "@/utils/recentlyViewed";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CarCard from "../../components/CarCard";

const Favorites = () => {
  const { user } = useAuth();

  const screenHeight = Dimensions.get("window").height;
  const screenWidth = Dimensions.get("window").width;

  const [wishlistCars, setWishlistCars] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [recentlyViewedCars, setRecentlyViewedCars] = useState<
    RecentlyViewedCar[]
  >([]);

  const [active, setActive] = useState("All");
  const [loading, setLoading] = useState(true);

  const options = [
    "All",
    "SUV",
    "Sedan",
    "MPV",
    "Pickup Truck",
    "Hatchback",
    "Van",
  ];

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      if (!user) {
        if (mounted) {
          setWishlistCars([]);
          setWishlist([]);
          setLoading(false);
        }

        return;
      }
      try {
        const [cars, ids] = await Promise.all([
          fetchWishlistCars(user.uid),
          fetchUserWishlist(user.uid),
        ]);
        if (mounted) {
          setWishlistCars(cars);
          setWishlist(ids);
        }
      } catch (err) {
        console.error("Error loading wishlist:", err);
      } finally {
        mounted && setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [user]);

  // Load recently viewed cars when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadRecentlyViewed = async () => {
        const cars = await getRecentlyViewedCars();
        setRecentlyViewedCars(cars);
      };
      loadRecentlyViewed();
    }, [])
  );

  const handleToggleWishlist = async (
    carId: string,
    isWishlistedFromCard?: boolean
  ) => {
    const user = FIREBASE_AUTH.currentUser;
    if (!user) {
      return;
    }
    const isWishlisted = isWishlistedFromCard ?? wishlist.includes(carId);
    try {
      await toggleWishlist(user.uid, carId, isWishlisted);
      setWishlist((prev) =>
        isWishlisted ? prev.filter((id) => id !== carId) : [...prev, carId]
      );
      if (isWishlisted) {
        setWishlistCars((prev) => prev.filter((c) => c.id !== carId));
      }
    } catch (e) {
      console.error("Failed to toggle wishlist:", e);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex bg-gray items-center py-4 px-4">
        <Pressable
          className="bg-white rounded-full p-1 absolute left-4 top-2"
          onPress={() => {
            router.back();
          }}
        >
          <Image source={icons.backArrow} style={{ width: 30, height: 30 }} />
        </Pressable>

        <Text className="text-2xl font-JakartaSemiBold">Favorites</Text>
      </View>

      <FlatList
        data={wishlistCars}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View className="px-4">
            <CarCard
              {...item}
              isWishlisted={wishlist.includes(item.id)}
              onToggleWishlist={handleToggleWishlist}
            />
          </View>
        )}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={() => (
          <View>
            <View
              className="items-center justify-center px-4"
              style={{ minHeight: screenHeight * 0.4 }}
            >
              {!loading ? (
                <View className="justify-center">
                  <Text className="font-JakartaSemiBold mb-3 text-lg">
                    Get Started with favorites
                  </Text>
                  <Text className="font-JakartaMedium mb-6 text-gray-600">
                    Tap the heart icon to save your favorite vehicles to a list
                  </Text>
                  <View>
                    <CustomButton
                      title={"Find new favorites"}
                      onPress={() => router.push("/(root)/(tabs)/home")}
                    />
                  </View>
                </View>
              ) : (
                <ActivityIndicator size="large" color="#007DFC" />
              )}
            </View>

            {/* Show recently viewed only when wishlist is empty */}
            {recentlyViewedCars.length > 0 && !loading && (
              <View className="px-4 mt-4">
                <Text className="text-xl font-JakartaBold mb-4">
                  Recently viewed
                </Text>

                {recentlyViewedCars.map((item) => (
                  <CarCard
                    key={item.id}
                    id={item.id}
                    name={item.name}
                    type={item.type}
                    pricePerHour={item.pricePerHour}
                    transmission={item.transmission}
                    fuel={item.fuel}
                    seats={item.seats}
                    imageUrl={item.imageUrl}
                    isWishlisted={wishlist.includes(item.id)}
                    averageRating={item.averageRating}
                    reviewCount={item.reviewCount}
                    onToggleWishlist={handleToggleWishlist}
                  />
                ))}
              </View>
            )}
          </View>
        )}
        ListHeaderComponent={
          <View className="px-4">
            <ScrollView
              className="my-6"
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              {options.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => setActive(option)}
                  className={`px-5 py-3 rounded-full ${
                    active === option ? "bg-primary-500" : "bg-secondary-400"
                  }`}
                >
                  <Text
                    className={`font-JakartaMedium ${
                      active === option ? "text-white" : "text-black"
                    }`}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default Favorites;
