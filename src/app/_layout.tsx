// src/app/_layout.tsx
// Root layout — handles notification taps globally.
// When parent taps a notification, they are routed to the
// correct screen based on the notification data.

import * as Notifications from "expo-notifications";
import { router, Stack } from "expo-router";
import { useEffect, useRef } from "react";

// ── Configure how notifications appear when app is open ─
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  const notificationListener = useRef<Notifications.EventSubscription | undefined>(
    undefined
  );
  const notificationTapListener = useRef<Notifications.EventSubscription | undefined>(
    undefined
  );

  useEffect(() => {
    // ✅ 8. Handle notification TAP — route to correct screen
    notificationTapListener.current =
      Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data as any;
        console.log("🔔 Notification tapped:", data);

        const screen = data?.screen;

        if (screen === "map") {
          // Bus arriving / bus arrived → open live map
          router.push("/(app)/map" as any);
        } else if (screen === "dashboard") {
          // Trip ended / school reached → open dashboard
          router.push("/(app)/dashboard" as any);
        }
      });

    // Optional: handle notification received while app is open
    notificationListener.current =
      Notifications.addNotificationReceivedListener(notification => {
        console.log("🔔 Notification received (foreground):",
          notification.request.content.title
        );
      });

    return () => {
      notificationTapListener.current?.remove();
      notificationListener.current?.remove();
    };
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
