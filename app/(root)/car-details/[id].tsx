import CarDetailsSkeleton from "@/components/CarDetailsSkeleton";
import CarLocationMap from "@/components/CarLocationMap";
import CustomButton from "@/components/CustomButton";
import { StaticCarLocationMap } from "@/components/MapComponents";
import { icons } from "@/constants";
import { useDirectConversation } from "@/hooks/useDirectConversation";
import { useAuth } from "@/hooks/useUser";
import {
  fetchUserWishlist,
  getCarWithOwner,
  toggleWishlist,
} from "@/services/firestore";
import {
  AntDesign,
  FontAwesome,
  FontAwesome6,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { encode as btoa } from "base-64";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

type Car = {
  id: string;
  make: string;
  model: string;
  type: string;
  pricePerHour: number;
  transmission: string;
  year: string;
  fuel: string;
  seats: number;
  description: string;
  images: { id: string; url: string }[];
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    profileImage?: string;
  } | null;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  } | null;
  // ✅ Add these
  reviews?: any[];
  averageRating?: string;
  reviewCount?: number;
};

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.8;
const CARD_SPACING = 15;

const ReviewCard = ({ item }: { item: any }) => {
  // Calculate time ago
  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return "Recently";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "1 day ago";
    if (diffInDays < 30) return `${diffInDays} days ago`;
    if (diffInDays < 60) return "1 month ago";
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  return (
    <View
      style={{ width: CARD_WIDTH }}
      className="bg-white py-5 border-r border-gray-200 mr-5"
    >
      <View className="flex-row items-center mb-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <AntDesign
            key={index}
            name={index < item.rating ? "star" : "staro"}
            size={13}
            color="#FFD700"
            style={{ marginRight: 2 }}
          />
        ))}

        <Text className="text-xs text-gray-500 font-Jakarta ml-2">
          {getTimeAgo(item.createdAt)}
        </Text>
      </View>
      <Text className="text-sm text-gray-800 mb-4 font-Jakarta">
        {item.comment}
      </Text>

      <View className="flex-row items-center mt-auto">
        <Image
          source={{ uri: item.guestImage || "https://via.placeholder.com/40" }}
          className="w-10 h-10 rounded-full mr-3"
          style={{ width: 40, height: 40, marginRight: 10, borderRadius: 20 }}
        />
        <View>
          <Text className="font-JakartaSemiBold text-gray-900">
            {item.guestName || "Anonymous"}
          </Text>
          <Text className="text-xs text-gray-500 font-Jakarta mt-1">
            Veehive User
          </Text>
        </View>
      </View>
    </View>
  );
};

const CarDetails = () => {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);

  const [wishlist, setWishlist] = useState<string[]>([]);
  const { user } = useAuth();

  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(false);

  const [showMap, setShowMap] = useState(false);
  const { openDirectConversation } = useDirectConversation();

  useEffect(() => {
    if (!id) return;

    const fetchCar = async () => {
      try {
        setLoading(true);
        const carData = await getCarWithOwner(id);
        setCar(carData);
      } catch (e) {
        console.log("Error fetching car:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchCar();
  }, [id]);

  useEffect(() => {
    const loadWishlist = async () => {
      if (!user) return;
      const data = await fetchUserWishlist(user.uid);
      setWishlist(data);
    };
    loadWishlist();
  }, [user]);

  const handleToggleWishlist = async (carId: string) => {
    // const user = FIREBASE_AUTH.currentUser;

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

  const handleChatPress = () => {
    if (car?.owner?.id) {
      openDirectConversation(car.owner.id, `${car.make} ${car.model}`);
    } else {
      Alert.alert("Error", "Owner information not available");
    }
  };

  if (loading) return <CarDetailsSkeleton />;

  if (!car) {
    return (
      <View className="bg-white h-full flex justify-center items-center">
        <Text>Car not found</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="bg-white h-full"
        contentContainerStyle={{ paddingBottom: 105 }}
      >
        <View className="relative mb-5">
          <FlatList
            data={car.images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={width}
            decelerationRate="fast"
            style={{ height: 350 }}
            onScroll={(e) => {
              const slide = Math.ceil(e.nativeEvent.contentOffset.x / width);
              if (slide !== index) {
                setIndex(slide);
              }
            }}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item.url }}
                style={{
                  width,
                  height: 350,
                  borderBottomLeftRadius: 5,
                  borderBottomRightRadius: 5,
                }}
                contentFit="cover"
                cachePolicy="disk"
              />
            )}
          />

          <SafeAreaView className="absolute w-full px-3 flex flex-row justify-between">
            <Pressable
              className="bg-white rounded-full p-1"
              onPress={() => {
                router.back();
              }}
            >
              <Image
                source={icons.backArrow}
                style={{ width: 30, height: 30 }}
              />
            </Pressable>

            {user && (
              <Pressable
                className="bg-white flex justify-center aspect-square items-center rounded-full p-2"
                onPress={() => handleToggleWishlist(id)}
              >
                {wishlist.includes(id) ? (
                  <AntDesign name="heart" size={20} color="#F40F1F" />
                ) : (
                  <AntDesign name="heart" size={20} color="#d6d6d6ff" />
                )}
              </Pressable>
            )}
          </SafeAreaView>

          {car.images.length > 1 && (
            <View className="absolute bottom-4 right-4 bg-black/70 rounded-lg px-2 py-1">
              <Text className="text-white text-xs">
                {index + 1} / {car.images.length}
              </Text>
            </View>
          )}
        </View>

        {/* Specification container */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 17,
            gap: 12,
            marginBottom: 15,
          }}
        >
          <View className="px-4 py-3 rounded-full border border-secondary-100 bg-secondary-100 flex-row gap-2">
            <AntDesign name="setting" size={20} color="#007DFC" />
            <Text className="font-Jakarta">{car.transmission}</Text>
          </View>

          <View className="px-4 py-3 rounded-full border border-secondary-100 bg-secondary-100 flex-row gap-2">
            {(car.fuel === "Gasoline" || car.fuel === "Diesel") && (
              <MaterialCommunityIcons
                name="gas-station"
                size={20}
                color="#007DFC"
              />
            )}
            {car.fuel === "Electric" && (
              <MaterialIcons name="electric-bolt" size={20} color="#007DFC" />
            )}
            <Text className="font-Jakarta">{car.fuel}</Text>
          </View>

          <View className="px-4 py-3 rounded-full border border-secondary-100 bg-secondary-100 flex-row gap-2">
            <FontAwesome name="user" size={20} color="#007DFC" />
            <Text className="font-Jakarta">{car.seats}</Text>
          </View>

          <View className="px-4 py-3 rounded-full border border-secondary-100 bg-secondary-100 flex-row gap-2">
            <AntDesign name="calendar" size={20} color="#007DFC" />
            <Text className="font-Jakarta">{car.year}</Text>
          </View>
        </ScrollView>

        {/* Car Details */}
        <View className="p-4">
          <View className="flex-row items-center justify-between mb-10">
            <View className="bg-secondary-100 flex flex-row justify-center items-center gap-2 p-1 px-2 rounded-[5px]">
              <Text className="text-1xl color-primary-500 px-2 font-JakartaBold">
                {car.type}
              </Text>
            </View>

            <View className="flex flex-row justify-center items-center gap-2 rounded-[5px]">
              <AntDesign name="star" size={16} color="#FFD700" />
              <Text className="color-secondary-700">
                {car.averageRating || "No ratings"}
              </Text>
            </View>
          </View>

          <Text className="text-2xl font-JakartaSemiBold mb-10">
            {car.make + " " + car.model}
          </Text>

          {/* Profile container */}
          <Text className="font-JakartaSemiBold">Rent Partner</Text>
          <View className="flex-row items-center justify-between mt-3">
            <View className="flex-row items-center py-2 gap-2">
              <View className="h-[60px] w-[60px] rounded-full overflow-hidden bg-gray-100">
                {car.owner?.profileImage ? (
                  <Image
                    source={{ uri: car.owner.profileImage }}
                    style={{ width: "100%", height: "100%" }}
                  />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <AntDesign name="user" size={24} color="#9ca3af" />
                  </View>
                )}
              </View>

              {car.owner && (
                <View className="flex-col gap-1">
                  <Text className="font-JakartaSemiBold">
                    {car.owner.firstName + " " + car.owner.lastName}
                  </Text>
                  <Text className="text-[12px] font-Jakarta">Owner</Text>
                </View>
              )}
            </View>

            <Pressable
              // onPress={() => {
              //   if (car?.owner?.id) {
              //     console.log(car?.owner?.id)
              //     openChatModal(car.owner.id);
              //   }
              // }}
              onPress={handleChatPress}
            >
              <Ionicons
                name="chatbubble-ellipses-sharp"
                size={32}
                color="#007DFC"
              />
            </Pressable>
          </View>

          {/* Car description */}
          <View className="flex-col gap-2 mt-10">
            <Text className="font-JakartaMedium">Description</Text>

            <Text className="text-sm color-secondary-700 font-JakartaSemiBold">
              {expanded
                ? car?.description
                : (car?.description?.slice(0, 200) ||
                    "No description available") +
                  (car?.description && car.description.length > 200
                    ? "..."
                    : "")}

              {car?.description && car.description.length > 200 && (
                <Text
                  onPress={() => setExpanded(!expanded)}
                  className="text-sm font-JakartaSemiBold text-blue-500"
                >
                  {expanded ? " See less" : " See more"}
                </Text>
              )}
            </Text>
          </View>

          <Text className="font-JakartaSemiBold mt-10 mb-3">Car location</Text>
          <View className="flex-row gap-3 items-center mb-10">
            <FontAwesome6 name="location-dot" size={20} color="#F40F1F" />
            <Text className="font-Jakarta">{car?.location?.address}</Text>
          </View>

          {/* Car location map */}
          {car.location && (
            <>
              <Pressable onPress={() => setShowMap(true)}>
                {/* <Image
                  source={{
                    uri: `https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=600&height=400&center=lonlat:${car.location.longitude},${car.location.latitude}&zoom=14&apiKey=${process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY}`,
                  }}
                  style={{ width: "100%", height: 300, borderRadius: 10 }}
                /> */}
                <StaticCarLocationMap
                  carLocation={car?.location}
                  height={400}
                />
              </Pressable>

              <Modal visible={showMap} animationType="slide">
                <CarLocationMap
                  carLocation={{
                    latitude: car.location.latitude,
                    longitude: car.location.longitude,
                    address: car.location.address,
                  }}
                  carDetails={{
                    make: car.make,
                    model: car.model,
                    year: car.year,
                    dailyRate: car.pricePerHour,
                  }}
                  onClose={() => setShowMap(false)}
                />
              </Modal>
            </>
          )}

          {/* Reviews container */}
          <View className="mt-12">
            <View className="flex-row items-center gap-2">
              <AntDesign name="star" size={16} color="#FFD700" />
              <Text className="font-JakartaSemiBold">
                {car.averageRating || "0.0"} · {car.reviewCount || 0} reviews
              </Text>
            </View>

            {car.reviews && car.reviews.length > 0 ? (
              <FlatList
                data={car.reviews}
                renderItem={({ item }) => <ReviewCard item={item} />}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={CARD_WIDTH + CARD_SPACING}
                decelerationRate="fast"
                pagingEnabled={false}
              />
            ) : (
              <View className="mt-4 p-6 bg-gray-50 rounded-lg items-center">
                <Text className="font-Jakarta text-gray-500">
                  No reviews yet. Be the first to review this car!
                </Text>
              </View>
            )}
          </View>

          {/* Show all reviews button */}
          <TouchableOpacity className="bg-gray-100 mt-10 h-12 rounded-[5px] flex items-center justify-center">
            <Text className="font-JakartaMedium">Show all reviews</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Book now container */}
      <View
        className="w-full bg-white flex-row justify-between absolute bottom-0 boder-t border-t-gray-300 px-4 py-3 rounded-t-[15px]"
        style={{
          paddingBottom: insets.bottom,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 5,
        }}
      >
        <View>
          <Text className="font-Jakarta text-xl">Price</Text>

          <View className="flex-row gap-2">
            <Text className="color-primary-500 font-Jakarta text-1xl">
              ₱ {car.pricePerHour}
            </Text>
            <Text className="font-Jakarta text-1xl">/day</Text>
          </View>
        </View>

        <View className="w-[180px] ">
          <CustomButton
            title="Book Now"
            onPress={() => {
              const bookingData = {
                carId: car.id,
                carType: car.type,
                carImage: btoa(car.images[0]?.url || ""),
                carMake: car.make,
                carModel: car.model,
              };

              router.push({
                pathname: "/(root)/book-car",
                params: bookingData,
              });
            }}
          />
        </View>
      </View>
    </>
  );
};

export default CarDetails;
