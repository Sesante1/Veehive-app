import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { useRole } from "../context/RoleContext";
import "../global.css";

export default function Index() {
  const { role, loading } = useRole();
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      const value = await AsyncStorage.getItem("hasOnboarded");
      setHasOnboarded(value === "true");
    };
    checkOnboarding();
  }, []);

  if (loading || hasOnboarded === null) {
    return null; // or splash/loading screen
  }

  if (!hasOnboarded) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (role === "renter") {
    return <Redirect href="/(root)/(tabs)/home" />;
  } else {
    return <Redirect href="/(root)/(host)/listing" />;
  }
}
