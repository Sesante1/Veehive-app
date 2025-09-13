import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Role = "renter" | "host";

type RoleContextType = {
  role: Role;
  toggleRole: () => void;
  setRole: (newRole: Role) => void;
  loading: boolean;
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: React.ReactNode }) => {
  const [role, setRoleState] = useState<Role>("renter"); // default
  const [loading, setLoading] = useState(true);

  // Load saved role on app start
  useEffect(() => {
    const loadRole = async () => {
      try {
        const savedRole = await AsyncStorage.getItem("userRole");
        if (savedRole === "renter" || savedRole === "host") {
          setRoleState(savedRole);
        }
      } finally {
        setLoading(false);
      }
    };
    loadRole();
  }, []);

  // Save role whenever it changes
  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    AsyncStorage.setItem("userRole", newRole);
  };

  const toggleRole = () => {
    setRole(role === "renter" ? "host" : "renter");
  };

  return (
    <RoleContext.Provider value={{ role, toggleRole, setRole, loading }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) throw new Error("useRole must be used inside RoleProvider");
  return context;
};
