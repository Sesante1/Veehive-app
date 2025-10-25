import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";

// Filter types
export interface SearchFilters {
  priceRange: {
    min: number;
    max: number;
  };
  vehicleTypes: string[];
  makes: string[];
  transmission: string[];
  seats: number[];
}

// Filter modal component
interface FilterModalProps {
  visible: boolean;
  filterType: "price" | "vehicleType" | "makeModel" | null;
  filters: SearchFilters;
  onClose: () => void;
  onApply: (filters: SearchFilters) => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  filterType,
  filters,
  onClose,
  onApply,
}) => {
  const [localFilters, setLocalFilters] = React.useState(filters);

  const vehicleTypes = [
    "Sedan",
    "SUV",
    "Hatchback",
    "Pickup",
    "Van",
    "Sports Car",
    "Luxury",
  ];

  const priceRanges = [
    { label: "Under ₱1,000", min: 0, max: 1000 },
    { label: "₱1,000 - ₱2,000", min: 1000, max: 2000 },
    { label: "₱2,000 - ₱3,000", min: 2000, max: 3000 },
    { label: "₱3,000 - ₱5,000", min: 3000, max: 5000 },
    { label: "Over ₱5,000", min: 5000, max: 999999 },
  ];

  const transmissionTypes = ["Automatic", "Manual"];
  const seatOptions = [2, 4, 5, 7, 8];

  const toggleVehicleType = (type: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      vehicleTypes: prev.vehicleTypes.includes(type)
        ? prev.vehicleTypes.filter((t) => t !== type)
        : [...prev.vehicleTypes, type],
    }));
  };

  const toggleTransmission = (type: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      transmission: prev.transmission.includes(type)
        ? prev.transmission.filter((t) => t !== type)
        : [...prev.transmission, type],
    }));
  };

  const toggleSeats = (seats: number) => {
    setLocalFilters((prev) => ({
      ...prev,
      seats: prev.seats.includes(seats)
        ? prev.seats.filter((s) => s !== seats)
        : [...prev.seats, seats],
    }));
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: SearchFilters = {
      priceRange: { min: 0, max: 999999 },
      vehicleTypes: [],
      makes: [],
      transmission: [],
      seats: [],
    };
    setLocalFilters(resetFilters);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl max-h-4/5">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-200">
            <TouchableOpacity onPress={handleReset}>
              <Text className="text-blue-500 font-semibold">Reset</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold">Filters</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-5 py-4">
            {/* Price Range */}
            {filterType === "price" && (
              <View className="mb-6">
                <Text className="text-base font-bold mb-3">Price Range</Text>
                {priceRanges.map((range) => (
                  <TouchableOpacity
                    key={range.label}
                    onPress={() =>
                      setLocalFilters((prev) => ({
                        ...prev,
                        priceRange: { min: range.min, max: range.max },
                      }))
                    }
                    className={`py-3 px-4 rounded-lg mb-2 ${
                      localFilters.priceRange.min === range.min &&
                      localFilters.priceRange.max === range.max
                        ? "bg-blue-500"
                        : "bg-gray-100"
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        localFilters.priceRange.min === range.min &&
                        localFilters.priceRange.max === range.max
                          ? "text-white"
                          : "text-gray-900"
                      }`}
                    >
                      {range.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Vehicle Type */}
            {filterType === "vehicleType" && (
              <View className="mb-6">
                <Text className="text-base font-bold mb-3">Vehicle Type</Text>
                <View className="flex-row flex-wrap">
                  {vehicleTypes.map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => toggleVehicleType(type)}
                      className={`py-2 px-4 rounded-full mr-2 mb-2 ${
                        localFilters.vehicleTypes.includes(type)
                          ? "bg-blue-500"
                          : "bg-gray-100"
                      }`}
                    >
                      <Text
                        className={`font-medium ${
                          localFilters.vehicleTypes.includes(type)
                            ? "text-white"
                            : "text-gray-900"
                        }`}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Make & Model + Additional Filters */}
            {filterType === "makeModel" && (
              <>
                <View className="mb-6">
                  <Text className="text-base font-bold mb-3">Transmission</Text>
                  <View className="flex-row flex-wrap">
                    {transmissionTypes.map((type) => (
                      <TouchableOpacity
                        key={type}
                        onPress={() => toggleTransmission(type)}
                        className={`py-2 px-4 rounded-full mr-2 mb-2 ${
                          localFilters.transmission.includes(type)
                            ? "bg-blue-500"
                            : "bg-gray-100"
                        }`}
                      >
                        <Text
                          className={`font-medium ${
                            localFilters.transmission.includes(type)
                              ? "text-white"
                              : "text-gray-900"
                          }`}
                        >
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View className="mb-6">
                  <Text className="text-base font-bold mb-3">
                    Number of Seats
                  </Text>
                  <View className="flex-row flex-wrap">
                    {seatOptions.map((seat) => (
                      <TouchableOpacity
                        key={seat}
                        onPress={() => toggleSeats(seat)}
                        className={`py-2 px-4 rounded-full mr-2 mb-2 ${
                          localFilters.seats.includes(seat)
                            ? "bg-blue-500"
                            : "bg-gray-100"
                        }`}
                      >
                        <Text
                          className={`font-medium ${
                            localFilters.seats.includes(seat)
                              ? "text-white"
                              : "text-gray-900"
                          }`}
                        >
                          {seat} seats
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}
          </ScrollView>

          {/* Apply Button */}
          <View className="px-5 py-4 border-t border-gray-200">
            <TouchableOpacity
              onPress={handleApply}
              className="bg-blue-500 py-4 rounded-lg"
            >
              <Text className="text-white text-center font-bold text-base">
                Apply Filters
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Filter utility functions
export const applyFilters = (cars: any[], filters: SearchFilters) => {
  let filtered = [...cars];

  // Price filter
  if (filters.priceRange.max !== 999999) {
    filtered = filtered.filter(
      (car) =>
        car.pricePerHour >= filters.priceRange.min &&
        car.pricePerHour <= filters.priceRange.max
    );
  }

  // Vehicle type filter
  if (filters.vehicleTypes.length > 0) {
    filtered = filtered.filter((car) =>
      filters.vehicleTypes.includes(car.type)
    );
  }

  // Transmission filter
  if (filters.transmission.length > 0) {
    filtered = filtered.filter((car) =>
      filters.transmission.includes(car.transmission)
    );
  }

  // Seats filter
  if (filters.seats.length > 0) {
    filtered = filtered.filter((car) => filters.seats.includes(car.seats));
  }

  return filtered;
};

// Get active filter count
export const getActiveFilterCount = (filters: SearchFilters): number => {
  let count = 0;

  if (filters.priceRange.max !== 999999) count++;
  if (filters.vehicleTypes.length > 0) count += filters.vehicleTypes.length;
  if (filters.transmission.length > 0) count += filters.transmission.length;
  if (filters.seats.length > 0) count += filters.seats.length;

  return count;
};
