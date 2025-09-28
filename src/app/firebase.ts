import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

// Initialize Firebase Cloud Messaging - only on client side
let messaging: any = null;
let getToken: any = null;
let onMessage: any = null;

if (typeof window !== 'undefined') {
  // Check if browser supports required APIs
  const isSupported = () => {
    return (
      'serviceWorker' in navigator &&
      'Notification' in window &&
      'PushManager' in window &&
      'indexedDB' in window
    );
  };

  if (isSupported()) {
    // Dynamic import to avoid server-side issues
    import('firebase/messaging').then((messagingModule) => {
      try {
        messaging = messagingModule.getMessaging(app);
        getToken = messagingModule.getToken;
        onMessage = messagingModule.onMessage;
        console.log('Firebase messaging initialized successfully');
      } catch (error) {
        console.warn('Firebase messaging initialization failed:', error);
        messaging = null;
        getToken = null;
        onMessage = null;
      }
    }).catch((error) => {
      console.warn('Firebase messaging module not available:', error);
    });
  } else {
    console.warn('Browser does not support Firebase messaging APIs');
  }
}

export { messaging, getToken, onMessage };
