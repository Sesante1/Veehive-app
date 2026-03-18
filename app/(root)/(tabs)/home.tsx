import Constants from "expo-constants";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import CarCard from "@/components/CarCard";
import { icons, images } from "@/constants";
import { router } from "expo-router";
import { useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { FIREBASE_AUTH } from "../../../FirebaseConfig";
import {
  fetchAllCars,
  fetchUserWishlist,
  toggleWishlist,
} from "../../../services/firestore";

const AnimatedFlatList = Animated.FlatList;

const Home = () => {
  const currentUser = FIREBASE_AUTH.currentUser;

  const [cars, setCars] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);

  const [search, setSearch] = useState("");
  const [active, setActive] = useState("All");

  const options = ["All", "Automatic", "Electric", "Manual"];

  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const scrollY = useSharedValue(0);
  const HEADER_MAX_HEIGHT = 220;
  const HEADER_MIN_HEIGHT = 115;
  const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

  // const scrollHandler = useAnimatedScrollHandler({
  //   onScroll: (event) => {
  //     scrollY.value = event.contentOffset.y;
  //   },
  // });
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;

      // Also update the status bar state
      runOnJS(setIsHeaderVisible)(
        event.contentOffset.y < HEADER_SCROLL_DISTANCE,
      );
    },
  });

  const handleScroll = (event: any) => {
    const scrollYValue = event.nativeEvent.contentOffset.y;
    setIsHeaderVisible(scrollYValue < HEADER_SCROLL_DISTANCE);
  };

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, HEADER_SCROLL_DISTANCE],
      [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
      Extrapolation.CLAMP,
    );
    return { height };
  });

  const titleAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, HEADER_SCROLL_DISTANCE / 2],
      [1, 0],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  const searchBarAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, HEADER_SCROLL_DISTANCE],
      [0, -80],
      Extrapolation.CLAMP,
    );
    return { transform: [{ translateY }] };
  });

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
      isWishlisted ? prev.filter((id) => id !== carId) : [...prev, carId],
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
          (car.type ? car.type.toLowerCase().includes(q) : false),
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
    <>
      <StatusBar
        style={isHeaderVisible ? "light" : "dark"}
        backgroundColor={isHeaderVisible ? "transparent" : "white"}
        translucent
      />

      {/* Animated Header */}
      <Animated.View
        style={[
          headerAnimatedStyle,
          { paddingTop: (Constants.statusBarHeight || 0) + 8 },
        ]}
        className="bg-primary-500 absolute top-0 left-0 right-0 z-10 rounded-b-2xl"
      >
        <Animated.View
          style={titleAnimatedStyle}
          className=" flex-row items-center"
        >
          <View className="h-20 w-20">
            <Image source={images.appLogo} className="h-full w-full" />
          </View>

          {/* <Text className="text-2xl font-JakartaMedium text-white">
            Explore new {"\n"}Destinations with ease!
          </Text> */}
          <Text className="text-4xl font-JakartaBold text-white">VeeHive</Text>
        </Animated.View>

        <Animated.View style={searchBarAnimatedStyle}>
          <Pressable
            className="flex-row gap-6 bg-secondary-100 py-5 px-4 rounded-lg m-4"
            onPress={() => router.push("/searchScreen")}
          >
            <Image source={icons.search} className="h-6 w-6" />
            <Text className="font-JakartaSemiBold text-secondary-700">
              Search car
            </Text>
          </Pressable>
        </Animated.View>
      </Animated.View>

      <SafeAreaView
        className="flex-1 bg-white -mb-14"
        edges={["bottom", "left", "right"]}
      >
        <AnimatedFlatList
          data={filteredCars}
          keyExtractor={(item) => item.id.toString()}
          // onScroll={(e) => {
          //   scrollHandler(e);
          //   handleScroll(e);
          // }}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingTop: HEADER_MAX_HEIGHT + 20,
            paddingBottom: 20,
          }}
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
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handlePullToRefresh}
              tintColor={"#007DFC"}
              colors={["#007DFC"]}
              progressViewOffset={HEADER_MAX_HEIGHT}
            />
          }
          ListHeaderComponent={
            <>
              <View className="px-4">
                <Text className="font-JakartaMedium mt-6">
                  Select by transmission
                </Text>

                <ScrollView
                  className="my-6"
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 20,
                  }}
                >
                  {options.map((option) => (
                    <Pressable
                      key={option}
                      onPress={() => setActive(option)}
                      className={`px-5 py-3 rounded-full ${
                        active === option
                          ? "bg-primary-500"
                          : "bg-secondary-400"
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

                <Text className="font-JakartaMedium mt-6">
                  Car Recommendation
                </Text>
              </View>
            </>
          }
        />
      </SafeAreaView>
    </>
  );
};

export default Home;
