import { updatePhoneVerified } from "./userService";

const TWILIO_ACCOUNT_SID = process.env.EXPO_PUBLIC_TWILLIO_SID;
const TWILIO_AUTH_TOKEN = process.env.EXPO_PUBLIC_TWILLIO_TOKEN;
const TWILIO_VERIFY_SERVICE_SID = process.env.EXPO_PUBLIC_TWILLIO_SERVICE_SID;

const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

interface VerificationResult {
  success: boolean;
  error?: string;
  sessionInfo?: string;
  isTestNumber?: boolean;
  testCode?: string;
}

interface ConfirmationResult {
  success: boolean;
  error?: string;
}

// Format phone number to E.164
const formatPhoneNumber = (phoneNumber: string): string => {
  let formatted = phoneNumber.replace(/[^\d+]/g, "");
  if (!formatted.startsWith("+")) formatted = "+" + formatted;
  if (formatted.startsWith("+0")) formatted = "+63" + formatted.substring(2);
  else if (formatted.startsWith("+9") && formatted.length === 11) formatted = "+63" + formatted.substring(1);
  return formatted;
};

// Validate phone number
const isValidPhoneNumber = (phoneNumber: string): boolean => {
  const formatted = formatPhoneNumber(phoneNumber);
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  if (!e164Regex.test(formatted)) return false;
  if (formatted.startsWith("+63")) return formatted.length === 13;
  if (formatted.startsWith("+1")) return formatted.length === 12;
  return formatted.length >= 8 && formatted.length <= 16;
};

// Test numbers for development
export const testPhoneNumbers = {
  "+16505553434": "654321",
  "+12345678901": "123456",
  "+639123456789": "123456",
};

// Send verification code
export const sendVerificationCode = async (phoneNumber: string): Promise<VerificationResult> => {
  try {
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

    if (!isValidPhoneNumber(formattedPhoneNumber)) {
      throw new Error("Invalid phone number format. Use format: +639XXXXXXXXX for Philippines");
    }

    // Test number check
    if (testPhoneNumbers[formattedPhoneNumber as keyof typeof testPhoneNumbers]) {
      return {
        success: true,
        sessionInfo: "test-session-" + Date.now(),
        isTestNumber: true,
        testCode: testPhoneNumbers[formattedPhoneNumber as keyof typeof testPhoneNumbers],
      };
    }

    // Send via Twilio
    const response = await fetch(
      `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/Verifications`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: formattedPhoneNumber, Channel: "sms" }).toString(),
      }
    );

    const data = await response.json();

    if (!response.ok) throw new Error(data.message || "Failed to send verification code");

    return { success: true, sessionInfo: data.sid, isTestNumber: false, testCode: "" };
  } catch (error: any) {
    console.error("Error sending code:", error);
    return { success: false, error: error.message || "Network error" };
  }
};

// Confirm code (real Twilio)
export const confirmVerificationCode = async (
  code: string,
  userId: string,
  phoneNumber: string,
  sessionInfo?: string
): Promise<ConfirmationResult> => {
  try {
    if (!sessionInfo) throw new Error("No session info. Request a new code.");
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

    const response = await fetch(
      `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: formattedPhoneNumber, Code: code }).toString(),
      }
    );

    const data = await response.json();

    if (!response.ok || data.status !== "approved") throw new Error(data.message || "Invalid verification code");

    await updatePhoneVerified(userId, formattedPhoneNumber);

    return { success: true };
  } catch (error: any) {
    console.error("Error confirming code:", error);
    return { success: false, error: error.message || "Verification failed" };
  }
};

// Confirm code (test numbers)
export const confirmTestVerificationCode = async (
  code: string,
  userId: string,
  phoneNumber: string,
  expectedCode: string
): Promise<ConfirmationResult> => {
  try {
    if (code !== expectedCode) throw new Error("Invalid verification code");
    await updatePhoneVerified(userId, phoneNumber);
    return { success: true };
  } catch (error: any) {
    console.error("Error confirming test code:", error);
    return { success: false, error: error.message };
  }
};
