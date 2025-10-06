import { differenceInDays, differenceInHours } from "date-fns";

export const getTripStartCountdown = (pickupDate: string | Date) => {
  const startDate = new Date(pickupDate);
  const now = new Date();

  const days = differenceInDays(startDate, now);
  const hours = differenceInHours(startDate, now) % 24;

  if (days > 0 || hours > 0) {
    return `This trip starts in ${
      days > 0 ? `${days} day${days !== 1 ? "s" : ""}` : ""
    } ${hours > 0 ? `${hours} hour${hours !== 1 ? "s" : ""}` : ""}`.trim();
  }
  return "This trip has started";
};

export const getTripEndCountdown = (returnDate: string | Date) => {
  const endDate = new Date(returnDate);
  const now = new Date();

  const days = differenceInDays(endDate, now);
  const hours = differenceInHours(endDate, now) % 24;

  if (days > 0 || hours > 0) {
    return `This trip ends in ${
      days > 0 ? `${days} day${days !== 1 ? "s" : ""}` : ""
    } ${hours > 0 ? `${hours} hour${hours !== 1 ? "s" : ""}` : ""}`.trim();
  }
  return "This trip has ended";
};
