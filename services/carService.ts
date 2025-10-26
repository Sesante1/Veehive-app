import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, FIREBASE_AUTH, storage } from "../FirebaseConfig";
import { checkRequiredSteps } from "@/utils/stepValidator";

interface CarData {
  make: string;
  model: string;
  year: string | number;
  carType: string;
  description: string;
  dailyRate: string | number;
  location: string;
  latitude: number;
  longitude: number;
  transmission: string;
  fuel: string;
  seats: string | number;
}

const uploadFile = async (path: string, file: { uri: string }) => {
  const response = await fetch(file.uri);
  const blob = await response.blob();
  const fileRef = ref(storage, path);

  await uploadBytes(fileRef, blob, { contentType: "image/jpeg" });
  const downloadURL = await getDownloadURL(fileRef);
  return {
    url: downloadURL,
    filename: path.split("/").pop()!,
    uploadedAt: new Date().toISOString(),
  };
};

export const uploadCarListing = async (
  carData: any,
  carImages: any[],
  receipt: any[],
  certificateRegistration: any[],
  onProgress?: (progress: number, message: string) => void
) => {
  try {
    const currentUser = FIREBASE_AUTH.currentUser;
    if (!currentUser) throw new Error("User must be authenticated");

    const timestamp = Date.now();
    const carId = `car_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;

    // Upload all files in parallel
    const uploadTasks: Promise<any>[] = [];

    // Car images
    carImages.forEach((image, i) => {
      const imagePath = `cars/${carId}/images/image_${i + 1}_${timestamp}.jpg`;
      uploadTasks.push(uploadFile(imagePath, image));
    });

    // Receipt
    if (receipt.length > 0) {
      const receiptPath = `cars/${carId}/documents/receipt_${timestamp}.jpg`;
      uploadTasks.push(uploadFile(receiptPath, receipt[0]));
    }

    // Certificate
    if (certificateRegistration.length > 0) {
      const certPath = `cars/${carId}/documents/certificate_${timestamp}.jpg`;
      uploadTasks.push(uploadFile(certPath, certificateRegistration[0]));
    }

    onProgress?.(10, "Uploading files...");
    const results = await Promise.all(uploadTasks);

    const carImageUrls = results.filter((r) => r.filename.startsWith("image"));
    const receiptUrl = results.find((r) => r.filename.startsWith("receipt")) || null;
    const crUrl = results.find((r) => r.filename.startsWith("certificate")) || null;

    onProgress?.(70, "Checking verification status...");

    // Check if the owner has completed verification
    const userRef = doc(db, "users", currentUser.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    const { allStepsCompleted } = userData ? checkRequiredSteps(userData) : { allStepsCompleted: false };

    // If user is verified, car → pending; otherwise → draft
    const carStatus = allStepsCompleted ? "pending" : "draft";

    const { latitude, longitude, ...rest } = carData;

    const carDocument = {
      ...rest,
      year: parseInt(String(carData.year)),
      dailyRate: parseFloat(carData.dailyRate.toString()),
      location: {
        address: carData.location,
        coordinates: {
          latitude,
          longitude,
        },
      },
      seats: parseInt(String(carData.seats)),
      carId,
      images: carImageUrls,
      documents: {
        officialReceipt: receiptUrl,
        certificateOfRegistration: crUrl,
      },
      ownerId: currentUser.uid,
      ownerInfo: {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName || null,
        photoURL: currentUser.photoURL || null,
      },
      status: "pending",
      totalTrips: 0, 
      isActive: false,
      isDeleted: false,
      isVerified: false,
      remarks: null,
      reviewedBy: null,
      reviewedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    onProgress?.(90, "Saving car listing...");
    const docRef = await addDoc(collection(db, "cars"), carDocument);

    onProgress?.(100, "Upload complete");

    return {
      success: true,
      docId: docRef.id,
      storageFolder: carId,
      data: carDocument,
    };
  } catch (error) {
    console.error("Error uploading car listing:", error);
    throw error;
  }
};

export const updateCarStatus = async (carId: string, newStatus: string) => {
  if (!carId) {
    throw new Error("carId is required");
  }

  try {
    const carRef = doc(db, "cars", carId);

    await updateDoc(carRef, {
      status: newStatus,
      updatedAt: serverTimestamp(),
    });

    console.log(`Car status updated to ${newStatus}.`);
    return { success: true };
  } catch (error) {
    console.error("Error updating status:", error);
    throw error;
  }
};

export const listenToCar = (
  carId: string,
  callback: (car: any | null) => void
) => {
  const carRef = doc(db, "cars", carId);

  const unsubscribe = onSnapshot(carRef, (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }

    const data = snap.data();

    const car = {
      id: snap.id,
      ...data,
    };

    callback(car);
  });

  return unsubscribe;
};

export const isCarAvailable = async (
  carId: string,
  pickupDate: string,
  returnDate: string
): Promise<boolean> => {
  try {
    const bookingsRef = collection(db, "bookings");

    const q = query(
      bookingsRef,
      where("carId", "==", carId),
      where("bookingStatus", "in", ["pending", "confirmed"])
    );

    const snapshot = await getDocs(q);

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const existingPickup = new Date(data.pickupDate);
      const existingReturn = new Date(data.returnDate);

      const requestedPickup = new Date(pickupDate);
      const requestedReturn = new Date(returnDate);

      // Check overlap
      const overlaps =
        requestedPickup <= existingReturn && requestedReturn >= existingPickup;

      if (overlaps) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Error checking car availability:", error);
    throw error;
  }
};
