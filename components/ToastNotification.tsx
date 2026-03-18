import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type ToastType = "booking" | "payment" | "cancel" | "message" | "review";

export interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  avatarUrl?: string;
  onPress?: () => void;
}

interface ToastNotificationProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const TOAST_CONFIG: Record<
  ToastType,
  { bg: string; iconBg: string; accent: string; emoji: string }
> = {
  booking:  { bg: "#EFF6FF", iconBg: "#DBEAFE", accent: "#2563EB", emoji: "📅" },
  payment:  { bg: "#F0FDF4", iconBg: "#DCFCE7", accent: "#16A34A", emoji: "💰" },
  cancel:   { bg: "#FFF1F2", iconBg: "#FFE4E6", accent: "#DC2626", emoji: "✕"  },
  message:  { bg: "#FAF5FF", iconBg: "#EDE9FE", accent: "#7C3AED", emoji: "💬" },
  review:   { bg: "#FFFBEB", iconBg: "#FEF9C3", accent: "#D97706", emoji: "⭐" },
};

const AUTO_DISMISS_MS = 4000;

export default function ToastNotification({ toast, onDismiss }: ToastNotificationProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const cfg = TOAST_CONFIG[toast.type];

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 14,
        stiffness: 180,
        mass: 0.8,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => dismiss(), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss(toast.id));
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 8,
          transform: [{ translateY }],
          opacity,
          backgroundColor: cfg.bg,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => {
          dismiss();
          toast.onPress?.();
        }}
        style={styles.touchable}
      >
        {/* Icon / Avatar */}
        <View style={[styles.iconWrap, { backgroundColor: cfg.iconBg }]}>
          {toast.avatarUrl ? (
            <Image source={{ uri: toast.avatarUrl }} style={styles.avatar} />
          ) : (
            <Text style={styles.emoji}>{cfg.emoji}</Text>
          )}
        </View>

        {/* Text */}
        <View style={styles.textWrap}>
          <Text style={[styles.title, { color: cfg.accent }]} numberOfLines={1}>
            {toast.title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {toast.message}
          </Text>
        </View>

        {/* Dismiss dot */}
        <TouchableOpacity onPress={dismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <View style={[styles.dismissDot, { backgroundColor: cfg.accent }]} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 12,
    right: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 9999,
  },
  touchable: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  emoji: {
    fontSize: 16,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 1,
  },
  message: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
  },
  dismissDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    opacity: 0.4,
    flexShrink: 0,
  },
});