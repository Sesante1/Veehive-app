import CarManagementCard from "@/components/CarManagementCard";
import DropdownField from "@/components/CarStatusDropdown";
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
  const [loading, setLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);

  const [status, setStatus] = useState<string | null>(null);

  const fetchCars = React.useCallback(async () => {
    if (!user?.uid) {
      setCars([]);
      setLoading(false);
      return;
    }
    try {
      const carList = await fetchCarsByOwner(user.uid);
      setCars(carList);
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
      {/* <View className="flex bg-gray items-center py-4">
        <Pressable
          className="bg-white rounded-full p-1 absolute left-0 top-4"
          onPress={() => {
            router.back();
          }}
        >
          <Image source={icons.backArrow} style={{ width: 30, height: 30 }} />
        </Pressable>

        <Text className="text-2xl font-JakartaSemiBold">Your listing</Text>
        <Text className="text-sm text-gray-500">
          {userCars.length} cars found
        </Text>
      </View> */}
      <View className="h-20">
        <Text className="text-2xl font-JakartaSemiBold mt-6 ">Your listing</Text>
      </View>

      <>
        <SearchListingInput
          label=""
          icon={icons.search}
          containerStyle="bg-white"
        />

        <DropdownField
          items={[
            { label: "Listed", value: "active" },
            { label: "Pending", value: "pending" },
            { label: "On a trip", value: "on a trip" },
            { label: "Snoozed", value: "snoozed" },
            { label: "Canceled", value: "canceled" },
          ]}
          value={status}
          onChangeValue={setStatus} 
        />

        <Text className="text-lg font-JakartaSemiBold my-4">
          Vehicles ({userCars.length})
        </Text>
      </>

      <FlatList
        data={userCars}
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
        contentContainerStyle={{ paddingBottom: 90 }}
      />
    </SafeAreaView>
  );
};

export default UserListing;
