importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAFdHvWkcgkwI0Dh3vgxXzk4NCLnbmDh20",
  authDomain: "agung2-apps.firebaseapp.com",
  projectId: "agung2-apps",
  storageBucket: "agung2-apps.appspot.com",
  messagingSenderId: "1031050448143",
  appId: "1:1031050448143:web:ec164847852fdb19fb427a"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/firebase-logo.png'  // Sesuaikan icon notifikasi
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});