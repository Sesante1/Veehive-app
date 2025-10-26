import { db, storage } from "@/FirebaseConfig";
import {
  deleteField,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

// USER PROFILE UPDATES

// Update user's legal name
export async function updateUserName(
  id: string,
  firstName: string,
  lastName: string
) {
  try {
    const userRef = doc(db, "users", id);
    await updateDoc(userRef, {
      firstName,
      lastName,
      updatedAt: serverTimestamp(),
    });
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
      updatedAt: serverTimestamp(),
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
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error updating phone verification:", error.message);
    return { success: false, error: error.message };
  }
}

// DOCUMENT TYPES & INTERFACES

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
  expirationDate?: string;
  verificationStatus?: "pending" | "approved" | "declined";
  submittedAt?: string;
}

export interface DriversLicenseDocuments {
  frontLicense?: IdentityDocument;
  backLicense?: IdentityDocument;
  selfieWithLicense?: IdentityDocument;
  expirationDate?: string;
  verificationStatus?: "pending" | "approved" | "declined";
  submittedAt?: string;
}

export type IdentityDocType = "frontId" | "backId" | "selfieWithId";
export type DriversLicenseDocType =
  | "frontLicense"
  | "backLicense"
  | "selfieWithLicense";

// IDENTITY VERIFICATION FUNCTIONS

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
  try {
    await deleteObject(storageRef);
  } catch (error: any) {
    // Ignore if file doesn't exist; proceed to clean up Firestore
    if (error.code !== "storage/object-not-found") {
      throw error;
    }
  }

  // Update Firestore (remove the field)
  const userDocRef = doc(db, "users", userId);
  await updateDoc(userDocRef, {
    [`identityVerification.${docType}`]: deleteField(),
    updatedAt: serverTimestamp(),
  });
};

// Submit identity verification with expiration date
export const submitIdentityVerification = async (
  userId: string,
  expirationDate: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const userDocRef = doc(db, "users", userId);

    await updateDoc(userDocRef, {
      "identityVerification.expirationDate": expirationDate,
      "identityVerification.verificationStatus": "pending",
      "identityVerification.submittedAt": new Date().toISOString(),
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error submitting identity verification:", error.message);
    return { success: false, error: error.message };
  }
};

// Update identity verification status (Admin function)
export const updateIdentityVerificationStatus = async (
  userId: string,
  status: "approved" | "declined",
  adminNote?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const userDocRef = doc(db, "users", userId);

    const updateData: any = {
      "identityVerification.verificationStatus": status,
      "identityVerification.reviewedAt": new Date().toISOString(),
      updatedAt: serverTimestamp(),
    };

    if (adminNote) {
      updateData["identityVerification.adminNote"] = adminNote;
    }

    await updateDoc(userDocRef, updateData);

    return { success: true };
  } catch (error: any) {
    console.error("Error updating verification status:", error.message);
    return { success: false, error: error.message };
  }
};

// DRIVER'S LICENSE VERIFICATION FUNCTIONS

// Upload driver's license document to Firebase Storage and update Firestore
export const uploadDriversLicenseDocument = async (
  imageUri: string,
  docType: DriversLicenseDocType,
  userId: string
): Promise<IdentityDocument> => {
  const timestamp = Date.now();

  // Generate filename based on document type
  let filename: string;
  switch (docType) {
    case "frontLicense":
      filename = `front_license_${timestamp}.jpg`;
      break;
    case "backLicense":
      filename = `back_license_${timestamp}.jpg`;
      break;
    case "selfieWithLicense":
      filename = `selfie_${timestamp}.jpg`;
      break;
  }

  const storagePath = `users/${userId}/drivers_license/${filename}`;
  const storageRef = ref(storage, storagePath);

  // Upload image to Firebase Storage
  const response = await fetch(imageUri);
  const blob = await response.blob();

  await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
  const downloadURL = await getDownloadURL(storageRef);

  // Update Firestore
  const userDocRef = doc(db, "users", userId);
  const updateData = {
    [`driversLicense.${docType}`]: {
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

// Remove driver's license document from Firebase Storage and Firestore
export const removeDriversLicenseDocument = async (
  docType: DriversLicenseDocType,
  userId: string,
  document: IdentityDocument
): Promise<void> => {
  if (!document?.filename) {
    throw new Error("Document filename missing");
  }

  // Build storage path
  const storagePath = `users/${userId}/drivers_license/${document.filename}`;
  const storageRef = ref(storage, storagePath);

  // Delete from Firebase Storage
  try {
    await deleteObject(storageRef);
  } catch (error: any) {
    // Ignore if file doesn't exist; proceed to clean up Firestore
    if (error.code !== "storage/object-not-found") {
      throw error;
    }
  }

  // Update Firestore (remove the field)
  const userDocRef = doc(db, "users", userId);
  await updateDoc(userDocRef, {
    [`driversLicense.${docType}`]: deleteField(),
    updatedAt: serverTimestamp(),
  });
};

// Submit driver's license verification with expiration date
export const submitDriversLicenseVerification = async (
  userId: string,
  expirationDate: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const userDocRef = doc(db, "users", userId);

    await updateDoc(userDocRef, {
      "driversLicense.expirationDate": expirationDate,
      "driversLicense.verificationStatus": "pending",
      "driversLicense.submittedAt": new Date().toISOString(),
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    console.error(
      "Error submitting driver's license verification:",
      error.message
    );
    return { success: false, error: error.message };
  }
};

// Update driver's license verification status (Admin function)
export const updateDriversLicenseVerificationStatus = async (
  userId: string,
  status: "approved" | "declined",
  adminNote?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const userDocRef = doc(db, "users", userId);

    const updateData: any = {
      "driversLicense.verificationStatus": status,
      "driversLicense.reviewedAt": new Date().toISOString(),
      updatedAt: serverTimestamp(),
    };

    if (adminNote) {
      updateData["driversLicense.adminNote"] = adminNote;
    }

    await updateDoc(userDocRef, updateData);

    return { success: true };
  } catch (error: any) {
    console.error("Error updating verification status:", error.message);
    return { success: false, error: error.message };
  }
};
