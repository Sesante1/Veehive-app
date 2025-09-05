import CustomButton from "@/components/CustomButton";
import DateRangePicker from "@/components/DateRangePicker";
import TimePickerModal from "@/components/TimePickerModal";
import { icons } from "@/constants";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { decode as atob } from "base-64";
import dayjs from "dayjs";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StripeProvider } from "@stripe/stripe-react-native";
import Payment from "@/components/Payment";

const PickerBox = ({
  label,
  value,
  icon,
  onPress,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}) => {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 flex-row justify-between items-center bg-secondary-400 py-4 px-6 rounded-full"
    >
      <View>
        <Text className="font-JakartaMedium color-secondary-700">{label}</Text>
        <Text className="font-Jakarta">{value}</Text>
      </View>
      <Ionicons name={icon} size={30} color="#007DFC" />
    </Pressable>
  );
};

const BookCar = () => {
  const insets = useSafeAreaInsets();

  const { carId, carType, carImage, carMake, carModel, pricePerHour, year } =
    useLocalSearchParams<{
      carId: string;
      carType: string;
      carImage: string;
      carMake: string;
      carModel: string;
      pricePerHour: string;
      year?: string;
    }>();

  const imageUrl = carImage ? atob(carImage as string) : null;
  const today = dayjs().format("YYYY-MM-DD");
  const defaultReturn = dayjs(today).add(3, "day").format("YYYY-MM-DD");

  // confirmed dates
  const [pickupDate, setPickupDate] = useState(
    dayjs().startOf("day").format("YYYY-MM-DD")
  );
  const [returnDate, setReturnDate] = useState(
    dayjs().startOf("day").add(3, "day").format("YYYY-MM-DD")
  );

  // confirmed times
  const [pickupTime, setPickupTime] = useState<Date>(
    dayjs().hour(10).minute(0).toDate()
  );
  const [returnTime, setReturnTime] = useState<Date>(
    dayjs().add(3, "day").hour(13).minute(0).toDate()
  );

  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState<
    null | "pickup" | "return"
  >(null);

  const formatDate = (date: string) => dayjs(date).format("ddd, DD MMM");
  const formatTime = (time: Date) => dayjs(time).format("h:mm A");
  const rentalDays = dayjs(returnDate).diff(dayjs(pickupDate), "day");

  return (
    <>
      <StripeProvider
        publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
        merchantIdentifier="merchant.com.uber"
        urlScheme="carrentalapp"
      >
        <ScrollView
          className="flex-1 bg-white"
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="relative mb-5">
            <Image
              source={{
                uri:
                  imageUrl ||
                  "https://img.philkotse.com/crop/640x360/2021/09/20/WFFKkBCT/img-2945-ca9d_wm.jpg",
              }}
              style={{ width: "100%", height: 350 }}
            />
            <Pressable
              className="bg-white rounded-full p-1 absolute left-3 top-10"
              onPress={() => router.back()}
            >
              <Image
                source={icons.backArrow}
                style={{ width: 30, height: 30 }}
              />
            </Pressable>
          </View>

          {/* Booking Section */}
          <View className="p-4">
            <View className="border-b border-b-gray-200 mb-8">
              <View className="flex-row items-center justify-between mb-10">
                <View className="bg-secondary-100 flex flex-row justify-center items-center gap-2 p-1 px-2 rounded-[5px]">
                  <Text className="text-1xl color-primary-500 px-2 font-JakartaBold">
                    {carType || "SUV"}
                  </Text>
                </View>

                <View className="flex flex-row justify-center items-center gap-2 rounded-[5px]">
                  <AntDesign name="star" size={16} color="#FFD700" />
                  <Text className="color-secondary-700">4.7</Text>
                </View>
              </View>

              <Text className="text-2xl font-JakartaSemiBold mb-10">
                {`${carMake || "Toyota"} ${carModel || "Fortuner"}`}
                {year && (
                  <Text className="text-lg color-secondary-700"> ({year})</Text>
                )}
              </Text>
            </View>

            <Text className="text-1xl color-secondary-700 font-Jakarta">
              Book Car
            </Text>

            {/* Pick-Up */}
            <View className="mt-6">
              <Text className="text-[16px] font-JakartaMedium">
                Pick-Up Date and Time
              </Text>
              <View className="flex-row gap-14 mt-5">
                <PickerBox
                  label="Date"
                  value={formatDate(pickupDate)}
                  icon="calendar-number-sharp"
                  onPress={() => setShowCalendar(true)}
                />
                <PickerBox
                  label="Time"
                  value={formatTime(pickupTime)}
                  icon="time-sharp"
                  onPress={() => setShowTimePicker("pickup")}
                />
              </View>

              {/* Return */}
              <Text className="text-[16px] font-JakartaMedium mt-6">
                Return Date and Time
              </Text>
              <View className="flex-row gap-14 mt-5">
                <PickerBox
                  label="Date"
                  value={formatDate(returnDate)}
                  icon="calendar-number-sharp"
                  onPress={() => setShowCalendar(true)}
                />
                <PickerBox
                  label="Time"
                  value={formatTime(returnTime)}
                  icon="time-sharp"
                  onPress={() => setShowTimePicker("return")}
                />
              </View>

              <Text className="mt-6 font-JakartaMedium text-[16px]">
                Rental Length: {rentalDays} days
              </Text>

              {/* Display pricing information */}
              {pricePerHour && (
                <View className="mt-4 p-4 bg-secondary-100 rounded-lg">
                  <Text className="font-JakartaMedium text-[16px]">
                    Price: ₱{pricePerHour}/day
                  </Text>
                  <Text className="font-JakartaSemiBold text-[18px] color-primary-500">
                    Total: ₱
                    {(parseFloat(pricePerHour) * rentalDays).toLocaleString()}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Bottom Button */}
        <View
          className="w-full bg-white flex justify-center absolute bottom-0 boder-t border-t-gray-300 px-4 rounded-t-[15px]"
          style={{
            paddingBottom: insets.bottom,
            paddingTop: 15,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          <Payment />
          {/* <CustomButton
            title={"Continue"}
            onPress={() => {
              const bookingData = {
                carId,
                carType,
                carImage,
                carMake,
                carModel,
                pricePerHour,
                pickupDate,
                returnDate,
                pickupTime: pickupTime.toISOString(),
                returnTime: returnTime.toISOString(),
                rentalDays,
                totalPrice: pricePerHour
                  ? parseFloat(pricePerHour) * rentalDays
                  : 0,
              };

              TODO: Navigate to payment or confirmation screen
              router.push({ pathname: "/(root)/payment", params: bookingData });
            }}
          /> */}
        </View>

        {/* Calendar Modal */}
        <DateRangePicker
          visible={showCalendar}
          onClose={() => setShowCalendar(false)}
          pickupDate={pickupDate}
          returnDate={returnDate}
          onApply={(pickup, ret) => {
            // Normalize both dates to start of day
            const normalizedPickup = dayjs(pickup)
              .startOf("day")
              .format("YYYY-MM-DD");
            const normalizedReturn = dayjs(ret)
              .startOf("day")
              .format("YYYY-MM-DD");

            setPickupDate(normalizedPickup);
            setReturnDate(normalizedReturn);
          }}
        />

        {/* Time Picker Modal */}
        <TimePickerModal
          visible={showTimePicker === "pickup"}
          value={pickupTime}
          onClose={() => setShowTimePicker(null)}
          onConfirm={(date) => setPickupTime(date)}
        />
        <TimePickerModal
          visible={showTimePicker === "return"}
          value={returnTime}
          onClose={() => setShowTimePicker(null)}
          onConfirm={(date) => setReturnTime(date)}
        />
      </StripeProvider>
    </>
  );
};

export default BookCar;
