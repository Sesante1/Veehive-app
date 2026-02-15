// services/presenceService.ts
import { db } from "@/FirebaseConfig";
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

export type UserPresence = {
  isOnline: boolean;
  lastSeen: any;
};

/**
 * Set up user presence tracking using Firestore
 * This should be called when the user logs in or app becomes active
 *
 * Note: Firestore doesn't have native onDisconnect like Realtime Database.
 * Disconnection is handled by the usePresence hook via app state changes.
 */
export const setupUserPresence = async (userId: string): Promise<void> => {
  try {
    const userStatusRef = doc(db, "userPresence", userId);

    // Set user as online
    await setDoc(
      userStatusRef,
      {
        isOnline: true,
        lastSeen: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error setting up user presence:", error);
    throw error;
  }
};

/**
 * Update user status to offline
 * This should be called when the user logs out or app goes to background
 */
export const setUserOffline = async (userId: string): Promise<void> => {
  try {
    const userStatusRef = doc(db, "userPresence", userId);
    await updateDoc(userStatusRef, {
      isOnline: false,
      lastSeen: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error setting user offline:", error);
    throw error;
  }
};

/**
 * Subscribe to a user's presence status
 */
export const subscribeToUserPresence = (
  userId: string,
  onUpdate: (presence: UserPresence) => void
): (() => void) => {
  const userStatusRef = doc(db, "userPresence", userId);

  const unsubscribe = onSnapshot(
    userStatusRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onUpdate({
          isOnline: data.isOnline || false,
          lastSeen: data.lastSeen,
        });
      } else {
        // User presence document doesn't exist, assume offline
        onUpdate({
          isOnline: false,
          lastSeen: null,
        });
      }
    },
    (error) => {
      console.error("Error subscribing to user presence:", error);
      onUpdate({
        isOnline: false,
        lastSeen: null,
      });
    }
  );

  return unsubscribe;
};

/**
 * Get user's current presence status (one-time fetch)
 */
export const getUserPresence = async (
  userId: string
): Promise<UserPresence> => {
  try {
    const userStatusRef = doc(db, "userPresence", userId);
    const docSnap = await getDoc(userStatusRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        isOnline: data.isOnline || false,
        lastSeen: data.lastSeen,
      };
    }

    return {
      isOnline: false,
      lastSeen: null,
    };
  } catch (error) {
    console.error("Error getting user presence:", error);
    return {
      isOnline: false,
      lastSeen: null,
    };
  }
};

/**
 * Format last seen timestamp to human-readable string
 */
export const formatLastSeen = (timestamp: any): string => {
  if (!timestamp) return "Offline";

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 1) {
    return "Just now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInMinutes < 1440) {
    return `${Math.floor(diffInMinutes / 60)}h ago`;
  } else {
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  }
};
