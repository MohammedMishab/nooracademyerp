import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAlFbrF26lLfgYliUFq_0VLPpsJJ8coACs",
  authDomain: "erpnooracademy.firebaseapp.com",
  projectId: "erpnooracademy",
  storageBucket: "erpnooracademy.appspot.com", // ✅ corrected
  messagingSenderId: "1071187436740",
  appId: "1:1071187436740:web:f8d1077a53869925b81591"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Firebase Cloud Messaging
let messaging: ReturnType<typeof getMessaging> | null = null;
if (typeof window !== 'undefined') {
  messaging = getMessaging(app);
}

export { messaging, getToken, onMessage };
