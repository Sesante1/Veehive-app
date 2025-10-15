import { db } from "@/FirebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export type NotificationType =
  | "booking_confirmed"
  | "booking_cancelled"
  | "payment_received"
  | "booking_completed"
  | "review_received"
  | "message_received"
  | "system_alert";

export interface NotificationData {
  userId: string;
  recipientRole: "guest" | "hoster";
  type: NotificationType;
  title: string;
  message: string;

  // Optional metadata for flexibility
  relatedId?: string;
  relatedType?: "booking" | "car" | "user" | "message" | "review";
  actionUrl?: string;
  imageUrl?: string;

  // Additional flexible data
  data?: Record<string, any>;

  // Status tracking
  read: boolean;
  readAt?: Date | null;

  // Metadata
  createdAt: any;
  expiresAt?: Date | null;
}

export const createNotification = async (
  notificationData: Omit<NotificationData, "read" | "createdAt">
): Promise<string> => {
  try {
    const notification: NotificationData = {
      ...notificationData,
      read: false,
      readAt: null,
      createdAt: serverTimestamp(),
    };

    const notificationRef = await addDoc(
      collection(db, "notifications"),
      notification
    );

    console.log("Notification created:", notificationRef.id);
    return notificationRef.id;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

// Specific notification creators for common use cases
export const notifyBookingConfirmed = async (
  ownerId: string,
  bookingId: string,
  renterName: string,
  carDetails: { make: string; model: string },
  pickupDate: string,
  totalAmount: string
) => {
  return createNotification({
    userId: ownerId,
    recipientRole: "hoster", 
    type: "booking_confirmed",
    title: "New Booking Received! 🎉",
    message: `${renterName} has booked your ${carDetails.make} ${carDetails.model} for ${pickupDate}`,
    relatedId: bookingId,
    relatedType: "booking",
    actionUrl: "/bookingsReceived?tab=upcoming",
    data: {
      renterName,
      carMake: carDetails.make,
      carModel: carDetails.model,
      pickupDate,
      totalAmount,
    },
  });
};

export const notifyPaymentReceived = async (
  ownerId: string,
  bookingId: string,
  amount: string,
  carDetails: { make: string; model: string }
) => {
  return createNotification({
    userId: ownerId,
    recipientRole: "hoster",
    type: "payment_received",
    title: "Payment Received 💰",
    message: `You've received ₱${amount} for your ${carDetails.make} ${carDetails.model}`,
    relatedId: bookingId,
    relatedType: "booking",
    actionUrl: "/(root)/bookings/" + bookingId,
    data: {
      amount,
      carMake: carDetails.make,
      carModel: carDetails.model,
    },
  });
};

export const notifyGuestBookingCancelled = async (
  ownerId: string,
  bookingId: string,
  hosterName: string,
  carDetails: { make: string; model: string },
) => {
  return createNotification({
    userId: ownerId,
    recipientRole: "guest", 
    type: "booking_cancelled",
    title: "Booking Cancelled",
    message: `${hosterName} cancelled your booking for ${carDetails.make} ${carDetails.model}`,
    relatedId: bookingId,
    relatedType: "booking",
    actionUrl: "/bookingsReceived?tab=canceled",
    data: {
      hosterName,
      carMake: carDetails.make,
      carModel: carDetails.model,
    },
  });
};

export const notifyGuestBookingdeclined = async (
  ownerId: string,
  bookingId: string,
  hosterName: string,
  carDetails: { make: string; model: string },
) => {
  return createNotification({
    userId: ownerId,
    recipientRole: "guest", 
    type: "booking_cancelled",
    title: "Booking Cancelled",
    message: `${hosterName} declined your booking for ${carDetails.make} ${carDetails.model}`,
    relatedId: bookingId,
    relatedType: "booking",
    actionUrl: "/bookingsReceived?tab=canceled",
    data: {
      hosterName,
      carMake: carDetails.make,
      carModel: carDetails.model,
    },
  });
};

export const notifyHostBookingCancelled = async (
  ownerId: string,
  bookingId: string,
  renterName: string,
  carDetails: { make: string; model: string },
) => {
  return createNotification({
    userId: ownerId,
    recipientRole: "hoster", 
    type: "booking_cancelled",
    title: "Booking Cancelled",
    message: `${renterName} cancelled their booking for ${carDetails.make} ${carDetails.model}`,
    relatedId: bookingId,
    relatedType: "booking",
    actionUrl: "/bookingsReceived?tab=canceled",
    data: {
      renterName,
      carMake: carDetails.make,
      carModel: carDetails.model,
    },
  });
};

// Guest notification - for when a guest successfully books a car
export const notifyGuestBookingSuccess = async (
  guestId: string,
  bookingId: string,
  carDetails: { make: string; model: string },
  pickupDate: string
) => {
  return createNotification({
    userId: guestId,
    recipientRole: "guest", 
    type: "booking_confirmed",
    title: "Booking Confirmed! ✅",
    message: `Your booking for ${carDetails.make} ${carDetails.model} is confirmed for ${pickupDate}`,
    relatedId: bookingId,
    relatedType: "booking",
    actionUrl: "/bookingsReceived?tab=upcoming",
    data: {
      carMake: carDetails.make,
      carModel: carDetails.model,
      pickupDate,
    },
  });
};
