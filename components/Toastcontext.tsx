import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { StyleSheet, View } from "react-native";
import ToastNotification, { ToastData } from "./ToastNotification";

interface ToastContextValue {
  showToast: (opts: Omit<ToastData, "id">) => void;
  showBookingToast: (opts: {
    renterName: string;
    carName: string;
    days: number;
    avatarUrl?: string;
    onPress?: () => void;
  }) => void;
  showPaymentToast: (opts: {
    amount: number;
    carName: string;
    onPress?: () => void;
  }) => void;
  showCancelToast: (opts: {
    renterName: string;
    carName: string;
    onPress?: () => void;
  }) => void;
  showMessageToast: (opts: {
    senderName: string;
    preview: string;
    avatarUrl?: string;
    onPress?: () => void;
  }) => void;
  showReviewToast: (opts: {
    reviewerName: string;
    stars: number;
    carName: string;
    onPress?: () => void;
  }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const counterRef = useRef(0);

  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const showToast = useCallback((opts: Omit<ToastData, "id">) => {
    const id = `toast_${Date.now()}_${counterRef.current++}`;
    setToasts((prev) => {
      // Keep max 3 visible at once — drop the oldest
      const updated = prev.length >= 3 ? prev.slice(1) : prev;
      return [...updated, { ...opts, id }];
    });
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showBookingToast = useCallback(
    ({
      renterName,
      carName,
      days,
      avatarUrl,
      onPress,
    }: {
      renterName: string;
      carName: string;
      days: number;
      avatarUrl?: string;
      onPress?: () => void;
    }) => {
      showToast({
        type: "booking",
        title: "New Booking Request",
        message: `${renterName} wants to rent your ${carName} for ${days} day${days !== 1 ? "s" : ""}`,
        avatarUrl,
        onPress,
      });
    },
    [showToast],
  );

  const showPaymentToast = useCallback(
    ({
      amount,
      carName,
      onPress,
    }: {
      amount: number;
      carName: string;
      onPress?: () => void;
    }) => {
      showToast({
        type: "payment",
        title: "Payment Received",
        message: `₱${amount.toLocaleString()} received for ${carName}`,
        onPress,
      });
    },
    [showToast],
  );

  const showCancelToast = useCallback(
    ({
      renterName,
      carName,
      onPress,
    }: {
      renterName: string;
      carName: string;
      onPress?: () => void;
    }) => {
      showToast({
        type: "cancel",
        title: "Booking Cancelled",
        message: `${renterName} cancelled their booking for ${carName}`,
        onPress,
      });
    },
    [showToast],
  );

  const showMessageToast = useCallback(
    ({
      senderName,
      preview,
      avatarUrl,
      onPress,
    }: {
      senderName: string;
      preview: string;
      avatarUrl?: string;
      onPress?: () => void;
    }) => {
      showToast({
        type: "message",
        title: senderName,
        message: preview,
        avatarUrl,
        onPress,
      });
    },
    [showToast],
  );

  const showReviewToast = useCallback(
    ({
      reviewerName,
      stars,
      carName,
      onPress,
    }: {
      reviewerName: string;
      stars: number;
      carName: string;
      onPress?: () => void;
    }) => {
      const starStr = "★".repeat(stars) + "☆".repeat(5 - stars);
      showToast({
        type: "review",
        title: "New Review",
        message: `${reviewerName} rated ${carName} ${starStr}`,
        onPress,
      });
    },
    [showToast],
  );

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showBookingToast,
        showPaymentToast,
        showCancelToast,
        showMessageToast,
        showReviewToast,
      }}
    >
      {children}
      {/* Stacked toasts — each offsets down by 70px */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {toasts.map((toast, index) => (
          <ToastNotification
            key={toast.id}
            toast={toast}
            onDismiss={dismissToast}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
