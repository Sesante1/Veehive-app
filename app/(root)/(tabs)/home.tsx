import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";

import CarCard from "@/components/CarCard";
import InputField from "@/components/InputField";
import { icons, images } from "@/constants";
import { useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { FIREBASE_AUTH } from "../../../FirebaseConfig";
import {
  fetchAllCars,
  fetchUserWishlist,
  toggleWishlist,
} from "../../../services/firestore";

const Cars = [
  {
    id: "1",
    name: "Hyundai Verna",
    type: "Sedan",
    transmission: "Manual",
    fuel: "Gasoline",
    seats: 5,
    pricePerHour: 300,
    imageUrl:
      "https://www.carspecslab.com/media/carGallery/tesla/model-x/1generation-facelift/89448_full.webp",
    avgRating: 4.9,
    reviewCount: 18,
  },
  {
    id: "2",
    name: "Toyota Fortuner",
    type: "SUV",
    transmission: "Automatic",
    fuel: "Diesel",
    seats: 7,
    pricePerHour: 500,
    imageUrl:
      "https://chairatchakarn.co.th/toyota/wp-content/uploads/2020/11/2-4.png",
    avgRating: 4.7,
    reviewCount: 25,
  },
  {
    id: "3",
    name: "Tesla Model 3",
    type: "Sedan",
    transmission: "Automatic",
    fuel: "Electric",
    seats: 5,
    pricePerHour: 800,
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9-2yOia04WZs1kw7BJQCUQUeYcz4hJ8_D9Q&s",
    avgRating: 4.95,
    reviewCount: 40,
  },
  {
    id: "4",
    name: "Honda Civic",
    type: "Sedan",
    transmission: "Manual",
    fuel: "Gasoline",
    seats: 5,
    pricePerHour: 350,
    imageUrl:
      "https://static.independent.co.uk/s3fs-public/thumbnails/image/2017/06/20/18/105808-honda-civic-1-5-vtec-turbo-sport-plus-dynamic.jpg",
    avgRating: 4.6,
    reviewCount: 12,
  },
  {
    id: "5",
    name: "Mitsubishi L300",
    type: "Van",
    transmission: "Manual",
    fuel: "Diesel",
    seats: 12,
    pricePerHour: 450,
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/2025_Mitsubishi_Destinator_Ultimate_prototype_spec_%28Indonesia%29_front_view.jpg/1200px-2025_Mitsubishi_Destinator_Ultimate_prototype_spec_%28Indonesia%29_front_view.jpg",
    avgRating: 4.3,
    reviewCount: 8,
  },
  {
    id: "6",
    name: "Ford Ranger",
    type: "Pickup",
    transmission: "Automatic",
    fuel: "Diesel",
    seats: 5,
    pricePerHour: 600,
    imageUrl:
      "https://cdn.carsauce.com/63c4bd441c21782eb0d195d5/67ef2aa24116ccf06a175bca_20250325-ford-ranger-super-duty%20-%2032.webp",
    avgRating: 4.8,
    reviewCount: 19,
  },
];

const Home = () => {
  const currentUser = FIREBASE_AUTH.currentUser;

  const [cars, setCars] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);

  const [search, setSearch] = useState("");
  const [active, setActive] = useState("All");

  const options = ["All", "Automatic", "Electric", "Manual"];

  const fetchCars = async () => {
    try {
      const carList = await fetchAllCars();
      setCars(carList);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setIsRefetching(false);
    }
  };

  const loadWishlist = useCallback(async () => {
    if (!currentUser) {
      setWishlist([]);
      return;
    }
    try {
      const data = await fetchUserWishlist(currentUser.uid);
      setWishlist(data);
    } catch (e) {
      console.error("Failed to load wishlist", e);
    }
  }, [currentUser]);

  const handleToggleWishlist = async (carId: string) => {
    const user = FIREBASE_AUTH.currentUser;

    if (!user) {
      console.log("User not found");
      return;
    }

    const isWishlisted = wishlist.includes(carId);

    await toggleWishlist(user.uid, carId, isWishlisted);

    setWishlist((prev) =>
      isWishlisted ? prev.filter((id) => id !== carId) : [...prev, carId]
    );
  };

  // HandlePullToRefresh
  const handlePullToRefresh = useCallback(async () => {
    setIsRefetching(true);
    try {
      await fetchCars();
      await loadWishlist();
    } finally {
      setIsRefetching(false);
    }
  }, [fetchCars, loadWishlist]);

  useEffect(() => {
    const load = async () => {
      await fetchCars();
      await loadWishlist();
      setLoading(false);
    };
    load();
  }, [currentUser]);

  const filteredCars = useMemo(() => {
    let filtered = cars;

    const q = search.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(
        (car) =>
          car.name.toLowerCase().includes(q) ||
          (car.type ? car.type.toLowerCase().includes(q) : false)
      );
    }

    if (active !== "All") {
      const activeLower = active.toLowerCase();
      filtered = filtered.filter((car) => {
        if (activeLower === "electric") {
          return car.fuel?.toLowerCase() === "electric";
        }
        return car.transmission?.toLowerCase() === activeLower;
      });
    }

    return filtered;
  }, [cars, search, active]);

  return (
    <SafeAreaView className="flex-1 bg-white px-4">
      <FlatList
        data={filteredCars}
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
        contentContainerStyle={{ paddingBottom: 80 }}
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
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handlePullToRefresh}
            tintColor={"#007DFC"}
            colors={["#007DFC"]}
          />
        }
        ListHeaderComponent={
          <View>
            <View className="flex-row items-center justify-between">
              <Text className="text-2xl font-JakartaMedium mt-6">
                Explore new {"\n"}Destinations with ease!
              </Text>
              {/* <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add car"
                hitSlop={8}
                onPress={() => router.push("/create-car")}
              >
                <MaterialIcons name="add-box" size={40} color="#007DFC" />
              </Pressable> */}
            </View>

            <InputField
              label=""
              placeholder="Search cars"
              icon={icons.search}
              textContentType="emailAddress"
              value={search}
              onChangeText={setSearch}
            />

            <Text className="font-JakartaMedium mt-6">
              Select by transmission
            </Text>

            <View className="flex-row items-center my-6 gap-5">
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
            </View>

            <Text className="font-JakartaMedium mt-6">Car Recommendation</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default Home;
