import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

 import Constants from "expo-constants";

 
Notifications.addNotificationReceivedListener(notification => {
  console.log(
    "🔔 PARENT RECEIVED NOTIFICATION:",
    JSON.stringify(notification, null, 2)
  );
});

Notifications.addNotificationResponseReceivedListener(response => {
  console.log(
    "👆 PARENT NOTIFICATION PRESSED:",
    JSON.stringify(response, null, 2)
  );
});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log("Must use a physical device for notifications.");
    return null;
  }

  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } =
      await Notifications.requestPermissionsAsync();

    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Notification permission denied.");
    return null;
  }

const token = await Notifications.getExpoPushTokenAsync({
  projectId: Constants.expoConfig?.extra?.eas?.projectId ??
             Constants.easConfig?.projectId,
             
});
console.log("🔥 PARENT EXPO PUSH TOKEN:", token.data);


  console.log("Expo Push Token:", token.data);

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  return token.data;
}