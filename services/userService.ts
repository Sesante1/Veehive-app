import { db, storage } from "@/FirebaseConfig";
import { deleteField, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

// Update user's legal name
export async function updateUserName(
  id: string,
  firstName: string,
  lastName: string
) {
  try {
    const userRef = doc(db, "users", id);
    await updateDoc(userRef, { firstName, lastName, updatedAt: new Date() });
    return { success: true };
  } catch (error: any) {
    console.error("Error updating user name:", error.message);
    return { success: false, error: error.message };
  }
}

// Update user's address
export async function updateAddress(
  id: string,
  location: string,
  latitude: number,
  longitude: number
) {
  try {
    const userRef = doc(db, "users", id);
    await updateDoc(userRef, {
      address: location,
      latitude,
      longitude,
      updatedAt: new Date(),
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error updating address:", error.message);
    return { success: false, error: error.message };
  }
}

// Mark user as phone-verified
export async function updatePhoneVerified(id: string, phoneNumber: string) {
  try {
    const userRef = doc(db, "users", id);
    await updateDoc(userRef, {
      phoneNumber,
      phoneVerified: true,
      updatedAt: new Date(),
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error updating phone verification:", error.message);
    return { success: false, error: error.message };
  }
}



// Identity verification process
export interface IdentityDocument {
  filename: string;
  uploadedAt: string;
  url: string;
  path?: string;
}

export interface IdentityDocuments {
  frontId?: IdentityDocument;
  backId?: IdentityDocument;
  selfieWithId?: IdentityDocument;
}

export type IdentityDocType = "frontId" | "backId" | "selfieWithId";


// Upload identity verification document to Firebase Storage and update Firestore
 
export const uploadIdentityDocument = async (
  imageUri: string,
  docType: IdentityDocType,
  userId: string
): Promise<IdentityDocument> => {
  const timestamp = Date.now();

  // Generate filename based on document type
  let filename: string;
  switch (docType) {
    case "frontId":
      filename = `front_id_${timestamp}.jpg`;
      break;
    case "backId":
      filename = `back_id_${timestamp}.jpg`;
      break;
    case "selfieWithId":
      filename = `selfie_${timestamp}.jpg`;
      break;
  }

  const storagePath = `users/${userId}/identity/${filename}`;
  const storageRef = ref(storage, storagePath);

  // Upload image to Firebase Storage
  const response = await fetch(imageUri);
  const blob = await response.blob();

  await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
  const downloadURL = await getDownloadURL(storageRef);

  // Update Firestore
  const userDocRef = doc(db, "users", userId);
  const updateData = {
    [`identityVerification.${docType}`]: {
      url: downloadURL,
      filename,
      uploadedAt: new Date().toISOString(),
      path: storagePath,
    },
    updatedAt: serverTimestamp(),
  };

  await updateDoc(userDocRef, updateData);

  return {
    url: downloadURL,
    filename,
    uploadedAt: new Date().toISOString(),
    path: storagePath,
  };
};


// Remove identity verification document from Firebase Storage and Firestore
 
export const removeIdentityDocument = async (
  docType: IdentityDocType,
  userId: string,
  document: IdentityDocument
): Promise<void> => {
  if (!document?.filename) {
    throw new Error("Document filename missing");
  }

  // Build storage path
  const storagePath = `users/${userId}/identity/${document.filename}`;
  const storageRef = ref(storage, storagePath);

  // Delete from Firebase Storage
  await deleteObject(storageRef);

  // Update Firestore (remove the field)
  const userDocRef = doc(db, "users", userId);
  await updateDoc(userDocRef, {
    [`identityVerification.${docType}`]: deleteField(),
    updatedAt: serverTimestamp(),
  });
};