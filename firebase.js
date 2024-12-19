import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {
apiKey: "AIzaSyAFdHvWkcgkwI0Dh3vgxXzk4NCLnbmDh20",
authDomain: "agung2-apps.firebaseapp.com",
projectId: "agung2-apps",
storageBucket: "agung2-apps.appspot.com",
messagingSenderId: "1031050448143",
appId: "1:1031050448143:web:ec164847852fdb19fb427a"
};



const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

const messaging = async () => {
  const supported = await isSupported();
  return supported ? getMessaging(app) : null;
};

export const fetchToken = async () => {
  try {
    const fcmMessaging = await messaging();
    if (fcmMessaging) {
      const token = await getToken(fcmMessaging, {
        vapidKey: "BIhXHGKp9qf6aY0QedAoPGDTa2d3y-qpX2ZyVLlFshrQldkzc7FZTuiWc4E8idE9zy58qc34i4HEDStoaMveQgo",
      });
      return token;
    }
    return null;
  } catch (err) {
    console.error("An error occurred while fetching the token:", err);
    return null;
  }
};


export { app, db, auth, storage, messaging };
