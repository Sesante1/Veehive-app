import { images } from "@/constants";
import { FIREBASE_AUTH } from "@/FirebaseConfig";
import {
  fetchUserWishlist,
  fetchWishlistCars,
  toggleWishlist,
} from "@/services/firestore";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
  const currentUser = FIREBASE_AUTH.currentUser;
  const [wishlistCars, setWishlistCars] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);

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
    const loadWishlist = async () => {
      if (!currentUser) return;
      try {
        const cars = await fetchWishlistCars(currentUser.uid);
        setWishlistCars(cars);
      } catch (err) {
        console.error("Error loading wishlist:", err);
      } finally {
        setLoading(false);
      }
    };

    loadWishlist();
  }, [currentUser]);

  useEffect(() => {
    const loadWishlist = async () => {
      if (!currentUser) return;
      const data = await fetchUserWishlist(currentUser.uid);
      setWishlist(data);
    };
    loadWishlist();
  }, [currentUser]);

  const handleToggleWishlist = async (carId: string) => {
    const user = FIREBASE_AUTH.currentUser;

    if (!user) return;

    const isWishlisted = wishlist.includes(carId);

    await toggleWishlist(user.uid, carId, isWishlisted);

    setWishlist((prev) =>
      isWishlisted ? prev.filter((id) => id !== carId) : [...prev, carId]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-4">
      <FlatList
        data={wishlistCars}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <CarCard
            {...item}
            isWishlisted={wishlist.includes(item.id)}
            onToggleWishlist={handleToggleWishlist}
          />
        )}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={() => (
          <View className="flex flex-col items-center justify-center">
            {!loading ? (
              <>
                <Image
                  source={images.noResult}
                  className="w-40 h-40"
                  alt="No cars found"
                  resizeMode="contain"
                />
                <Text className="text-sm">No cars found</Text>
              </>
            ) : (
              <ActivityIndicator size="large" color="#007DFC" />
            )}
          </View>
        )}
        ListHeaderComponent={
          <>
            <View className="flex bg-gray items-center py-4">
              <MaterialIcons
                className="absolute left-0 top-5"
                name="arrow-back-ios-new"
                size={20}
                color="#00000"
                onPress={() => router.back()}
                hitSlop={8}
              />

              <Text className="text-2xl font-JakartaSemiBold">Favorites</Text>
              {/* <Text className="text-sm text-gray-500">
                {wishlist.length} cars found
              </Text> */}
            </View>

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
          </>
        }
      />
    </SafeAreaView>
  );
};

export default Favorites;
