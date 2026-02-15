// components/OnlineIndicator.tsx
import {
  formatLastSeen,
  subscribeToUserPresence,
  UserPresence,
} from "@/services/presenceService";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

interface OnlineIndicatorProps {
  userId: string;
  showText?: boolean;
  size?: "small" | "medium" | "large";
  className?: string;
}

/**
 * Component to display a user's online status
 * Can show just the dot indicator or include "Active now" text
 */
const OnlineIndicator = ({
  userId,
  showText = false,
  size = "small",
  className = "",
}: OnlineIndicatorProps) => {
  const [presence, setPresence] = useState<UserPresence>({
    isOnline: false,
    lastSeen: null,
  });

  useEffect(() => {
    const unsubscribe = subscribeToUserPresence(userId, (newPresence) => {
      setPresence(newPresence);
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  const sizeClasses = {
    small: "w-2.5 h-2.5",
    medium: "w-3 h-3",
    large: "w-4 h-4",
  };

  if (!presence.isOnline && !showText) {
    return null; // Don't show anything if offline and text is not requested
  }

  return (
    <View className={`flex-row items-center ${className}`}>
      {presence.isOnline && (
        <View
          className={`${sizeClasses[size]} rounded-full bg-green-500 border-2 border-white`}
        />
      )}
      {showText && (
        <Text className="text-xs text-gray-500 ml-1">
          {presence.isOnline ? "Active now" : formatLastSeen(presence.lastSeen)}
        </Text>
      )}
    </View>
  );
};

export default OnlineIndicator;
