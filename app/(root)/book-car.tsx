import DateRangePicker from "@/components/DateRangePicker";
import GoogleTextInput from "@/components/GoogleTextInput";
import Payment from "@/components/Payment";
import TimePickerModal from "@/components/TimePickerModal";
import { icons } from "@/constants";
import { useAuth, useUserData } from "@/hooks/useUser";
import { isCarAvailable, listenToCar } from "@/services/carService";
import { AntDesign, FontAwesome, Ionicons } from "@expo/vector-icons";
import { StripeProvider } from "@stripe/stripe-react-native";
import { decode as atob } from "base-64";
import dayjs from "dayjs";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Snackbar } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PLATFORM_FEE_PERCENTAGE = 0.02;

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
  const { userData } = useUserData();
  const [car, setCar] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const {
    carId,
    carType,
    carImage,
    carMake,
    carModel,
    pricePerHour,
    year,
    carLocation,
  } = useLocalSearchParams<{
    carId: string;
    carType: string;
    carImage: string;
    carMake: string;
    carModel: string;
    carLocation: string;
    pricePerHour: string;
    year?: string;
  }>();

  const parsedLocation = JSON.parse(carLocation);

  useEffect(() => {
    if (!carId) return;

    const unsubscribe = listenToCar(carId as string, (carData) => {
      setCar(carData);
      setLoading(false);
    });

    return unsubscribe;
  }, [carId]);

  const imageUrl = carImage ? atob(carImage as string) : null;

  // Confirmed dates
  const [pickupDate, setPickupDate] = useState(
    dayjs().startOf("day").format("YYYY-MM-DD")
  );
  const [returnDate, setReturnDate] = useState(
    dayjs().startOf("day").add(3, "day").format("YYYY-MM-DD")
  );

  // Confirmed times
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

  const [carNotAvailable, setCarNotAvailable] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [showLocationSnackbar, setShowLocationSnackbar] = useState(false);

  // Function to check car availability
  const checkCarAvailability = async (pickup: string, returnDt: string) => {
    if (!carId) return;

    setCheckingAvailability(true);
    try {
      const available = await isCarAvailable(carId, pickup, returnDt);
      setCarNotAvailable(!available);

      if (!available) {
        setShowSnackbar(true);
      } else {
        setShowSnackbar(false);
      }
    } catch (error) {
      console.error("Error checking availability:", error);
      setCarNotAvailable(false);
      setShowSnackbar(false);
    } finally {
      setCheckingAvailability(false);
    }
  };

  // Check availability on initial load
  useEffect(() => {
    if (carId && pickupDate && returnDate) {
      checkCarAvailability(pickupDate, returnDate);
    }
  }, [carId]);

  // Check availability whenever dates change
  useEffect(() => {
    if (carId && pickupDate && returnDate) {
      checkCarAvailability(pickupDate, returnDate);
    }
  }, [pickupDate, returnDate]);

  const formatDate = (date: string) => dayjs(date).format("ddd, DD MMM");
  const formatTime = (time: Date) => dayjs(time).format("h:mm A");
  const rentalDays = Math.max(
    dayjs(returnDate).diff(dayjs(pickupDate), "day"),
    1
  );

  // Calculate amounts with platform fee
  const dailyRate = car?.dailyRate || pricePerHour || "0";
  const subtotal = parseFloat(dailyRate) * rentalDays;
  const platformFee = subtotal * PLATFORM_FEE_PERCENTAGE;
  const totalAmount = (subtotal + platformFee).toFixed(2);

  // const [location, setLocation] = useState<{
  //   address: string;
  //   latitude: number;
  //   longitude: number;
  // } | null>(null);

  // const handlePress = (loc: {
  //   address: string;
  //   latitude: number;
  //   longitude: number;
  // }) => {
  //   setLocation(loc);
  //   setShowLocationSnackbar(false);
  // };

  useEffect(() => {
    if (!location) {
      setShowLocationSnackbar(true);
    } else {
      setShowLocationSnackbar(false);
    }
  }, [location]);

  return (
    <>
      <StripeProvider
        publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
        merchantIdentifier="merchant.com.carrental"
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
                  <Text className="color-secondary-700">
                    {car?.rating || "4.7"}
                  </Text>
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

              {/* <View className="mb-4" style={{ zIndex: 1000 }}>
                <Text className="text-[16px] font-JakartaMedium my-6">
                  Pickup & Return location
                </Text>
                <GoogleTextInput icon={icons.pin} handlePress={handlePress} />
              </View> */}

              {/* Availability Status Indicator */}
              {checkingAvailability && (
                <View className="mt-4 p-3 bg-blue-50 rounded-lg flex-row items-center">
                  <ActivityIndicator size="small" color="#007DFC" />
                  <Text className="ml-2 font-Jakarta color-primary-500">
                    Checking availability...
                  </Text>
                </View>
              )}

              {!checkingAvailability && carNotAvailable && (
                <View className="mt-4 p-3 bg-red-50 rounded-lg">
                  <Text className="font-JakartaMedium color-red-600">
                    <FontAwesome name="warning" size={18} color={"#FFCC00"} />{" "}
                    This vehicle is not available for the selected dates
                  </Text>
                </View>
              )}

              {!checkingAvailability && !carNotAvailable && (
                <View className="mt-4 p-3 bg-green-50 rounded-lg">
                  <Text className="font-JakartaMedium color-green-600">
                    <FontAwesome
                      name="check-circle"
                      size={18}
                      color={"#008000"}
                    />{" "}
                    This vehicle is available for your selected dates
                  </Text>
                </View>
              )}

              {/* Display pricing information with breakdown */}
              <View className="mt-8 p-4 bg-secondary-100 rounded-lg">
                <Text className="font-JakartaMedium text-[16px]">
                  Price: ₱{dailyRate}/day
                </Text>
                <Text className="font-JakartaMedium text-[16px] mt-1">
                  Length: {rentalDays} {rentalDays === 1 ? "day" : "days"}
                </Text>
                <Text className="font-JakartaMedium text-[16px] mt-1">
                  Subtotal: ₱{subtotal.toLocaleString()}
                </Text>
                <Text className="font-JakartaMedium text-[14px] mt-1 color-secondary-700">
                  Platform Fee ({(PLATFORM_FEE_PERCENTAGE * 100).toFixed(0)}%):
                  ₱{platformFee.toFixed(2)}
                </Text>
                <View className="border-t border-secondary-300 mt-2 pt-2">
                  <Text className="font-JakartaSemiBold text-[18px] color-primary-500">
                    Total: ₱{parseFloat(totalAmount).toLocaleString()}
                  </Text>
                </View>
              </View>
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
          <Payment
            fullName={`${userData?.firstName || ""} ${userData?.lastName || ""}`}
            email={userData?.email || ""}
            amount={totalAmount}
            subtotal={subtotal.toFixed(2)}
            platformFee={platformFee.toFixed(2)}
            carId={carId as string}
            pickupDate={pickupDate}
            returnDate={returnDate}
            pickupTime={pickupTime}
            returnTime={returnTime}
            rentalDays={rentalDays}
            ownerId={car?.ownerId}
            userId={user?.uid || ""}
            carDetails={{
              make: carMake || "Toyota",
              model: carModel || "Fortuner",
              type: carType || "SUV",
              year: year,
              dailyRate: dailyRate,
            }}
            location={parsedLocation}
            disabled={carNotAvailable || checkingAvailability}
          />
        </View>

        {/* Calendar Modal */}
        <DateRangePicker
          visible={showCalendar}
          onClose={() => setShowCalendar(false)}
          pickupDate={pickupDate}
          returnDate={returnDate}
          onApply={async (pickup, ret) => {
            const p = dayjs(pickup).startOf("day");
            const r = dayjs(ret).startOf("day");
            const [start, end] = r.isBefore(p) ? [r, p] : [p, r];
            const normalizedPickup = start.format("YYYY-MM-DD");
            const normalizedReturn = (
              end.isSame(start) ? end.add(1, "day") : end
            ).format("YYYY-MM-DD");

            // Update dates - useEffect will handle availability check
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

      {/* Snackbar */}
      <Snackbar
        visible={showSnackbar}
        onDismiss={() => setShowSnackbar(false)}
        // duration={Snackbar.DURATION_INDEFINITE}
        style={{
          backgroundColor: "#4e4e4eff",
          marginBottom: 70,
          borderRadius: 10,
        }}
        action={{
          label: "Dismiss",
          onPress: () => setShowSnackbar(false),
        }}
      >
        <Text className="text-white font-JakartaSemiBold text-center">
          This vehicle is unavailable for the selected dates. Please choose
          different dates or explore other cars.
        </Text>
      </Snackbar>

      {loading && (
        <View className="absolute inset-0 bg-black/50 items-center justify-center">
          <View className="bg-white p-6 rounded-xl items-center">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="mt-3 text-gray-900 font-JakartaSemiBold">
              Loading...
            </Text>
          </View>
        </View>
      )}
    </>
  );
};

export default BookCar;
