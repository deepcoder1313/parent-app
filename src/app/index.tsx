import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../../services/api";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    try {
      console.log("📧 Email:", email);
console.log("🔑 Password:", password);

const body = {
  email: email.trim(),
  password: password.trim(),
};

console.log("📤 Sending:", body);

const res = await API.post("/parents/login", body);
      console.log("✅ Login Response:", res.data);
      console.log("1");

      await AsyncStorage.setItem("token", res.data.token);
      console.log("2");
      await AsyncStorage.setItem(
        "parent",
        JSON.stringify(res.data.parent)
      );
      console.log("3");
      Alert.alert("Success", "Login Successful");
      console.log("➡️ Navigating to dashboard");
      router.replace("/dashboard");
      console.log("4");
    } catch (error: any) {
      console.log(error.response?.data);

      Alert.alert(
        "Login Failed",
        error.response?.data?.message || "Invalid credentials"
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👨‍👩‍👧 Parent Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={login}
      >
        <Text style={styles.buttonText}>
          Login
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
    backgroundColor: "#f5f5f5",
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
  },

  input: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  button: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 10,
  },

  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
});