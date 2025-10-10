import { Timestamp } from "firebase/firestore";

export const formatDate = (timestamp: string | Timestamp | null): string => {
  if (!timestamp) return "N/A";

  const date =
    typeof timestamp === "string"
      ? new Date(timestamp)
      : (timestamp as Timestamp).toDate
      ? (timestamp as Timestamp).toDate()
      : new Date(timestamp as any);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatTime = (timeString: string | null): string => {
  if (!timeString) return "N/A";

  const date = new Date(timeString);

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};
