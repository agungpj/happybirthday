"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const useFcmToken = () => {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const retryLoadToken = useRef(0);
  const isLoading = useRef(false);

  const getNotificationPermissionAndToken = async () => {
    if (typeof window === 'undefined') return null;

    const { fetchToken } = await import("../firebase");

    if (Notification.permission === "granted") {
      return await fetchToken();
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        return await fetchToken();
      }
    }

    return null;
  };

  const loadToken = async () => {
    if (isLoading.current) return;

    isLoading.current = true;
    const token = await getNotificationPermissionAndToken();

    if (typeof window !== 'undefined' && Notification.permission === "denied") {
      isLoading.current = false;
      return;
    }

    if (!token) {
      retryLoadToken.current += 1;
      isLoading.current = false;
      if (retryLoadToken.current < 3) { // Add retry limit
        await loadToken();
      }
      return;
    }

    setToken(token);
    isLoading.current = false;
  };

  useEffect(() => {
    loadToken();
  }, []);

  useEffect(() => {
    const setupListener = async () => {
      if (!token || typeof window === 'undefined') return;

      const { messaging, onMessage } = await import("../firebase");
      const m = await messaging();
      if (!m) return;

      const unsubscribe = onMessage(m, (payload) => {
        if (Notification.permission !== "granted") return;

        const link = payload.fcmOptions?.link || payload.data?.link;
        const n = new Notification(
          payload.notification?.title || "New message",
          {
            body: payload.notification?.body || "This is a new message",
            data: link ? { url: link } : undefined,
          }
        );

        n.onclick = (event) => {
          event.preventDefault();
          const link = event.target?.data?.url;
          if (link) {
            router.push(link);
          }
        };
      });

      return unsubscribe;
    };

    let unsubscribe = null;

    setupListener().then((unsub) => {
      if (unsub) {
        unsubscribe = unsub;
      }
    });

    return () => unsubscribe?.();
  }, [token, router]);

  return { token };
};

export default useFcmToken;