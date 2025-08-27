import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../FirebaseConfig";

export const fetchAllCars = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "cars"));
    const cars = querySnapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        name: `${data.make} ${data.model}`,
        type: data.carType,
        pricePerHour: data.dailyRate,
        seats: data.seats,
        transmission: data.transmission || "Automatic",
        fuel: data.fuel || "Gasoline",
        imageUrl:
          Array.isArray(data.images) && data.images.length > 0
            ? data.images[0].url
            : null,
        status: data.status,
      };
    });

    return cars;
  } catch (error) {
    console.error("Error fetching cars:", error);
    throw error;
  }
};

export const toggleWishlist = async (userId: string, carId: string, isWishlisted: boolean) => {
  const wishlistRef = doc(db, "users", userId, "wishlist", carId);

  if (isWishlisted) {
    await deleteDoc(wishlistRef);
  } else {
    await setDoc(wishlistRef, { carId, createdAt: new Date() });
  }
};

export const fetchUserWishlist = async (userId: string): Promise<string[]> => {
  const wishlistRef = collection(db, "users", userId, "wishlist");
  const snapshot = await getDocs(wishlistRef);

  return snapshot.docs.map((doc) => doc.id);
};


