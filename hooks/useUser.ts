import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot  } from "firebase/firestore";
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
  };
  [key: string]: any;
}

export function useUserData() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to Firebase Auth state
    const unsubscribeAuth = onAuthStateChanged(
      FIREBASE_AUTH,
      (currentUser) => {
        if (currentUser) {
          const docRef = doc(db, "users", currentUser.uid);

          // Subscribe to Firestore doc in realtime
          const unsubscribeDoc = onSnapshot(
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

          // Cleanup Firestore subscription when auth changes
          return unsubscribeDoc;
        } else {
          setUserData(null);
          setLoading(false);
        }
      }
    );

    return () => unsubscribeAuth();
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
