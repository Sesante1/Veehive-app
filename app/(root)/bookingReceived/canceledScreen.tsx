// screens/CanceledScreen.tsx
import BookingCard from "@/components/BookingCard";
import { db } from "@/FirebaseConfig";
import { useDirectConversation } from "@/hooks/useDirectConversation";
import { useAuth } from "@/hooks/useUser";
import { Booking } from "@/types/booking.types";
import { router } from "expo-router";
import {
  collection,
  DocumentData,
  onSnapshot,
  orderBy,
  query,
  QuerySnapshot,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ListRenderItem,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CanceledScreen() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const { openDirectConversation } = useDirectConversation();

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "bookings"),
      where("hostId", "==", user.uid),
      where("bookingStatus", "==", "cancelled"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const bookingData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Booking[];
        setBookings(bookingData);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error("Error fetching cancelled bookings:", error);
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const onRefresh = (): void => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleContactGuest = (booking: Booking): void => {
    if (booking.userId) {
      openDirectConversation(booking.userId);
    } else {
      Alert.alert("Error", "Owner information not available");
    }
  };

  const handleViewDetails = (booking: Booking): void => {
    router.push({
      pathname: "/hostManageBooking",
      params: { booking: JSON.stringify(booking) },
    });
  };

  const renderItem: ListRenderItem<Booking> = ({ item }) => (
    <BookingCard
      booking={item}
      onContactGuest={handleContactGuest}
      onManageTrip={handleViewDetails}
    />
  );

  const renderEmpty = () => (
    <View className="items-center justify-center py-20">
      <Text className="text-gray-400 text-lg font-medium">
        No cancelled trips
      </Text>
      <Text className="text-gray-400 text-sm mt-2">
        Cancelled bookings will appear here
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="bg-gray-50 flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0066FF" />
        <Text className="mt-2 text-gray-500">Loading cancelled trips...</Text>
      </SafeAreaView>
    );
  }

  return (
    <View className="bg-white flex-1">
      <FlatList
        className="mt-4"
        data={bookings}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pt-2"
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#0066FF"]}
          />
        }
      />
    </View>
  );
}
