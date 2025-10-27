// components/ChatComponent.tsx
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { db } from "@/FirebaseConfig";
import MessageSkeleton from "@/components/MessageSkeleton";
import { useAuth } from "@/hooks/useUser";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import LottieView from "lottie-react-native";

// Types
export type ConversationType = {
  typing?: {
    [userId: string]: boolean;
  };
  id: string;
  participants: string[];
  participantDetails: {
    [userId: string]: {
      name: string;
      username: string;
      avatar: string;
    };
  };
  lastMessage: string;
  lastMessageTime: any;
  time: string;
  createdAt?: any;
};

interface ChatComponentProps {
  initialConversation?: ConversationType | null;
}

const ChatComponent = ({ initialConversation }: ChatComponentProps) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [searchText, setSearchText] = useState("");
  const [conversationsList, setConversationsList] = useState<
    ConversationType[]
  >([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const currentUserId = user?.uid;

  // Use ref to track if component is mounted
  const isMountedRef = useRef(true);

  // Fetch conversations
  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      setConversationsList([]);
      return;
    }

    const conversationsRef = collection(db, "conversations");
    const q = query(
      conversationsRef,
      where("participants", "array-contains", currentUserId),
      orderBy("lastMessageTime", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // Only update state if component is still mounted
        if (!isMountedRef.current) return;

        const conversations: ConversationType[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          conversations.push({
            id: doc.id,
            ...data,
            time: formatTime(data.lastMessageTime),
          } as ConversationType);
        });
        setConversationsList(conversations);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching conversations:", error);
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUserId]);

  // Track component mount/unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return `${Math.floor(diffInHours * 60)}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d`;
    } else {
      return `${Math.floor(diffInHours / 168)}w`;
    }
  };

  const openConversation = (conversationId: string) => {
    router.push({
      pathname: "/ConversationScreen",
      params: { conversationId },
    });
  };

  const getOtherParticipant = (conversation: ConversationType) => {
    const otherParticipantId = conversation.participants.find(
      (id) => id !== currentUserId
    );
    return otherParticipantId
      ? conversation.participantDetails[otherParticipantId]
      : null;
  };

  // Filter conversations based on search text
  const filteredConversations = conversationsList.filter((conversation) => {
    if (!searchText.trim()) return true;

    const otherParticipant = getOtherParticipant(conversation);
    if (!otherParticipant) return false;

    const searchLower = searchText.toLowerCase();
    const nameMatch = otherParticipant.name.toLowerCase().includes(searchLower);
    const usernameMatch = otherParticipant.username
      .toLowerCase()
      .includes(searchLower);
    const messageMatch = conversation.lastMessage
      .toLowerCase()
      .includes(searchLower);

    return nameMatch || usernameMatch || messageMatch;
  });

  if (loading) {
    return <MessageSkeleton />;
  }

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="px-4 py-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-JakartaBold">Messages</Text>
          </View>

          <View className="mt-14">
            <Text className="font-JakartaSemiBold text-lg">
              Log in to view your messages
            </Text>
            <Text className="font-JakartaMedium">Don't miss any updates!</Text>

            <TouchableOpacity
              className="mt-10 p-4 bg-black rounded-lg"
              onPress={() => router.push("/(auth)/signInOrSignUpScreen")}
            >
              <Text className="text-white text-center font-JakartaSemiBold">
                Log In or Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white -mb-14">
      {/* HEADER */}
      <View className="flex-row items-center justify-between px-4 pb-3 mt-6">
        <Text className="text-2xl font-JakartaBold">Messages</Text>
      </View>

      {/* Search Bar - Only show if there are conversations */}
      {conversationsList.length > 0 && (
        <View className="px-4 py-3 border-b border-gray-100">
          <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-2">
            <Feather name="search" size={20} color="#657786" />
            <TextInput
              placeholder="Search for people"
              className="flex-1 ml-3 text-base"
              placeholderTextColor="#657786"
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText("")}>
                <Feather name="x" size={20} color="#657786" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* CONVERSATIONS LIST */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
      >
        {filteredConversations.map((conversation) => {
          const otherParticipant = getOtherParticipant(conversation);
          if (!otherParticipant) return null;

          return (
            <TouchableOpacity
              key={conversation.id}
              className="flex-row items-center p-4 border-b border-gray-50 active:bg-gray-50"
              onPress={() => openConversation(conversation.id)}
            >
              <Image
                source={{ uri: otherParticipant.avatar }}
                className="w-16 h-16 rounded-full mr-3"
              />

              <View className="flex-1">
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center gap-1">
                    <Text className="font-JakartaSemiBold text-gray-900">
                      {otherParticipant.name}
                    </Text>
                    <Text className="text-gray-500 text-sm ml-1">
                      @{otherParticipant.username}
                    </Text>
                  </View>
                  <Text className="text-gray-500 text-sm">
                    {conversation.time}
                  </Text>
                </View>
                <Text className="text-sm text-gray-500" numberOfLines={1}>
                  {conversation.lastMessage}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Show "No results" when search returns nothing */}
        {searchText.trim() && filteredConversations.length === 0 && (
          <View
            className="justify-center items-center px-4"
            style={{ minHeight: 500 }}
          >
            <Feather name="search" size={64} color="#CBD5E0" />
            <Text className="text-2xl font-JakartaBold mt-4">
              No results found
            </Text>
            <Text className="text-base mt-2 font-Jakarta text-center px-7 text-gray-500">
              No conversations match "{searchText}"
            </Text>
          </View>
        )}

        {/* Show empty state when no conversations at all */}
        {conversationsList.length === 0 && (
          <View
            className="justify-center items-center px-4"
            style={{ minHeight: 500 }}
          >
            <LottieView
              source={require("../../../assets/animations/animatedMessage.json")}
              loop={true}
              autoPlay
              style={{ width: 220, height: 220 }}
            />
            <Text className="text-3xl font-JakartaBold">No Messages, yet!</Text>
            <Text className="text-base mt-2 font-Jakarta text-center px-7">
              No messages in your inbox, yet!
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Quick Actions - Only show when there are conversations */}
      {conversationsList.length > 0 && (
        <View className="px-4 py-2 border-t mb-5 border-gray-100 bg-white-50">
          <Text className="text-xs text-gray-500 text-center font-JakartaRegular">
            Tap to open conversation
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default ChatComponent;
