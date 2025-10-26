import { useAuth } from "@/hooks/useUser";
import { useGlobalCarStatusListener } from "@/hooks/useGlobalCarStatusListener";

export function CarStatusProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  // Trigger the global listener
  useGlobalCarStatusListener(user);

  return <>{children}</>;
}