import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "../FirebaseConfig";

// Fetch all cars
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

export const toggleWishlist = async (
  userId: string,
  carId: string,
  isWishlisted: boolean
) => {
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

// Fetch users wishlist cars
export const fetchWishlistCars = async (userId: string) => {
  try {
    //  Get wishlist items (carIds)
    const wishlistRef = collection(db, "users", userId, "wishlist");
    const snapshot = await getDocs(wishlistRef);

    const carIds = snapshot.docs.map((doc) => doc.id);

    if (carIds.length === 0) return [];

    // Fetch car details and return in CarCard shape
    const carDocs = await Promise.all(
      carIds.map((carId) => getDoc(doc(db, "cars", carId)))
    );
    const cars = carDocs
      .filter((carDoc) => carDoc.exists())
      .map((carDoc) => {
        const data = carDoc.data()!;
        return {
          id: carDoc.id,
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
    console.error("Error fetching wishlist cars:", error);
    return [];
  }
};

export const fetchCarsByOwner = async (ownerId: string) => {
  try {
    const carsRef = collection(db, "cars");

    const q = query(carsRef, where("ownerId", "==", ownerId));
    const querySnapshot = await getDocs(q);

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
        ownerId: data.ownerId,
        available: data.isActive,
      };
    });

    return cars;
  } catch (error) {
    console.error("Error fetching cars by owner:", error);
    throw error;
  }
};

// Get car details with owner Id
export const getCarWithOwner = async (carId: string) => {
  try {
    const carRef = doc(db, "cars", carId);
    const carSnap = await getDoc(carRef);

    if (!carSnap.exists()) {
      console.log("No such car!");
      return null;
    }

    const data = carSnap.data();

    let ownerData = null;
    if (data.ownerId) {
      const ownerRef = doc(db, "users", data.ownerId);
      const ownerSnap = await getDoc(ownerRef);
      if (ownerSnap.exists()) {
        const ownerInfo = ownerSnap.data();
        ownerData = {
          id: ownerSnap.id,
          firstName: ownerInfo.name || ownerInfo.firstName ||"Unknown",
          lastName: ownerInfo.lastName || "Unkown",
          email: ownerInfo.email || "",
          phone: ownerInfo.phone || "",
          profileImage: ownerInfo.profileImage || "",
          ...ownerInfo,
        };
      }
    }

    return {
      id: carSnap.id,
      name: `${data.make} ${data.model}`,
      type: data.carType,
      pricePerHour: data.dailyRate,
      seats: data.seats,
      transmission: data.transmission || "Automatic",
      year: data.year,
      fuel: data.fuel || "Gasoline",
      description: data.description,
      images:
        Array.isArray(data.images) && data.images.length > 0
          ? data.images.map(
              (img: { id?: string; url: string }, index: number) => ({
                id: img.id || `img-${index}`, 
                url: img.url,
              })
            )
          : [],
      location: data.location || null,
      status: data.status,
      ownerId: data.ownerId,
      owner: ownerData,
    };
  } catch (error) {
    console.error("Error fetching car with owner:", error);
    throw error;
  }
};
