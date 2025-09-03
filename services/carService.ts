import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, FIREBASE_AUTH, storage } from "../FirebaseConfig";

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
  // If you don't need per-file progress, uploadBytes is simpler and awaitable.
  await uploadBytes(fileRef, blob, { contentType: "image/jpeg" });
  const downloadURL = await getDownloadURL(fileRef);
  return {
    url: downloadURL,
    filename: path.split("/").pop()!,
    uploadedAt: new Date().toISOString(),
  };
};

export const uploadCarListing = async (
  carData: CarData,
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

    // === Upload everything in parallel ===
    const uploadTasks: Promise<any>[] = [];

    // Images
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

    // Run all uploads together
    onProgress?.(10, "Uploading files...");
    const results = await Promise.all(uploadTasks);

    // Separate uploaded file results
    const carImageUrls = results.filter((r) => r.filename.startsWith("image"));
    const receiptUrl =
      results.find((r) => r.filename.startsWith("receipt")) || null;
    const crUrl =
      results.find((r) => r.filename.startsWith("certificate")) || null;

    onProgress?.(90, "Saving listing...");

    const {latitude, longitude, ...rest} = carData;

    const carDocument = {
      ...rest,
      year: parseInt(String(carData.year)),
      dailyRate: parseFloat(carData.dailyRate.toString()),
      location: {
        address: carData.location,
        coordinates: {
          latitude: carData.latitude,
          longitude: carData.longitude,
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
      isActive: false,
      isArchive: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, "cars"), carDocument);

    onProgress?.(100, "Upload complete");

    // return { success: true, carId: docRef.id, data: carDocument };
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
