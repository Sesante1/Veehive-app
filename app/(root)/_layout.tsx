import { Stack } from "expo-router";
import React from "react";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(host)" options={{ headerShown: false }} />
      <Stack.Screen
        name="create-car"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="favorites"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="car-details/[id]"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="book-car"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="OnboardingListing"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="carProfile"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="editCarDetails"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="managePhotos"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="managePricing"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="manageLocation"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="manageDescription"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="manageDocuments"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="completeRequiredSteps"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="userProfile"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="guestProfile"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="editName"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="editPhoneNumber"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="editAddress"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="identityVerification"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="driversLicenseVerification"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="confirmNumber"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="myBooking"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="bookingScreens/upcomingScreen"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="bookingScreens/completedScreen"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="bookingScreens/canceledScreen"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="bookingsReceived"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="bookingReceived/upcomingScreen"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="bookingReceived/completedScreen"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="bookingReceived/canceledScreen"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="hostManageBooking"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="guestManageBooking"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="ConversationScreen"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="completeBooking"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="TripPhotosScreen"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="TripPhotosReviewScreen"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="receiptScreen"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="CancellationPolicyScreen"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="cancellationScreen"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="hostCancellationScreen"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
    </Stack>
  );
}

// export default Layout;
