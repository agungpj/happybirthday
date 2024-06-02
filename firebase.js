import firebase from "firebase/app"
import "firebase/firestore";
import "firebase/auth";
import "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAFdHvWkcgkwI0Dh3vgxXzk4NCLnbmDh20",
  authDomain: "agung2-apps.firebaseapp.com",
  projectId: "agung2-apps",
  storageBucket: "agung2-apps.appspot.com",
  messagingSenderId: "1031050448143",
  appId: "1:1031050448143:web:ec164847852fdb19fb427a"
};

let app;

if (firebase.apps.length === 0) {
  app = firebase.initializeApp(firebaseConfig);
} else {
  app = firebase.app();
}

const storage = firebase.storage();
const db = app.firestore();
const auth = firebase.auth();

export { db, auth, storage };

//  allow read, write: if request.time < timestamp.date(2024, 2, 3);