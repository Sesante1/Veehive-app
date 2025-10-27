import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db, FIREBASE_AUTH } from "../FirebaseConfig";

const defaultImageURL =
  "https://firebasestorage.googleapis.com/v0/b/car-rental-1e1a1.firebasestorage.app/o/defaultProfile.png?alt=media&token=89b36550-c43e-432c-a91e-a0288d6f06b4";

// Sign In
export async function signIn(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(
    FIREBASE_AUTH,
    email,
    password
  );
  const user = userCredential.user;

  if (!user.emailVerified) {
    await signOut(FIREBASE_AUTH);
    throw new Error("Email not verified. Please verify your email first.");
  }

  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (userDoc.exists()) {
    const userData = userDoc.data();
    if (userData.status === "banned") {
      await signOut(FIREBASE_AUTH);
      throw new Error("Your account has been banned. You cannot log in.");
    }
  }

  return user;
}

// Sign Up
export async function signUp(form: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  address: string;
  birthDate: string;
  profileImage?: string;
  role: {
    Guest: boolean;
    Hoster: boolean;
  };
}) {
  const {
    firstName,
    lastName,
    email,
    password,
    phoneNumber,
    address,
    birthDate,
    role,
  } = form;

  const userCredential = await createUserWithEmailAndPassword(
    FIREBASE_AUTH,
    email,
    password
  );

  const user = userCredential.user;

  await updateProfile(user, {
    displayName: `${firstName} ${lastName}`,
    photoURL: defaultImageURL,
  });

  await setDoc(doc(db, "users", user.uid), {
    firstName,
    lastName,
    email,
    phoneNumber,
    address,
    birthDate,
    profileImage: defaultImageURL,
    role,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    status: "active",

    driversLicense: {
      front: null,
      back: null,
      selfie: null,
    },
    identityVerification: {
      frontId: null,
      backId: null,
      selfieWithId: null,
    },
  });

  await sendEmailVerification(user);
  await signOut(FIREBASE_AUTH);

  return user;
}
