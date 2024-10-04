import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAFdHvWkcgkwI0Dh3vgxXzk4NCLnbmDh20",
  authDomain: "agung2-apps.firebaseapp.com",
  projectId: "agung2-apps",
  storageBucket: "agung2-apps.appspot.com",
  messagingSenderId: "1031050448143",
  appId: "1:1031050448143:web:ec164847852fdb19fb427a"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };
