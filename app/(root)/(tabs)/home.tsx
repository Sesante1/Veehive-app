import InputField from "@/components/InputField";
import { icons } from "@/constants";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

import CarCard from "@/components/CarCard";
import { router } from "expo-router";

const cars = [
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
  const [search, setSearch] = useState("");

  return (
    <View className="flex-1 bg-white px-4">
      <FlatList
        data={cars}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <CarCard {...item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListHeaderComponent={
          <View>
            <View className="flex-row items-center justify-between">
              <Text className="text-2xl font-JakartaMedium mt-6">
                Explore new {"\n"}Destinations with ease!
              </Text>
              {/* <MaterialIcons
                className="add-box"
                name="add-box"
                size={40}
                color="#007DFC"
                onPress={() => router.push("/(root)/create-car")}
              /> */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add car"
                hitSlop={8}
                onPress={() => router.push("/create-car")}
              >
                <MaterialIcons name="add-box" size={40} color="#007DFC" />
              </Pressable>
            </View>

            <InputField
              label=""
              placeholder="Search cars"
              icon={icons.search}
              textContentType="emailAddress"
              value={search}
              onChangeText={setSearch}
            />

            <Text className="font-JakartaMedium mt-6">Car Recommendation</Text>
          </View>
        }
      />
    </View>
  );
};

export default Home;
