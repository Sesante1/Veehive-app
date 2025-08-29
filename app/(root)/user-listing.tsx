import CarCard from "@/components/CarCard";
import CarManagementCard from "@/components/CarManagementCard";
import { images } from "@/constants";
import { useAuth } from "@/hooks/useUser";
import { fetchCarsByOwner } from "@/services/firestore";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const UserListing = () => {
  const { user } = useAuth();

  const [userCars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);

  const fetchCars = async () => {
    try {
      const carList = await fetchCarsByOwner(user?.uid || "");
      setCars(carList);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // HandlePullToRefresh
  // const handlePullToRefresh = useCallback(async () => {
  //   setIsRefetching(true);
  //   await fetchCars();
  //   setIsRefetching(false);
  // }, []);
  const handlePullToRefresh = useCallback(async () => {
    setIsRefetching(true);
    try {
      await fetchCars();
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setIsRefetching(false);
    }
  }, [user?.uid]);

  // useEffect(() => {
  //   const load = async () => {
  //     await fetchCars();
  //     setLoading(false);
  //   };
  //   load();
  // }, []);
  useEffect(() => {
    const loadInitialData = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        await fetchCars();
      } catch (error) {
        console.error("Error loading user cars:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [user?.uid]);

  return (
    <SafeAreaView className="flex-1 bg-white px-4">
      <FlatList
        data={userCars}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CarManagementCard
            {...item}
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
          />
        }
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

              <Text className="text-2xl font-JakartaSemiBold">
                Your listing
              </Text>
              <Text className="text-sm text-gray-500">
                {userCars.length} cars found
              </Text>
            </View>
          </>
        }
      />
    </SafeAreaView>
  );
};

export default UserListing;
