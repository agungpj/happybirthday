import { initializeApp } from "firebase/app";
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

const app = initializeApp(firebaseConfig);
let messaging;

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
// Check if window object exists (we are in the browser)
if (typeof window !== 'undefined') {
  // Import Firebase Messaging and initialize it only in client-side
  const { getMessaging } = require("firebase/messaging");
  messaging = getMessaging(app);
}


export const generateToken = async (title, body) => {
  try {
    const permission = await Notification.requestPermission()
    console.log(permission)
    if(permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey: "BIhXHGKp9qf6aY0QedAoPGDTa2d3y-qpX2ZyVLlFshrQldkzc7FZTuiWc4E8idE9zy58qc34i4HEDStoaMveQgo"
      })
      console.log(token)
      const result = await sendNotification(
        token,
        title,
        body
      );
    console.log('Notification sent successfully:', result);
    }
  } catch (e) {
    console.log(e)
  }
}

const sendNotification = async (token, title, body) => {
  const response = await fetch('/api/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },

    
    
    body: JSON.stringify({
      token: token,
      notification: {
        title: title,
        body: body,
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to send notification');
  }

  return response.json();
};


export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then((registration) => {
      console.log('Service Worker registered with scope:', registration.scope);
      initializeMessaging(registration); // Initialize messaging once the service worker is registered
    })
    .catch((err) => {
      console.error('Service Worker registration failed:', err);
    });
  }
};

const initializeMessaging = (serviceWorkerRegistration) => {
  const messaging = getMessaging();
  getToken(messaging, { vapidKey: "BIhXHGKp9qf6aY0QedAoPGDTa2d3y-qpX2ZyVLlFshrQldkzc7FZTuiWc4E8idE9zy58qc34i4HEDStoaMveQgo", serviceWorkerRegistration })
    .then((currentToken) => {
      if (currentToken) {
        console.log(currentToken);
      } else {
        console.warn('No FCM token available. Request permission to generate one.');
      }
    })
    .catch((err) => {
      console.error('An error occurred while retrieving token.', err);
    });
};
// BIhXHGKp9qf6aY0QedAoPGDTa2d3y-qpX2ZyVLlFshrQldkzc7FZTuiWc4E8idE9zy58qc34i4HEDStoaMveQgo


export { db, auth, storage, messaging };
