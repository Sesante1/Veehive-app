import AsyncStorage from "@react-native-async-storage/async-storage";

const RECENTLY_VIEWED_KEY = "recently_viewed_cars";
const MAX_RECENT_CARS = 7;

export interface RecentlyViewedCar {
  id: string;
  name: string;
  type: string;
  pricePerHour: number;
  transmission: string;
  fuel: string;
  seats: number;
  imageUrl: string | null;
  averageRating?: string;
  reviewCount?: number;
  viewedAt: string;
}

export const addRecentlyViewedCar = async (
  car: Omit<RecentlyViewedCar, "viewedAt">
) => {
  try {
    const existingData = await AsyncStorage.getItem(RECENTLY_VIEWED_KEY);
    let recentCars: RecentlyViewedCar[] = existingData
      ? JSON.parse(existingData)
      : [];

    // Remove the car if it already exists (to update its position)
    recentCars = recentCars.filter((c) => c.id !== car.id);

    // Add the car to the beginning of the array
    recentCars.unshift({ ...car, viewedAt: new Date().toISOString() });

    // Limit the number of stored cars
    if (recentCars.length > MAX_RECENT_CARS) {
      recentCars = recentCars.slice(0, MAX_RECENT_CARS);
    }

    await AsyncStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(recentCars));
  } catch (error) {
    console.error("Error saving recently viewed car:", error);
  }
};

export const getRecentlyViewedCars = async (): Promise<RecentlyViewedCar[]> => {
  try {
    const data = await AsyncStorage.getItem(RECENTLY_VIEWED_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting recently viewed cars:", error);
    return [];
  }
};

export const clearRecentlyViewedCars = async () => {
  try {
    await AsyncStorage.removeItem(RECENTLY_VIEWED_KEY);
  } catch (error) {
    console.error("Error clearing recently viewed cars:", error);
  }
};
