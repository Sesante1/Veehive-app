import CarManagementCard from "@/components/CarManagementCard";
import SearchListingInput from "@/components/SearchListingInput";
import { icons, images } from "@/constants";
import { useAuth } from "@/hooks/useUser";
import { fetchCarsByOwner } from "@/services/firestore";
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
  const [filteredCars, setFilteredCars] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);

  const fetchCars = useCallback(async () => {
    if (!user?.uid) {
      setCars([]);
      setFilteredCars([]);
      setLoading(false);
      return;
    }

    try {
      const carList = await fetchCarsByOwner(user.uid);
      setCars(carList);
      setFilteredCars(carList);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  const handlePullToRefresh = useCallback(async () => {
    setIsRefetching(true);
    try {
      await fetchCars();
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setIsRefetching(false);
    }
  }, [fetchCars]);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCars(userCars);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      const filtered = userCars.filter(
        (car) =>
          car.name?.toLowerCase().includes(lowerQuery) ||
          car.make?.toLowerCase().includes(lowerQuery) ||
          car.model?.toLowerCase().includes(lowerQuery)
      );
      setFilteredCars(filtered);
    }
  }, [searchQuery, userCars]);

  return (
    <SafeAreaView className="flex-1 bg-white px-4 -mb-14">
      <View className="h-20">
        <Text className="text-2xl font-JakartaSemiBold mt-6">Your listing</Text>
      </View>

      {/* Search Bar */}
      <SearchListingInput
        label=""
        icon={icons.search}
        containerStyle="bg-white"
        value={searchQuery}
        onChangeText={(text) => setSearchQuery(text)}
        placeholder="Search your cars..."
      />

      <Text className="text-lg font-JakartaSemiBold my-4">
        Vehicles ({filteredCars.length})
      </Text>

      <FlatList
        data={filteredCars}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CarManagementCard {...item} />}
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
        contentContainerStyle={{ paddingBottom: 10 }}
      />
    </SafeAreaView>
  );
};

export default UserListing;
