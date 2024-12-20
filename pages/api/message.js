import admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY_ENCODED.replace(/\\n/g, '\n')
    }),
  });
}

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { title, message, link } = req.body;

    const payload = {
      topic: "general",
      notification: {
        title: title,
        body: message,
      },
      webpush: link
        ? {
            fcmOptions: {
              link: link,
            },
          }
        : undefined,
    };

    try {
      await admin.messaging().send(payload);
      console.log(payload)
      res.status(200).json({ success: true, message: payload.notification });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, error: "Method Not Allowed" });
  }
}

