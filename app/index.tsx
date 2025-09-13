import { Redirect } from "expo-router";
import { useRole } from "../context/RoleContext";
import "../global.css";

export default function Index() {
  const { role, loading } = useRole();

  if (loading) {
    return null; // or splash/loading screen
  }
  // return <Redirect href="/(auth)/welcome" />;
  console.log(role)
  if (role === "renter") {
    return <Redirect href="/(root)/(tabs)/home" />;
  } else {
    return <Redirect href="/(root)/(host)/listing" />;
  }
}
