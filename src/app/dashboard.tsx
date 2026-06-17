import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../../services/api";

export default function Dashboard() {
  const [parent, setParent] = useState<any>(null);
  const [bus, setBus] = useState<any>(null);

  useEffect(() => {
    console.log("✅ Dashboard Loaded");
    loadParent();
  }, []);

const loadParent = async () => {
  const data = await AsyncStorage.getItem("parent");

  if (!data) return;

  const parentData = JSON.parse(data);

  setParent(parentData);

  // Fetch Bus Details
  if (parentData.studentId?.assignedBus) {
    try {
      const res = await API.get(
        `/buses/busno/${encodeURIComponent(
          parentData.studentId.assignedBus
        )}`
      );

      console.log("🚌 Bus Data:", res.data);

      setBus(res.data);
    } catch (error) {
      console.log("Bus Fetch Error:", error);
    }
  }
};

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("parent");

    router.replace("/" as any);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        👨‍👩‍👧 Parent Dashboard
      </Text>

      {parent && (
        <>
          <Text style={styles.card}>
            👋 {parent.name}
          </Text>

          <Text style={styles.card}>
            👦 Student:
            {" "}
            {parent.studentId?.name}
          </Text>

          <Text style={styles.card}>
  🚌 Bus: {bus?.busNo || "Loading..."}
</Text>

<Text style={styles.card}>
  📍 Route: {bus?.route || "Loading..."}
</Text>
        </>
      )}

      <TouchableOpacity
        style={styles.greenBtn}
        onPress={() =>
          router.push("/map" as any)
        }
      >
        <Text style={styles.btnText}>
          🗺️ View Live Bus
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.redBtn}
        onPress={logout}
      >
        <Text style={styles.btnText}>
          Logout
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },

  heading: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
  },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    fontSize: 18,
  },

  greenBtn: {
    backgroundColor: "green",
    padding: 15,
    marginTop: 20,
    borderRadius: 10,
  },

  redBtn: {
    backgroundColor: "red",
    padding: 15,
    marginTop: 10,
    borderRadius: 10,
  },

  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 18,
  },
});