// services/chatService.ts
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
  where,
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

    // Create new conversation
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
      createdAt: serverTimestamp(),
      typing: {},
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
    });

    // Update conversation's last message
    await setDoc(
      doc(db, "conversations", conversationId),
      {
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
      },
      { merge: true }
    );
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
    });

    // Update conversation's last message
    await setDoc(
      doc(db, "conversations", conversationId),
      {
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};