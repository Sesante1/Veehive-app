import { db } from "@/FirebaseConfig";
import { useRouter } from "expo-router";
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";

export interface IncomingCallData {
  callId: string;
  callerName: string;
  callerAvatar?: string;
  channelName: string;
  callerId: string;
}

export function useIncomingCall(userId: string | null) {
  const router = useRouter();
  const seenRef = useRef<Set<string>>(new Set());
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(
    null,
  );

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "calls"),
      where("receiverId", "==", userId),
      where("status", "==", "ringing"),
    );

    const unsub = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type !== "added" && change.type !== "modified") return;

        const callId = change.doc.id;
        const data = change.doc.data();

        if (seenRef.current.has(callId)) return;
        if (data.status !== "ringing") return;

        seenRef.current.add(callId);

        // Show the bottom sheet
        setIncomingCall({
          callId,
          callerName: data.callerName ?? "Someone",
          callerAvatar: data.callerAvatar,
          channelName: data.channelName,
          callerId: data.callerId,
        });
      });
    });

    return () => unsub();
  }, [userId]);

  const acceptCall = async () => {
    if (!incomingCall) return;
    setIncomingCall(null);
    router.push({
      pathname: "/VideoCallScreen",
      params: {
        callId: incomingCall.callId,
        channelName: incomingCall.channelName,
        callerId: incomingCall.callerId,
        callerName: incomingCall.callerName,
        isIncoming: "true",
      },
    });
  };

  const declineCall = async () => {
    if (!incomingCall) return;
    try {
      await updateDoc(doc(db, "calls", incomingCall.callId), {
        status: "declined",
        declinedAt: serverTimestamp(),
      });
    } catch (e) {}
    seenRef.current.delete(incomingCall.callId);
    setIncomingCall(null);
  };

  return { incomingCall, acceptCall, declineCall };
}
