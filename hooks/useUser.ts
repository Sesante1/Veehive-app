import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db, FIREBASE_AUTH } from "../FirebaseConfig";

interface IdentityFile {
  filename: string;
  path: string;
  uploadedAt: string;
  url: string;
}

interface UserData {
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  email?: string;
  phone?: string;
  profileImage?: string;
  identityVerification?: {
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
    const unsubscribe = onAuthStateChanged(
      FIREBASE_AUTH,
      async (currentUser) => {
        if (currentUser) {
          try {
            const docRef = doc(db, "users", currentUser.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
              // setUserData(docSnap.data());
              setUserData(docSnap.data() as UserData);
            } else {
              console.log("No user document found!");
              setUserData(null);
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
          } finally {
            setLoading(false);
          }
        } else {
          setUserData(null);
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
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
