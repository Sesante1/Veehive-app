import {
  collection,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL
} from 'firebase/storage';
import { db, storage, FIREBASE_AUTH } from '../FirebaseConfig';

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
  seats: string | number;
}

const uploadFile = (path: string, file: any) => {
  return new Promise<{ url: string; filename: string; uploadedAt: string }>(
    async (resolve, reject) => {
      try {
        const response = await fetch(file.uri);
        const blob = await response.blob();

        const fileRef = ref(storage, path);
        const snapshot = await uploadBytesResumable(fileRef, blob);
        const downloadURL = await getDownloadURL(snapshot.ref);

        resolve({
          url: downloadURL,
          filename: path.split('/').pop()!,
          uploadedAt: new Date().toISOString(),
        });
      } catch (err) {
        reject(err);
      }
    }
  );
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
    if (!currentUser) throw new Error('User must be authenticated');

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
    onProgress?.(10, 'Uploading files...');
    const results = await Promise.all(uploadTasks);

    // Separate uploaded file results
    const carImageUrls = results.filter(r => r.filename.startsWith('image'));
    const receiptUrl = results.find(r => r.filename.startsWith('receipt')) || null;
    const crUrl = results.find(r => r.filename.startsWith('certificate')) || null;

    onProgress?.(90, 'Saving listing...');

    // === Firestore document ===
    const carDocument = {
      ...carData,
      year: parseInt(String(carData.year)),
      dailyRate: parseFloat(carData.dailyRate.toString()),
      location: {
        address: carData.location,
        coordinates: { latitude: carData.latitude, longitude: carData.longitude },
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
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'cars'), carDocument);

    onProgress?.(100, 'Upload complete');

    return { success: true, carId: docRef.id, data: carDocument };
  } catch (error) {
    console.error('Error uploading car listing:', error);
    throw error;
  }
};

// Get all cars owned by current user
export const getUserCars = async () => {
  const currentUser = FIREBASE_AUTH.currentUser;
  if (!currentUser) {
    throw new Error('User must be authenticated');
  }
  try {
    const { query, where, orderBy, getDocs } = await import('firebase/firestore');
    const q = query(
      collection(db, 'cars'),
      where('ownerId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching user cars:', error);
    throw error;
  }
};

// Get cars by specific owner ID (for admin use)
export const getCarsByOwnerId = async (ownerId: string) => {
  try {
    const { query, where, orderBy, getDocs } = await import('firebase/firestore');
    const q = query(
      collection(db, 'cars'),
      where('ownerId', '==', ownerId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching cars by owner:', error);
    throw error;
  }
};

// Update car listing (only owner can update)
export const updateCarListing = async (carDocId: string, updatedData: any) => {
  const currentUser = FIREBASE_AUTH.currentUser;
  if (!currentUser) {
    throw new Error('User must be authenticated');
  }
  try {
    const { doc, getDoc, updateDoc } = await import('firebase/firestore');
    // First, verify ownership
    const carRef = doc(db, 'cars', carDocId);
    const carDoc = await getDoc(carRef);
    if (!carDoc.exists()) {
      throw new Error('Car listing not found');
    }
    const carData = carDoc.data();
    if (carData.ownerId !== currentUser.uid) {
      throw new Error('You can only update your own car listings');
    }
    await updateDoc(carRef, { ...updatedData, updatedAt: serverTimestamp() });
    return { success: true, message: 'Car listing updated successfully' };
  } catch (error) {
    console.error('Error updating car listing:', error);
    throw error;
  }
};

// Delete car listing (only owner can delete)
export const deleteCarListing = async (carDocId: string) => {
  const currentUser = FIREBASE_AUTH.currentUser;
  if (!currentUser) {
    throw new Error('User must be authenticated');
  }
  try {
    const { doc, getDoc, deleteDoc } = await import('firebase/firestore');
    const { ref: storageRef, listAll, deleteObject } = await import('firebase/storage');
    // First, verify ownership
    const carRef = doc(db, 'cars', carDocId);
    const carDoc = await getDoc(carRef);
    if (!carDoc.exists()) {
      throw new Error('Car listing not found');
    }
    const carData = carDoc.data();
    if (carData.ownerId !== currentUser.uid) {
      throw new Error('You can only delete your own car listings');
    }
    // Delete associated files from Storage
    const carStorageRef = storageRef(storage, `cars/${carData.carId}`);
    const listResult = await listAll(carStorageRef);
    // Delete all files and folders
    const deletePromises: Promise<void>[] = [];
    listResult.items.forEach((itemRef) => {
      deletePromises.push(deleteObject(itemRef));
    });
    // Delete subfolders
    listResult.prefixes.forEach(async (folderRef) => {
      const folderList = await listAll(folderRef);
      folderList.items.forEach((itemRef) => {
        deletePromises.push(deleteObject(itemRef));
      });
    });
    await Promise.all(deletePromises);
    // Delete Firestore document
    await deleteDoc(carRef);
    return { success: true, message: 'Car listing deleted successfully' };
  } catch (error) {
    console.error('Error deleting car listing:', error);
    throw error;
  }
};
