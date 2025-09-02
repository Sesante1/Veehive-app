import { icons } from "@/constants";
import { FIREBASE_AUTH } from "@/FirebaseConfig";
import { useAuth } from "@/hooks/useUser";
import {
  fetchUserWishlist,
  fetchWishlistCars,
  toggleWishlist,
} from "@/services/firestore";
import { router } from "expo-router";
import LottieView from "lottie-react-native";
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
  const { user } = useAuth();

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

  const handleToggleWishlist = async (
    carId: string,
    isWishlistedFromCard?: boolean
  ) => {
    const user = FIREBASE_AUTH.currentUser;
    if (!user) {
      // Optionally navigate to sign-in
      // router.push("/sign-in");
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
    <SafeAreaView className="flex-1 bg-white px-4">
      <View className="flex bg-gray items-center py-4">
        <Pressable
          className="bg-white rounded-full p-1 absolute left-0 top-2"
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
                <LottieView
                  source={require("../../assets/animations/EmptySearch.json")}
                  loop={true}
                  autoPlay
                  style={{ width: 400, height: 500 }}
                />
                <Text className="text-2xl font-Jakarta">No cars found</Text>
              </>
            ) : (
              <ActivityIndicator size="large" color="#007DFC" />
            )}
          </View>
        )}
        ListHeaderComponent={
          <>
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
