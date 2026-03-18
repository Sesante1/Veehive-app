import { db } from "@/FirebaseConfig";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Alert, TouchableOpacity } from "react-native";

interface VideoCallButtonProps {
  currentUserId: string;
  currentUserName: string;
  otherUserId: string;
  otherUserName: string;
}

export function VideoCallButton({
  currentUserId,
  currentUserName,
  otherUserId,
  otherUserName,
}: VideoCallButtonProps) {
  const router = useRouter();

  const startCall = async () => {
    try {
      const channelName = [currentUserId, otherUserId].sort().join("_");

      const callRef = await addDoc(collection(db, "calls"), {
        callerId: currentUserId,
        callerName: currentUserName,
        receiverId: otherUserId,
        receiverName: otherUserName,
        channelName,
        status: "ringing",
        createdAt: serverTimestamp(),
      });

      router.push({
        pathname: "/VideoCallScreen",
        params: {
          callId: callRef.id,
          channelName,
          callerId: currentUserId,
          callerName: currentUserName,
          isIncoming: "false",
        },
      });
    } catch (error) {
      console.error("Error starting call:", error);
      Alert.alert("Error", "Failed to start video call");
    }
  };

  return (
    <TouchableOpacity
      onPress={startCall}
      className="bg-white/20 rounded-full p-2"
    >
      <Feather name="video" size={20} color="#fff" />
    </TouchableOpacity>
  );
}