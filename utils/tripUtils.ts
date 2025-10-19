import { differenceInMinutes, isValid, parseISO } from "date-fns";

export const getTripStartCountdown = (pickupTime: string | Date) => {
  const startDate =
    typeof pickupTime === "string"
      ? parseISO(pickupTime)
      : new Date(pickupTime);
  if (!isValid(startDate)) return "Trip starts soon";
  const now = new Date();

  const totalMinutes = differenceInMinutes(startDate, now);

  // If trip has already started
  if (totalMinutes <= 0) {
    return "This trip has started";
  }

  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  // Build the countdown message
  const parts = [];

  if (days > 0) {
    parts.push(`${days} day${days !== 1 ? "s" : ""}`);
  }

  if (hours > 0) {
    parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
  }

  // Only show minutes if less than 24 hours remaining
  if (days === 0 && minutes > 0) {
    parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
  }

  return `This trip starts in ${parts.join(" ")}`;
};

export const getTripEndCountdown = (returnTime: string | Date) => {
  const endDate =
    typeof returnTime === "string"
      ? parseISO(returnTime)
      : new Date(returnTime);
  if (!isValid(endDate)) return "Trip ends soon";
  const now = new Date();

  const totalMinutes = differenceInMinutes(endDate, now);

  // If trip has already ended
  if (totalMinutes <= 0) {
    return "This trip has ended";
  }

  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  // Build the countdown message
  const parts = [];

  if (days > 0) {
    parts.push(`${days} day${days !== 1 ? "s" : ""}`);
  }

  if (hours > 0) {
    parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
  }

  // Only show minutes if less than 24 hours remaining
  if (days === 0 && minutes > 0) {
    parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
  }

  return `This trip ends in ${parts.join(" ")}`;
};
