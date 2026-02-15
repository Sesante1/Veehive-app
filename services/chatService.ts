// services/chatService.ts - ENHANCED VERSION
import { db } from "@/FirebaseConfig";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

export type UserData = {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage: string;
  createdAt?: any;
};

export type ConversationCreateResponse = {
  id: string;
  created: boolean;
};

export const createUser = async (
  userId: string,
  userData: {
    firstName: string;
    lastName: string;
    email: string;
    profileImage: string;
  }
): Promise<void> => {
  try {
    await setDoc(doc(db, "users", userId), {
      ...userData,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const getUser = async (userId: string): Promise<UserData | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return {
        id: userDoc.id,
        ...userDoc.data(),
      } as UserData;
    }
    return null;
  } catch (error) {
    console.error("Error getting user:", error);
    throw error;
  }
};

export const createConversation = async (
  currentUserId: string,
  otherUserId: string,
  currentUserData: UserData,
  otherUserData: UserData
): Promise<ConversationCreateResponse> => {
  try {
    // Check if conversation already exists
    const conversationsRef = collection(db, "conversations");
    const q = query(
      conversationsRef,
      where("participants", "array-contains", currentUserId)
    );

    const querySnapshot = await getDocs(q);

    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      if (data.participants && data.participants.includes(otherUserId)) {
        return { id: doc.id, created: false };
      }
    }

    // Create new conversation with unread counts
    const conversationData = {
      participants: [currentUserId, otherUserId],
      participantDetails: {
        [currentUserId]: {
          name: `${currentUserData.firstName} ${currentUserData.lastName}`,
          username: currentUserData.email,
          avatar: currentUserData.profileImage,
        },
        [otherUserId]: {
          name: `${otherUserData.firstName} ${otherUserData.lastName}`,
          username: otherUserData.email,
          avatar: otherUserData.profileImage,
        },
      },
      lastMessage: "",
      lastMessageTime: serverTimestamp(),
      lastMessageSenderId: "", // Track who sent the last message
      createdAt: serverTimestamp(),
      typing: {},
      // Unread count for each participant
      unreadCount: {
        [currentUserId]: 0,
        [otherUserId]: 0,
      },
    };

    const docRef = await addDoc(
      collection(db, "conversations"),
      conversationData
    );
    return { id: docRef.id, created: true };
  } catch (error) {
    console.error("Error creating conversation:", error);
    throw error;
  }
};

export const sendInitialMessage = async (
  conversationId: string,
  senderId: string,
  text: string
): Promise<void> => {
  try {
    // Add message to messages collection
    await addDoc(collection(db, "messages"), {
      text,
      senderId,
      conversationId,
      timestamp: serverTimestamp(),
      read: false, // Track if message has been read
    });

    // Update conversation's last message and increment unread count for receiver
    const conversationRef = doc(db, "conversations", conversationId);
    const conversationSnap = await getDoc(conversationRef);

    if (conversationSnap.exists()) {
      const data = conversationSnap.data();
      const participants = data.participants as string[];
      const otherUserId = participants.find((id) => id !== senderId);

      if (otherUserId) {
        await updateDoc(conversationRef, {
          lastMessage: text,
          lastMessageTime: serverTimestamp(),
          lastMessageSenderId: senderId,
          [`unreadCount.${otherUserId}`]:
            (data.unreadCount?.[otherUserId] || 0) + 1,
        });
      }
    }
  } catch (error) {
    console.error("Error sending initial message:", error);
    throw error;
  }
};

export const sendMessage = async (
  conversationId: string,
  senderId: string,
  text: string
): Promise<void> => {
  try {
    // Add message to messages collection
    await addDoc(collection(db, "messages"), {
      text,
      senderId,
      conversationId,
      timestamp: serverTimestamp(),
      read: false,
    });

    // Update conversation's last message and increment unread count for receiver
    const conversationRef = doc(db, "conversations", conversationId);
    const conversationSnap = await getDoc(conversationRef);

    if (conversationSnap.exists()) {
      const data = conversationSnap.data();
      const participants = data.participants as string[];
      const otherUserId = participants.find((id) => id !== senderId);

      if (otherUserId) {
        await updateDoc(conversationRef, {
          lastMessage: text,
          lastMessageTime: serverTimestamp(),
          lastMessageSenderId: senderId,
          [`unreadCount.${otherUserId}`]:
            (data.unreadCount?.[otherUserId] || 0) + 1,
        });
      }
    }
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

/**
 * Mark all messages in a conversation as read for the current user
 */
export const markConversationAsRead = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  try {
    // Reset unread count for this user
    const conversationRef = doc(db, "conversations", conversationId);
    await updateDoc(conversationRef, {
      [`unreadCount.${userId}`]: 0,
    });

    // Mark all unread messages as read (optional - for message-level tracking)
    const messagesRef = collection(db, "messages");
    const q = query(
      messagesRef,
      where("conversationId", "==", conversationId),
      where("read", "==", false),
      where("senderId", "!=", userId) // Only mark others' messages as read
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });

    await batch.commit();
  } catch (error) {
    console.error("Error marking conversation as read:", error);
    throw error;
  }
};
