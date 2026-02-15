// hooks/usePresence.ts
import { setupUserPresence, setUserOffline } from "@/services/presenceService";
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useAuth } from "./useUser";

/**
 * Hook to automatically manage user's online/offline presence
 * Handles app state changes (foreground/background) and cleanup
 */
export const usePresence = () => {
  const { user } = useAuth();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!user?.uid) return;

    // Set user as online when hook mounts
    setupUserPresence(user.uid);

    // Handle app state changes
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          // App has come to foreground - set user online
          setupUserPresence(user.uid);
        } else if (
          appState.current === "active" &&
          nextAppState.match(/inactive|background/)
        ) {
          // App has gone to background - set user offline
          setUserOffline(user.uid);
        }

        appState.current = nextAppState;
      }
    );

    // Cleanup: set user offline when component unmounts
    return () => {
      subscription.remove();
      setUserOffline(user.uid);
    };
  }, [user?.uid]);

  // Periodically update presence (heartbeat) every 5 minutes
  useEffect(() => {
    if (!user?.uid) return;

    const interval = setInterval(
      () => {
        if (AppState.currentState === "active") {
          setupUserPresence(user.uid);
        }
      },
      5 * 60 * 1000
    ); // 5 minutes

    return () => clearInterval(interval);
  }, [user?.uid]);
};
