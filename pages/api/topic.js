import admin from "firebase-admin";

// Inisialisasi Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      privateKey: process.env.FIREBASE_PRIVATE_KEY_ENCODED.replace(/\\n/g, '\n'),
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { token, topic } = req.body;

    if (!token || !topic) {
      return res
        .status(400)
        .json({ success: false, message: "Token and topic are required." });
    }

    try {
      // Tambahkan token ke topik menggunakan Firebase Admin SDK
      await admin.messaging().subscribeToTopic(token, topic);

      res.status(200).json({
        success: true,
        message: `Subscribed to topic "${topic}" successfully.`,
      });
    } catch (error) {
      console.error("Error subscribing to topic:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to subscribe to topic." });
    }
  } else {
    res.status(405).json({ success: false, message: "Method Not Allowed" });
  }
}
