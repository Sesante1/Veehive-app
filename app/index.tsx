import { FIREBASE_AUTH } from "../FirebaseConfig";
import { Redirect } from "expo-router";
import "../global.css";

export default function Index() {
  
  return <Redirect href="/(auth)/welcome" />;
}
