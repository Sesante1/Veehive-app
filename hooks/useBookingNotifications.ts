import { db } from "@/FirebaseConfig";
import { useRouter } from "expo-router";
import {
  collection,
  onSnapshot,
  query,
  Timestamp,
  Unsubscribe,
  where,
} from "firebase/firestore";
import { useEffect, useRef } from "react";
import { useToast } from "../components/Toastcontext";
import { useActiveChatStore } from "./useActiveChatStore";

const IGNORE_WINDOW_MS = 3000;

export function useBookingNotifications(hostId: string | null) {
  const {
    showBookingToast,
    showPaymentToast,
    showCancelToast,
    showMessageToast,
  } = useToast();
  const router = useRouter();
  const mountedAtRef = useRef(Date.now());
  const seenRef = useRef<Set<string>>(new Set());

  const openConversation = (conversationId: string) => {
    router.push({
      pathname: "/ConversationScreen",
      params: { conversationId },
    });
  };

  useEffect(() => {
    if (!hostId) return;

    const q = query(
      collection(db, "bookings"),
      where("hostId", "==", hostId),
      where("bookingStatus", "in", [
        "pending",
        "confirmed",
        "cancelled",
        "paid",
      ]),
    );

    const unsub: Unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const docId = change.doc.id;
        const data = change.doc.data();

        const createdAt: Timestamp | undefined = data.createdAt;
        const isNew =
          createdAt &&
          createdAt.toMillis() > mountedAtRef.current - IGNORE_WINDOW_MS;

        const stateKey = `${docId}_${data.bookingStatus}`;

        if (
          change.type === "added" &&
          data.bookingStatus === "pending" &&
          isNew
        ) {
          if (seenRef.current.has(stateKey)) return;
          seenRef.current.add(stateKey);

          showBookingToast({
            renterName: data.renterName ?? "Someone",
            carName: data.carName ?? "your car",
            days: data.rentalDays ?? 1,
            avatarUrl: data.renterAvatarUrl,
            onPress: () =>
              router.push({
                pathname: "/hostManageBooking",
                params: { booking: JSON.stringify({ ...data, id: docId }) },
              }),
          });
          return;
        }

        if (change.type === "modified") {
          if (seenRef.current.has(stateKey)) return;
          seenRef.current.add(stateKey);

          if (data.bookingStatus === "paid") {
            showPaymentToast({
              amount: data.totalAmount ?? 0,
              carName: data.carName ?? "your car",
              onPress: () =>
                router.push({
                  pathname: "/hostManageBooking",
                  params: { booking: JSON.stringify({ ...data, id: docId }) },
                }),
            });
          } else if (data.bookingStatus === "cancelled") {
            showCancelToast({
              renterName: data.renterName ?? "Someone",
              carName: data.carName ?? "your car",
              onPress: () =>
                router.push({
                  pathname: "/hostManageBooking",
                  params: { booking: JSON.stringify({ ...data, id: docId }) },
                }),
            });
          }
        }
      });
    });

    return () => unsub();
  }, [hostId]);

  const activeChatId = useActiveChatStore((s) => s.activeChatId);
  const activeChatIdRef = useRef(activeChatId);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    if (!hostId) return;

    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", hostId),
    );

    const unsub: Unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const conversationId = change.doc.id;
        const data = change.doc.data();

        if (change.type !== "modified") return;
        if (data.lastMessageSenderId === hostId) return;

        const myUnreadCount = data.unreadCount?.[hostId] ?? 0;
        if (myUnreadCount === 0) return;

        const lastMessageTime: Timestamp | undefined = data.lastMessageTime;
        const isRecent =
          lastMessageTime &&
          lastMessageTime.toMillis() > mountedAtRef.current - IGNORE_WINDOW_MS;
        if (!isRecent) return;

        const stateKey = `msg_${conversationId}_${lastMessageTime?.toMillis?.()}`;
        if (seenRef.current.has(stateKey)) return;

        // ✅ always reads the latest value via ref
        if (activeChatIdRef.current === conversationId) return;

        seenRef.current.add(stateKey);

        const senderDetails =
          data.participantDetails?.[data.lastMessageSenderId];
        const senderName = senderDetails?.name ?? "Someone";
        const avatarUrl = senderDetails?.avatar;

        showMessageToast({
          senderName,
          preview: data.lastMessage ?? "Sent you a message",
          avatarUrl,
          onPress: () => openConversation(conversationId),
        });
      });
    });

    return () => unsub();
  }, [hostId]); 
}
