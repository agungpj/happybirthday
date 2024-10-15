import { messaging } from "./firebase-admin"


const sendNotification = async (token, notification) => {
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      token: token, // FCM token device
    };
  
    try {
      const response = await messaging.send(message);
      console.log("Successfully sent message:", response);
      return response;
    } catch (error) {
      console.log("Error sending message:", error);
      throw error;
    }
  };
  
  export default async function handler(req, res) {
    if (req.method === 'POST') {
      try {
        const { token, notification } = req.body;
        const result = await sendNotification(token, notification);
        res.status(200).json({ success: true, result });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
        res.status(405).json({ success: false, error: error });
      }
    } else {
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  }