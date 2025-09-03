import { Feather } from "@expo/vector-icons";
import { useEffect, useState, useRef } from "react";
import {
  Alert,
  Image,
  Modal,
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

// Firebase imports
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
import { db, FIREBASE_AUTH } from "../../../FirebaseConfig";

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
};

const Chat = () => {
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState("");
  const [conversationsList, setConversationsList] = useState<
    ConversationType[]
  >([]);
  const [selectedConversation, setSelectedConversation] =
    useState<ConversationType | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loading, setLoading] = useState(true);

  // Refs for typing indicator
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  const currentUserId = FIREBASE_AUTH.currentUser?.uid;

  // Fetch conversations
  useEffect(() => {
    const conversationsRef = collection(db, "conversations");
    const q = query(
      conversationsRef,
      where("participants", "array-contains", currentUserId),
      orderBy("lastMessageTime", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
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
    });

    return () => unsubscribe();
  }, [currentUserId]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    const messagesRef = collection(db, "messages");
    const q = query(
      messagesRef,
      where("conversationId", "==", selectedConversation.id),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
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
    });

    return () => unsubscribe();
  }, [selectedConversation, currentUserId]);

  // Listen to typing changes in the selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    const conversationRef = doc(db, "conversations", selectedConversation.id);

    const unsubscribe = onSnapshot(conversationRef, (docSnap) => {
      if (docSnap.exists()) {
        const updatedData = docSnap.data();
        setSelectedConversation((prev) => ({
          ...prev!,
          ...updatedData,
        }));
      }
    });

    return () => unsubscribe();
  }, [selectedConversation?.id]);

  // Cleanup typing indicator when component unmounts or conversation changes
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Clear typing indicator when leaving conversation
      if (selectedConversation && currentUserId) {
        updateDoc(doc(db, "conversations", selectedConversation.id), {
          [`typing.${currentUserId}`]: false,
        }).catch(console.error);
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

  const deleteConversation = async (conversationId: string) => {
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
              // Delete all messages in the conversation
              const messagesRef = collection(db, "messages");
              const q = query(
                messagesRef,
                where("conversationId", "==", conversationId)
              );
              const messagesSnapshot = await getDocs(q);

              const deletePromises = messagesSnapshot.docs.map((doc) =>
                deleteDoc(doc.ref)
              );
              await Promise.all(deletePromises);

              // Delete the conversation
              await deleteDoc(doc(db, "conversations", conversationId));
            } catch (error) {
              console.error("Error deleting conversation:", error);
              Alert.alert("Error", "Failed to delete conversation");
            }
          },
        },
      ]
    );
  };

  const openConversation = (conversation: ConversationType) => {
    setSelectedConversation(conversation);
    setIsChatOpen(true);
  };

  const closeChatModal = () => {
    // Clear typing indicator before closing
    if (selectedConversation && currentUserId) {
      updateDoc(doc(db, "conversations", selectedConversation.id), {
        [`typing.${currentUserId}`]: false,
      }).catch(console.error);
    }

    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    setIsChatOpen(false);
    setSelectedConversation(null);
    setNewMessage("");
    setMessages([]);
    isTypingRef.current = false;
  };

  const sendMessage = async () => {
    if (newMessage.trim() && selectedConversation) {
      try {
        const messageData = {
          text: newMessage.trim(),
          senderId: currentUserId,
          conversationId: selectedConversation.id,
          timestamp: serverTimestamp(),
        };

        // Add message to messages collection
        await addDoc(collection(db, "messages"), messageData);

        // Update conversation's last message and clear typing indicator
        const conversationRef = doc(
          db,
          "conversations",
          selectedConversation.id
        );
        await updateDoc(conversationRef, {
          lastMessage: newMessage.trim(),
          lastMessageTime: serverTimestamp(),
          [`typing.${currentUserId}`]: false, // Clear typing when message is sent
        });

        setNewMessage("");
        isTypingRef.current = false;

        // Clear any pending typing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
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
      // If user starts typing and wasn't typing before
      if (isCurrentlyTyping && !isTypingRef.current) {
        isTypingRef.current = true;
        await updateDoc(conversationRef, {
          [`typing.${currentUserId}`]: true,
        });
      }

      // If user stops typing (empty text) and was typing before
      if (!isCurrentlyTyping && isTypingRef.current) {
        isTypingRef.current = false;
        await updateDoc(conversationRef, {
          [`typing.${currentUserId}`]: false,
        });
      }

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to clear typing indicator after 2 seconds of inactivity
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
        }, 2000); // Clear after 2 seconds of no typing
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

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <Text className="text-gray-500">Loading conversations...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* HEADER */}
      <View className="flex-row items-center justify-between px-4 pb-3 mt-6 border-b border-gray-100">
        <Text className="text-2xl font-JakartaBold">Messages</Text>
      </View>

      {/* CONVERSATIONS LIST */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
      >
        {conversationsList.map((conversation) => {
          const otherParticipant = getOtherParticipant(conversation);
          if (!otherParticipant) return null;

          return (
            <TouchableOpacity
              key={conversation.id}
              className="flex-row items-center p-4 border-b border-gray-50 active:bg-gray-50"
              onPress={() => openConversation(conversation)}
              onLongPress={() => deleteConversation(conversation.id)}
            >
              <Image
                source={{ uri: otherParticipant.avatar }}
                className="size-12 rounded-full mr-3"
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

        {conversationsList.length === 0 && (
          <View className="flex-1 justify-center items-center py-20">
            <Feather name="message-circle" size={64} color="#E5E7EB" />
            <Text className="text-gray-500 mt-4 text-center">
              No conversations yet
            </Text>
            <Text className="text-gray-400 text-sm text-center mt-1">
              Start a new conversation to see it here
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Quick Actions */}
      <View className="px-4 py-2 border-t mb-10 border-gray-100 bg-white-50">
        <Text className="text-xs text-gray-500 text-center font-JakartaRegular">
          Tap to open • Long press to delete
        </Text>
      </View>

      {/* Chat Modal */}
      <Modal
        visible={isChatOpen}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {selectedConversation && (
          <SafeAreaView className="flex-1">
            {/* Chat Header */}
            <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
              <TouchableOpacity onPress={closeChatModal} className="mr-3">
                <Feather name="arrow-left" size={24} color="#1DA1F2" />
              </TouchableOpacity>
              {(() => {
                const otherParticipant =
                  getOtherParticipant(selectedConversation);
                if (!otherParticipant) return null;

                return (
                  <>
                    <Image
                      source={{ uri: otherParticipant.avatar }}
                      className="size-10 rounded-full mr-3"
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
            <ScrollView
              className="flex-1 px-4 py-4"
              ref={(ref) => {
                // Auto-scroll to bottom when new messages arrive
                if (ref && messages.length > 0) {
                  setTimeout(() => ref.scrollToEnd({ animated: true }), 100);
                }
              }}
            >
              <View className="mb-4">
                {(() => {
                  const otherParticipant =
                    getOtherParticipant(selectedConversation);
                  return (
                    <Text className="text-center text-gray-400 text-sm mb-4 font-JakartaRegular">
                      This is the beginning of your conversation with{" "}
                      {otherParticipant?.name}
                    </Text>
                  );
                })()}

                {/* Conversation Messages */}
                {messages.map((message) => {
                  const otherParticipant =
                    getOtherParticipant(selectedConversation);

                  return (
                    <View
                      key={message.id}
                      className={`flex-row mb-3 ${message.fromUser ? "justify-end" : ""}`}
                    >
                      {!message.fromUser && otherParticipant && (
                        <Image
                          source={{ uri: otherParticipant.avatar }}
                          className="size-8 rounded-full mr-2"
                        />
                      )}
                      <View
                        className={`flex-1 ${message.fromUser ? "items-end" : ""}`}
                      >
                        <View
                          className={`rounded-2xl px-4 py-3 max-w-xs ${
                            message.fromUser ? "bg-blue-500" : "bg-gray-100"
                          }`}
                        >
                          <Text
                            className={
                              message.fromUser ? "text-white" : "text-gray-900"
                            }
                            style={{ fontFamily: "Jakarta" }}
                          >
                            {message.text}
                          </Text>
                        </View>
                        <Text className="text-xs text-gray-400 mt-1">
                          {message.time}
                        </Text>
                      </View>
                    </View>
                  );
                })}

                {/* Typing indicator */}
                {(() => {
                  const otherParticipantId =
                    selectedConversation?.participants.find(
                      (id) => id !== currentUserId
                    );

                  if (
                    otherParticipantId &&
                    selectedConversation?.typing?.[otherParticipantId]
                  ) {
                    const otherParticipant = getOtherParticipant(selectedConversation);
                    return (
                      <View className="flex-row items-center mb-3">
                        {otherParticipant && (
                          <Image
                            source={{ uri: otherParticipant.avatar }}
                            className="size-8 rounded-full mr-2"
                          />
                        )}
                        <View className="bg-gray-100 rounded-2xl px-4 py-3">
                          <Text className="text-gray-500 text-sm italic">
                            {otherParticipant?.name} is typing...
                          </Text>
                        </View>
                      </View>
                    );
                  }
                  return null;
                })()}
              </View>
            </ScrollView>

            {/* Message Input */}
            <View className="flex-row items-center px-4 py-3 border-t border-gray-100">
              <View className="flex-1 flex-row items-center bg-gray-100 rounded-full px-4 py-1 mr-3">
                <TextInput
                  className="flex-1 text-base"
                  placeholder="Start a message..."
                  placeholderTextColor="#657786"
                  value={newMessage}
                  onChangeText={handleTextChange}
                  multiline
                  onSubmitEditing={sendMessage}
                  returnKeyType="send"
                />
              </View>
              <TouchableOpacity
                onPress={sendMessage}
                className={`size-10 rounded-full items-center justify-center ${
                  newMessage.trim() ? "bg-blue-500" : "bg-gray-300"
                }`}
                disabled={!newMessage.trim()}
              >
                <Feather name="send" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
};

export default Chat;