import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
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
        year: data.year,
        images:
          Array.isArray(data.images) && data.images.length > 0
            ? data.images.map((img) => img.url)
            : [],
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
export const getCarWithOwner = (
  carId: string,
  callback: (carData: any | null) => void
) => {
  try {
    const carRef = doc(db, "cars", carId);

    let unsubscribeOwner: (() => void) | null = null;
    let currentOwnerId: string | null = null;

    // Subscribe to car document
    const unsubscribeCar = onSnapshot(carRef, (carSnap) => {
      if (!carSnap.exists()) {
        console.warn("No such car:", carId);
        callback(null);
        return;
      }

      const data = carSnap.data();

      // If owner exists, listen to owner too
      if (data.ownerId) {
        if (currentOwnerId !== data.ownerId && unsubscribeOwner) {
          unsubscribeOwner();
          unsubscribeOwner = null;
        }
        currentOwnerId = data.ownerId;
        if (!unsubscribeOwner) {
          const ownerRef = doc(db, "users", data.ownerId);
          unsubscribeOwner = onSnapshot(ownerRef, (ownerSnap) => {
            let ownerData: any = null;

            if (ownerSnap.exists()) {
              const ownerInfo = ownerSnap.data();
              ownerData = {
                id: ownerSnap.id,
                ...ownerInfo,
                firstName: ownerInfo.firstName ?? ownerInfo.name ?? "Unknown",
                lastName: ownerInfo.lastName ?? "Unknown",
                email: ownerInfo.email ?? "",
                phone: ownerInfo.phone ?? "",
                profileImage: ownerInfo.profileImage ?? "",
              };
            }

            callback(formatCarData(carSnap, data, ownerData));
          });
        }
      } else {
        // if no owner just return car
        if (unsubscribeOwner) {
          unsubscribeOwner();
          unsubscribeOwner = null;
        }
        currentOwnerId = null;

        callback(formatCarData(carSnap, data, null));
      }
    });

    return () => {
      unsubscribeCar();
      if (unsubscribeOwner) {
        unsubscribeOwner();
        unsubscribeOwner = null;
      }
    };
  } catch (error) {
    console.error("Error listening to car with owner:", error);
    throw error;
  }
};

// Helper to format car + owner
const formatCarData = (carSnap: any, data: any, ownerData: any) => ({
  id: carSnap.id,
  storageFolder: data.carId || "",
  make: data.make,
  model: data.model,
  type: data.carType,
  pricePerHour: data.dailyRate,
  seats: data.seats,
  transmission: data.transmission || "Automatic",
  year: data.year,
  fuel: data.fuel || "Gasoline",
  description: data.description,
  images: Array.isArray(data.images)
    ? data.images
        .filter((img: any) => img?.url)
        .map(
          (
            img: {
              id?: string;
              url: string;
              filename?: string;
              uploadedAt?: string;
            },
            index: number
          ) => ({
            id: img.id ?? `img-${index}`,
            url: img.url,
            filename: img.filename ?? img.url.split("/").pop() ?? "",
            uploadedAt: img.uploadedAt ?? "",
          })
        )
    : [],
  documents: {
    officialReceipt: data.documents?.officialReceipt
      ? {
          filename: data.documents.officialReceipt.filename,
          uploadedAt: data.documents.officialReceipt.uploadedAt,
          url: data.documents.officialReceipt.url,
        }
      : null,

    certificateOfRegistration: data.documents?.certificateOfRegistration
      ? {
          filename: data.documents.certificateOfRegistration.filename,
          uploadedAt: data.documents.certificateOfRegistration.uploadedAt,
          url: data.documents.certificateOfRegistration.url,
        }
      : null,
  },
  location:
    data.location &&
    typeof data.location.coordinates?.latitude === "number" &&
    typeof data.location.coordinates?.longitude === "number"
      ? {
          latitude: data.location.coordinates.latitude,
          longitude: data.location.coordinates.longitude,
          address: data.location.address ?? "",
        }
      : null,
  status: data.status,
  ownerId: data.ownerId,
  owner: ownerData,
});
