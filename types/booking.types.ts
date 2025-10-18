// types/booking.types.ts
import { Timestamp } from "firebase/firestore";

export interface DriversLicense {
  backLicense: {
    filename: string;
    path: string;
    uploadedAt: string;
    url: string;
  };
  frontLicense: {
    filename: string;
    path: string;
    uploadedAt: string;
    url: string;
  };
  selfieWithLicense: {
    filename: string;
    path: string;
    uploadedAt: string;
    url: string;
  };
}

export interface IdentityVerification {
  backId: {
    filename: string;
    path: string;
    uploadedAt: string;
    url: string;
  };
  frontId: {
    filename: string;
    path: string;
    uploadedAt: string;
    url: string;
  };
  selfieWithId: {
    filename: string;
    path: string;
    uploadedAt: string;
    url: string;
  };
}

export interface UserRole {
  Guest: boolean;
  Hoster: boolean;
}

export interface UserData {
  address: string;
  bannedAt?: Timestamp;
  birthDate: string;
  createdAt?: Timestamp;
  driversLicense?: DriversLicense;
  email: string;
  firstName: string;
  identityVerification?: IdentityVerification;
  lastName: string;
  latitude: number;
  longitude: number;
  phoneNumber: string;
  phoneVerified: boolean;
  profileImage: string;
  role: UserRole;
  status: string;
  suspendedAt?: Timestamp;
  suspendedUntil?: Timestamp;
  suspensionDays?: number;
  suspensionReason?: string;
  updatedAt: Timestamp;
}

export interface CarImage {
  filename: string;
  uploadedAt: string;
  url: string;
}

export interface CarData {
  id: string;
  make: string;
  model: string;
  year: number;
  carType: string;
  transmission: string;
  fuel: string;
  seats: number;
  images: CarImage[];
  dailyRate: number;
  location: {
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  } | null;
  hostId: string;
}

export interface Booking {
  id: string;
  userId: string;
  hostId: string;
  carId: string;
  // Changed from Timestamp to string | Timestamp to handle both formats
  pickupDate: string | Timestamp;
  returnDate: string | Timestamp;
  pickupTime: string;
  returnTime: string;
  rentalDays: number;
  subtotal: number;
  platformFee: number;
  totalAmount: number;
  paymentStatus: "paid" | "pending" | "failed";
  paymentIntentId: string;
  bookingStatus: "pending" | "confirmed" | "completed" | "cancelled" | "declined";
  location: {
    address: string;
    latitude: number;
    longitude: number;
  } | null;

  tripStatus?: "not_started" | "checked_in" | "in_progress" | "checked_out" | "awaiting_host_confirmation" | "completed";

  // Trip tracking
  actualStartTime?: Timestamp | null;
  actualEndTime?: Timestamp | null;

  // Late return
  lateReturn?: boolean;
  lateHours?: number;
  lateFee?: number;
  lateChargeId?: string | null;

  // Cancellation & Refund fields
  cancellationStatus: string | null;
  cancellationRequestedAt: Timestamp | null;
  cancellationReason: string | null;
  cancelledBy: string | null;
  cancelledAt: Timestamp | null;
  refundStatus: string | null;
  refundAmount: number | null;
  refundPercentage: number | null;
  refundProcessedAt: Timestamp | null;
  refundId: string | null;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BookingWithDetails extends Booking {
  guestData?: UserData;
  carData?: CarData;
}
