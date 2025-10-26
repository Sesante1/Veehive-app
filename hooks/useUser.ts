import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db, FIREBASE_AUTH } from "../FirebaseConfig";

interface IdentityFile {
  filename: string;
  path: string;
  uploadedAt: string;
  url: string;
}

export interface UserData {
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  email?: string;
  phoneNumber?: string;
  profileImage?: string;
  identityVerification?: {
    frontId?: IdentityFile;
    backId?: IdentityFile;
    selfieWithId?: IdentityFile;
  };
  driversLicense?: {
    frontId?: IdentityFile;
    backId?: IdentityFile;
    selfieWithId?: IdentityFile;
    verificationStatus?: "approved" | "pending" | "rejected" | string;
  };
  [key: string]: any;
}

export function useUserData() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to Firebase Auth state
    let unsubscribeDoc: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(FIREBASE_AUTH, (currentUser) => {
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = undefined;
      }

      if (currentUser) {
        const docRef = doc(db, "users", currentUser.uid);

        // Subscribe to Firestore doc in realtime
        unsubscribeDoc = onSnapshot(
          docRef,
          (docSnap) => {
            if (docSnap.exists()) {
              setUserData(docSnap.data() as UserData);
            } else {
              setUserData(null);
            }
            setLoading(false);
          },
          (error) => {
            console.error("Error fetching user data:", error);
            setLoading(false);
          }
        );
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) {
        unsubscribeDoc();
      }
    };
  }, []);

  return { userData, loading };
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (currentUser) => {
      setUser(currentUser); // This is instant, no Firestore call
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
}

export function isDriverLicenseApproved(userData: UserData | null): boolean {
  if (!userData?.driversLicense) {
    return false;
  }

  return userData.driversLicense.verificationStatus === "approved";
}

export function getDriverLicenseStatus(userData: UserData | null): {
  isApproved: boolean;
  isPending: boolean;
  isNotSubmitted: boolean;
  message: string;
} {
  if (!userData?.driversLicense?.verificationStatus) {
    return {
      isApproved: false,
      isPending: false,
      isNotSubmitted: true,
      message: "Please submit your driver's license for verification",
    };
  }

  const status = userData.driversLicense.verificationStatus;

  if (status === "approved") {
    return {
      isApproved: true,
      isPending: false,
      isNotSubmitted: false,
      message: "Driver's license verified",
    };
  }

  if (status === "pending") {
    return {
      isApproved: false,
      isPending: true,
      isNotSubmitted: false,
      message: "Your driver's license verification is pending",
    };
  }

  return {
    isApproved: false,
    isPending: false,
    isNotSubmitted: false,
    message: "Your driver's license verification was rejected. Please resubmit",
  };
}
