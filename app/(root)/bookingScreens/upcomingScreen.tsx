import CustomButton from "@/components/CustomButton";
import GuestBookingCard from "@/components/GuestBookingCard";
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
import LottieView from "lottie-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ListRenderItem,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function UpcomingScreen() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const { openDirectConversation } = useDirectConversation();

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "bookings"),
      where("userId", "==", user.uid),
      where("bookingStatus", "in", ["pending", "confirmed"]),
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
        console.error("Error fetching bookings:", error);
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
    if (booking.hostId) {
      openDirectConversation(booking.hostId);
    } else {
      Alert.alert("Error", "Owner information not available");
    }
  };

  const handleManageTrip = (booking: Booking): void => {
    router.push({
      pathname: "/guestManageBooking",
      params: { booking: JSON.stringify(booking) },
    });
  };

  const renderItem: ListRenderItem<Booking> = ({ item }) => (
    <GuestBookingCard
      booking={item}
      onContactGuest={handleContactGuest}
      onManageTrip={handleManageTrip}
    />
  );

  const renderEmpty = () => (
    <View className="items-center justify-center py-20">
      <LottieView
        source={require("../../../assets/animations/carSearching.json")}
        loop={true}
        autoPlay
        style={{ width: 250, height: 250 }}
      />
      <Text className="text-gray-400 text-lg font-medium mt-4">
        No pending bookings
      </Text>
      <Text className="text-gray-400 text-sm mt-2 mb-8">
        New requests will appear here
      </Text>
      <CustomButton
        title={"Start searching"}
        onPress={() => {
          router.push("/searchScreen");
        }}
      />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="bg-gray-50 flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0066FF" />
        <Text className="mt-2 text-gray-500">Loading bookings...</Text>
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
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </View>
  );
}
