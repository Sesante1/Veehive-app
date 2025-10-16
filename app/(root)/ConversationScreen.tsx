// app/(root)/ConversationScreen.tsx
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  Keyboard,
  Animated,
  EmitterSubscription,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";

import { db } from "@/FirebaseConfig";
import { useAuth } from "@/hooks/useUser";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

// Types
export type MessageType = {
  id: string;
  text: string;
  fromUser: boolean;
  timestamp: any;
  time: string;
  senderId: string;
  conversationId: string;
};

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

const ConversationScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { conversationId } = useLocalSearchParams<{
    conversationId: string;
  }>();

  const [selectedConversation, setSelectedConversation] =
    useState<ConversationType | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loading, setLoading] = useState(true);

  // Keyboard handling
  const keyboardHeight = useRef(new Animated.Value(0)).current;
  const listRef = useRef<FlashList<any>>(null);

  // Refs for typing indicator
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const { user } = useAuth();
  const currentUserId = user?.uid;

  // Keyboard listeners
  useEffect(() => {
    let keyboardWillShow: EmitterSubscription;
    let keyboardWillHide: EmitterSubscription;
    let keyboardDidShow: EmitterSubscription;
    let keyboardDidHide: EmitterSubscription;

    if (Platform.OS === 'ios') {
      keyboardWillShow = Keyboard.addListener('keyboardWillShow', (e) => {
        Animated.timing(keyboardHeight, {
          toValue: e.endCoordinates.height - insets.bottom,
          duration: e.duration,
          useNativeDriver: false,
        }).start();
      });

      keyboardWillHide = Keyboard.addListener('keyboardWillHide', (e) => {
        Animated.timing(keyboardHeight, {
          toValue: 0,
          duration: e.duration,
          useNativeDriver: false,
        }).start();
      });
    } else {
      keyboardDidShow = Keyboard.addListener('keyboardDidShow', (e) => {
        Animated.timing(keyboardHeight, {
          toValue: e.endCoordinates.height,
          duration: 250,
          useNativeDriver: false,
        }).start();
      });

      keyboardDidHide = Keyboard.addListener('keyboardDidHide', () => {
        Animated.timing(keyboardHeight, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }).start();
      });
    }

    return () => {
      if (Platform.OS === 'ios') {
        keyboardWillShow?.remove();
        keyboardWillHide?.remove();
      } else {
        keyboardDidShow?.remove();
        keyboardDidHide?.remove();
      }
    };
  }, [insets.bottom]);

  // Single listener for conversation (replaces the two separate listeners)
  useEffect(() => {
    if (!conversationId) return;

    const conversationRef = doc(db, "conversations", conversationId as string);

    const unsubscribe = onSnapshot(
      conversationRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSelectedConversation({
            id: docSnap.id,
            ...data,
          } as ConversationType);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to conversation:", error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [conversationId]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!conversationId) return;

    const messagesRef = collection(db, "messages");
    const q = query(
      messagesRef,
      where("conversationId", "==", conversationId as string),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messagesList: MessageType[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          messagesList.push({
            id: doc.id,
            ...data,
            fromUser: data.senderId === currentUserId,
            time: formatTime(data.timestamp),
          } as MessageType);
        });
        setMessages(messagesList);

        // Auto-scroll to bottom
        setTimeout(() => {
          if (listRef.current && messagesList.length > 0) {
            listRef.current.scrollToEnd({ animated: true });
          }
        }, 100);
      },
      (error) => {
        console.error("Error fetching messages:", error);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [conversationId, currentUserId]);

  // Cleanup typing indicator when component unmounts
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (selectedConversation && currentUserId) {
        updateDoc(doc(db, "conversations", selectedConversation.id), {
          [`typing.${currentUserId}`]: false,
        }).catch((error) => {
          console.error("Error clearing typing on unmount:", error);
        });
      }
    };
  }, [selectedConversation?.id, currentUserId]);

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

  const deleteConversation = async () => {
    Alert.alert(
      "Delete Conversation",
      "Are you sure you want to delete this conversation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (!conversationId) return;

              const messagesRef = collection(db, "messages");
              const q = query(
                messagesRef,
                where("conversationId", "==", conversationId as string)
              );
              const messagesSnapshot = await getDocs(q);

              const deletePromises = messagesSnapshot.docs.map((doc) =>
                deleteDoc(doc.ref)
              );
              await Promise.all(deletePromises);

              await deleteDoc(
                doc(db, "conversations", conversationId as string)
              );

              router.back();
            } catch (error) {
              console.error("Error deleting conversation:", error);
              Alert.alert("Error", "Failed to delete conversation");
            }
          },
        },
      ]
    );
  };

  const sendMessage = async () => {
    if (newMessage.trim() && selectedConversation && currentUserId) {
      try {
        const messageData = {
          text: newMessage.trim(),
          senderId: currentUserId,
          conversationId: selectedConversation.id,
          timestamp: serverTimestamp(),
        };

        await addDoc(collection(db, "messages"), messageData);

        const conversationRef = doc(
          db,
          "conversations",
          selectedConversation.id
        );
        await updateDoc(conversationRef, {
          lastMessage: newMessage.trim(),
          lastMessageTime: serverTimestamp(),
          [`typing.${currentUserId}`]: false,
        });

        setNewMessage("");
        isTypingRef.current = false;

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // Scroll to bottom after sending
        setTimeout(() => {
          listRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } catch (error) {
        console.error("Error sending message:", error);
        Alert.alert("Error", "Failed to send message");
      }
    }
  };

  const handleTextChange = async (text: string) => {
    setNewMessage(text);

    if (!selectedConversation || !currentUserId) return;

    const isCurrentlyTyping = text.length > 0;
    const conversationRef = doc(db, "conversations", selectedConversation.id);

    try {
      if (isCurrentlyTyping && !isTypingRef.current) {
        isTypingRef.current = true;
        await updateDoc(conversationRef, {
          [`typing.${currentUserId}`]: true,
        });
      }

      if (!isCurrentlyTyping && isTypingRef.current) {
        isTypingRef.current = false;
        await updateDoc(conversationRef, {
          [`typing.${currentUserId}`]: false,
        });
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (isCurrentlyTyping) {
        typingTimeoutRef.current = setTimeout(async () => {
          if (isTypingRef.current) {
            isTypingRef.current = false;
            try {
              await updateDoc(conversationRef, {
                [`typing.${currentUserId}`]: false,
              });
            } catch (error) {
              console.error("Error clearing typing indicator:", error);
            }
          }
        }, 2000);
      }
    } catch (error) {
      console.error("Error updating typing indicator:", error);
    }
  };

  const getOtherParticipant = (conversation: ConversationType) => {
    const otherParticipantId = conversation.participants.find(
      (id) => id !== currentUserId
    );
    return otherParticipantId
      ? conversation.participantDetails[otherParticipantId]
      : null;
  };

  const renderMessage = ({ item: message }: { item: MessageType }) => {
    const otherParticipant = selectedConversation
      ? getOtherParticipant(selectedConversation)
      : null;

    return (
      <View
        className={`flex-row mb-3 px-4 ${message.fromUser ? "justify-end" : ""}`}
      >
        {!message.fromUser && otherParticipant && (
          <Image
            source={{ uri: otherParticipant.avatar }}
            className="w-10 h-10 rounded-full mr-2"
          />
        )}
        <View className={`flex ${message.fromUser ? "items-end" : ""}`}>
          <View
            className={`rounded-2xl px-4 py-3 max-w-xs ${
              message.fromUser ? "bg-blue-500" : "bg-gray-100"
            }`}
          >
            <Text
              className={message.fromUser ? "text-white" : "text-gray-900"}
              style={{ fontFamily: "Jakarta" }}
            >
              {message.text}
            </Text>
          </View>
          <Text className="text-xs text-gray-400 mt-1">{message.time}</Text>
        </View>
      </View>
    );
  };

  const ListHeader = () => {
    const otherParticipant = selectedConversation
      ? getOtherParticipant(selectedConversation)
      : null;

    return (
      <Text className="text-center text-gray-400 text-sm mb-4 mt-4 px-4 font-JakartaRegular">
        This is the beginning of your conversation with {otherParticipant?.name}
      </Text>
    );
  };

  const ListFooter = () => {
    const otherParticipantId = selectedConversation?.participants.find(
      (id) => id !== currentUserId
    );

    if (
      !otherParticipantId ||
      !selectedConversation?.typing?.[otherParticipantId]
    ) {
      return null;
    }

    const otherParticipant = getOtherParticipant(selectedConversation);

    return (
      <View className="flex-row items-center mb-3 px-4">
        {otherParticipant && (
          <Image
            source={{ uri: otherParticipant.avatar }}
            className="w-8 h-8 rounded-full mr-2"
          />
        )}
        <View className="bg-gray-100 rounded-2xl px-4 py-3">
          <Text className="text-gray-500 text-sm italic">
            {otherParticipant?.name} is typing...
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <Text>Loading conversation...</Text>
      </SafeAreaView>
    );
  }

  if (!selectedConversation) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <Text>Conversation not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="flex-1">
        {/* Chat Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-gray-100 bg-white">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Feather name="arrow-left" size={24} color="#1DA1F2" />
          </TouchableOpacity>
          {(() => {
            const otherParticipant = getOtherParticipant(selectedConversation);
            if (!otherParticipant) return null;

            return (
              <>
                <Image
                  source={{ uri: otherParticipant.avatar }}
                  className="w-10 h-10 rounded-full mr-3"
                />
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Text className="font-JakartaSemiBold text-gray-900 mr-1">
                      {otherParticipant.name}
                    </Text>
                  </View>
                  <Text className="text-gray-500 text-sm">
                    @{otherParticipant.username}
                  </Text>
                </View>
              </>
            );
          })()}
        </View>

        {/* Chat Messages Area */}
        <View className="flex-1">
          <FlashList
            ref={listRef}
            data={messages}
            renderItem={renderMessage}
            estimatedItemSize={80}
            ListHeaderComponent={ListHeader}
            ListFooterComponent={ListFooter}
            keyExtractor={(item) => item.id}
            onContentSizeChange={() => {
              if (messages.length > 0) {
                listRef.current?.scrollToEnd({ animated: true });
              }
            }}
            keyboardShouldPersistTaps="handled"
          />
        </View>

        {/* Message Input - Now with Animated positioning */}
        <Animated.View
          className="border-t border-gray-100 bg-white"
          style={{ 
            transform: [{ translateY: Animated.multiply(keyboardHeight, -1) }]
          }}
        >
          <View
            className="flex-row items-center px-4 py-3"
            style={{ paddingBottom: Math.max(insets.bottom, 12) }}
          >
            <View className="flex-1 flex-row items-center bg-gray-100 rounded-full px-4 mr-3">
              <TextInput
                className="flex-1 text-base py-2.5"
                placeholder="Start a message..."
                placeholderTextColor="#657786"
                value={newMessage}
                onChangeText={handleTextChange}
                multiline
                maxLength={500}
                style={{ minHeight: 40, maxHeight: 100 }}
              />
            </View>
            <TouchableOpacity
              onPress={sendMessage}
              className={`w-10 h-10 rounded-full items-center justify-center ${
                newMessage.trim() ? "bg-blue-500" : "bg-gray-300"
              }`}
              disabled={!newMessage.trim()}
            >
              <Feather name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

export default ConversationScreen;