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

// Create a new user document
export const createUser = async (
  userId: string,
  userData: {
    name: string;
    username: string;
    avatar: string;
    email: string;
  }
) => {
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

// Get user data
export const getUser = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    console.error("Error getting user:", error);
    throw error;
  }
};

// Create a new conversation
export const createConversation = async (
  currentUserId: string,
  otherUserId: string,
  currentUserData: any,
  otherUserData: any
): Promise<{ id: string; created: boolean }> => {
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
        return { id: doc.id, created: false }; // existing conversation
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
    };

    const docRef = await addDoc(
      collection(db, "conversations"),
      conversationData
    );
    return { id: docRef.id, created: true }; // new conversation
  } catch (error) {
    console.error("Error creating conversation:", error);
    throw error;
  }
};

// Send initial message to start convo
export const sendInitialMessage = async (
  conversationId: string,
  senderId: string,
  text: string
) => {
  try {
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
