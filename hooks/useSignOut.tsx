import { signOut } from "firebase/auth";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import ReactNativeModal from "react-native-modal";
import { FIREBASE_AUTH } from "../FirebaseConfig";

export const useSignOut = () => {
  const [visible, setVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await signOut(FIREBASE_AUTH);
      console.log("User signed out");
      setVisible(false);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setSigningOut(false);
    }
  };

  const SignOutModal = () => (
    <ReactNativeModal
      isVisible={visible}
      backdropColor={"black"}
      backdropOpacity={0.5}
      onBackdropPress={() => setVisible(false)}
    >
      <View className="bg-white px-7 py-9 rounded-2xl flex items-center justify-center">
        <Text className="text-lg font-semibold mb-4">Logout</Text>
        <Text className="text-gray-600 mb-10">
          Are you sure you want to logout?
        </Text>
        <View className="flex-row justify-between gap-4">
          <TouchableOpacity
            className="px-8 py-4 rounded-xl bg-gray-200"
            onPress={() => setVisible(false)}
          >
            <Text className="font-JakartaBold">Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="px-8 py-4 rounded-xl bg-black"
            onPress={handleSignOut}
            disabled={signingOut}
          >
            <Text className="text-white font-JakartaBold">
              {signingOut ? "Logging out..." : "Logout"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ReactNativeModal>
  );

  return { SignOutModal, setVisible };
};
