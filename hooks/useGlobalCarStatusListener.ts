import { useEffect } from "react";
import { onSnapshot, doc, getDocs, collection, query, where } from "firebase/firestore";
import { db } from "@/FirebaseConfig";
import { checkRequiredSteps } from "@/utils/stepValidator";
import { updateCarStatus } from "@/services/carService";

export const useGlobalCarStatusListener = (user: any) => {
  useEffect(() => {
    if (!user) return;

    console.log("Listening for verification updates for:", user.uid);

    const unsubscribe = onSnapshot(doc(db, "users", user.uid), async (docSnap) => {
      const userData = docSnap.data();
      if (!userData) return;

      const { allStepsCompleted } = checkRequiredSteps(userData);

      const carsSnap = await getDocs(
        query(collection(db, "cars"), where("ownerId", "==", user.uid))
      );

      carsSnap.forEach(async (carDoc) => {
        const car = carDoc.data();

        if (allStepsCompleted && car.status === "draft") {
          console.log(`Car ${carDoc.id} → pending`);
          await updateCarStatus(carDoc.id, "pending");
        } else if (!allStepsCompleted && car.status !== "draft") {
          console.log(`Car ${carDoc.id} → draft`);
          await updateCarStatus(carDoc.id, "draft");
        }
      });
    });

    return () => unsubscribe();
  }, [user]);
};
