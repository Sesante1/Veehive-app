import CarDetailsSkeleton from "@/components/CarDetailsSkeleton";
import { icons } from "@/constants";
import { useAuth } from "@/hooks/useUser";
import { getCarWithOwner } from "@/services/firestore";
import {
  AntDesign,
  FontAwesome,
  FontAwesome6,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Car = {
  id: string;
  name: string;
  type: string;
  pricePerHour: number;
  transmission: string;
  year: number;
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
  };
};

const { width } = Dimensions.get("window");

const carData = {
  location: {
    latitude: 10.3275809, // Cebu City coordinates as example
    longitude: 123.9429876,
    address: "Mandaue City Hall, Mandaue, Cebu, Philippines",
  },
  details: {
    make: "Toyota",
    model: "Vios",
    year: "2023",
    dailyRate: "2500",
  },
};

const CarDetails = () => {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);

  const { user } = useAuth();

  const [expanded, setExpanded] = useState(false);

  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchCar = async () => {
      try {
        setLoading(true);
        const data = await getCarWithOwner(id);
        if (data) {
          // console.log("Car images:", data.images);
          // console.log("Number of images:", data.images?.length);
        }
        setCar(data);
      } catch (e) {
        console.log("Error fetching car:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchCar();
  }, [id]);

  if (loading) return <CarDetailsSkeleton />;

  if (!car) {
    return (
      <View className="bg-white h-full flex justify-center items-center">
        <Text>Car not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      className="bg-white h-full"
      contentContainerStyle={{ paddingBottom: 35 }}
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
            <Image source={icons.backArrow} style={{ width: 30, height: 30 }} />
          </Pressable>

          {user && (
            <Pressable
              className="bg-white flex justify-center aspect-square items-center rounded-full p-2"
              onPress={() => {}}
            >
              {true ? (
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
            {/* TODO: Replace with actual rating once data is available */}
            <Text className="color-secondary-700">4.7</Text>
          </View>
        </View>

        <Text className="text-2xl font-JakartaSemiBold mb-10">{car.name}</Text>

        {/* Profile container */}
        <Text className="font-JakartaSemiBold">Rent Partner</Text>
        <View className="flex-row items-center justify-between mt-3">
          <View className="flex-row items-center py-2 gap-2">
            <View className="h-[60px] w-[60px] rounded-full">
              <Image
                source={{ uri: car.owner?.profileImage }}
                style={{ width: "100%", height: "100%", borderRadius: 5 }}
              />
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

          <Pressable>
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
                (car?.description && car.description.length > 200 ? "..." : "")}

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
        <View className="flex-row gap-3 items-center">
          <FontAwesome6 name="location-dot" size={20} color="#F40F1F" />
          <Text className="font-Jakarta">{car?.location?.address}</Text>
        </View>

        {/* Map */}
      </View>
    </ScrollView>
  );
};

export default CarDetails;
