import { getUser, createConversation } from "@/services/chatService";
import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { useAuth } from "./useUser";

export const useDirectConversation = () => {
  const router = useRouter();
  const { user } = useAuth();

  const openDirectConversation = async (otherUserId: string, itemName?: string) => {
    const currentUserId = user?.uid;

    if (!currentUserId) {
      Alert.alert("Error", "You must be logged in");
      return;
    }

    if (currentUserId === otherUserId) {
      Alert.alert("Error", "You cannot message yourself");
      return;
    }

    try {
      const currentUserData = await getUser(currentUserId);
      const otherUserData = await getUser(otherUserId);

      if (!currentUserData || !otherUserData) {
        Alert.alert("Error", "Failed to load user information");
        return;
      }

      const { id: conversationId } = await createConversation(
        currentUserId,
        otherUserId,
        currentUserData,
        otherUserData
      );

      router.push({
        pathname: "/ConversationScreen",
        params: { conversationId },
      });
    } catch (error) {
      console.error("Error opening conversation:", error);
      Alert.alert("Error", "Failed to open conversation");
    }
  };

  return { openDirectConversation };
};