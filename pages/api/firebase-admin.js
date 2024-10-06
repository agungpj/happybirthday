const admin = require("firebase-admin");

const serviceAccount = require("./agung2-apps-firebase-adminsdk-hyt3j-9e35a14dc8.json");

if (!admin.apps.length) {
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
//   databaseURL: "https://your-project-id.firebaseio.com"
});
}
export const messaging = admin.messaging();

