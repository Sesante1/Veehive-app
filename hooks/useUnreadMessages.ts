import { db } from "@/FirebaseConfig";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

/**
 * Hook to get total unread message count for the current user
 * Shows badge on Chat tab when there are unread messages
 */
export const useUnreadMessages = (userId: string | null) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    // Listen to all conversations where user is a participant
    const conversationsRef = collection(db, "conversations");
    const q = query(
      conversationsRef,
      where("participants", "array-contains", userId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let totalUnread = 0;

        snapshot.forEach((doc) => {
          const data = doc.data();
          const unreadCount = data.unreadCount?.[userId] || 0;
          totalUnread += unreadCount;
        });

        setUnreadCount(totalUnread);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching unread messages:", error);
        setUnreadCount(0);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId]);

  return { unreadCount, loading };
};
