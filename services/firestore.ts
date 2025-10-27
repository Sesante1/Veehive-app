import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "../FirebaseConfig";

// Fetch all cars
export const fetchAllCars = async () => {
  try {
    const carsRef = collection(db, "cars");
    const activeCarsQuery = query(
      carsRef,
      where("status", "==", "active"),
      where("isDeleted", "==", false)
    );

    const querySnapshot = await getDocs(activeCarsQuery);

    const cars = await Promise.all(
      querySnapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();

        const reviewsRef = collection(db, "reviews");
        const reviewsQuery = query(
          reviewsRef,
          where("carId", "==", docSnap.id),
          where("reviewType", "==", "guest_to_car")
        );
        const reviewsSnapshot = await getDocs(reviewsQuery);

        const reviews = reviewsSnapshot.docs.map((r) => r.data());

        const averageRating =
          reviews.length > 0
            ? (
                reviews.reduce((sum, review) => sum + (review.rating || 0), 0) /
                reviews.length
              ).toFixed(1)
            : "0.0";

        // Ensure location data is properly formatted
        let location = null;
        if (data.location?.coordinates) {
          const coords = data.location.coordinates;
          if (
            typeof coords.latitude === "number" &&
            typeof coords.longitude === "number"
          ) {
            location = {
              latitude: coords.latitude,
              longitude: coords.longitude,
              address: data.location.address || "Location not specified",
            };
          }
        }

        return {
          id: docSnap.id,
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
          averageRating,
          reviewCount: reviews.length,
          location, // Include location data
        };
      })
    );

    // Sort by average rating (highest first), then by review count as tiebreaker
    return cars.sort((a, b) => {
      const ratingDiff =
        parseFloat(b.averageRating) - parseFloat(a.averageRating);
      if (ratingDiff !== 0) return ratingDiff;
      return b.reviewCount - a.reviewCount;
    });
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

    const cars = await Promise.all(
      querySnapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();

        // 🔹 Fetch reviews for this car
        const reviewsQuery = query(
          collection(db, "reviews"),
          where("carId", "==", docSnap.id),
          where("reviewType", "==", "guest_to_car")
        );
        const reviewsSnapshot = await getDocs(reviewsQuery);

        const reviews = reviewsSnapshot.docs.map((r) => ({
          id: r.id,
          ...r.data(),
        }));

        const averageRating =
          reviews.length > 0
            ? (
                reviews.reduce((sum, review: any) => sum + review.rating, 0) /
                reviews.length
              ).toFixed(1)
            : "0.0";

        return {
          id: docSnap.id,
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
          totalTrips: data.totalTrips ?? 0,
          status: data.status,
          ownerId: data.ownerId,
          available: data.isActive,
          tripDate: data?.tripDate ?? null,
          reviews,
          averageRating,
          reviewCount: reviews.length,
        };
      })
    );

    return cars;
  } catch (error) {
    console.error("Error fetching cars by owner:", error);
    throw error;
  }
};

export const getCarWithOwner = async (carId: string) => {
  try {
    const carRef = doc(db, "cars", carId);
    const carSnap = await getDoc(carRef);

    if (!carSnap.exists()) {
      console.warn("No such car:", carId);
      return null;
    }

    const data = carSnap.data();
    let ownerData: any = null;

    // Get owner info directly from car document
    if (data.ownerInfo) {
      ownerData = {
        id: data.ownerInfo.uid || data.ownerId,
        firstName: data.ownerInfo.displayName?.split(" ")[0] ?? "Unknown",
        lastName:
          data.ownerInfo.displayName?.split(" ").slice(1).join(" ") ??
          "Unknown",
        email: data.ownerInfo.email ?? "",
        phone: data.ownerInfo.phone ?? "",
        profileImage: data.ownerInfo.photoURL ?? "",
      };
    }

    const reviewsQuery = query(
      collection(db, "reviews"),
      where("carId", "==", carId),
      where("reviewType", "==", "guest_to_car"),
      orderBy("createdAt", "desc")
    );

    const reviewsSnapshot = await getDocs(reviewsQuery);
    const reviews = reviewsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const averageRating =
      reviews.length > 0
        ? (
            reviews.reduce(
              (sum: number, review: any) => sum + review.rating,
              0
            ) / reviews.length
          ).toFixed(1)
        : "0.0";

    return {
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
      // ✅ Add reviews data
      reviews: reviews,
      averageRating: averageRating,
      reviewCount: reviews.length,
    };
  } catch (error) {
    console.error("Error fetching car with owner:", error);
    throw error;
  }
};
