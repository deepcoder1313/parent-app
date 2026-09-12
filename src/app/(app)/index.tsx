// src/app/(app)/index.tsx  — Parent Login
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../../../services/api";
import { C } from "../../../theme";

// Optional — only if notificationService exists
let registerForPushNotifications: any = null;
try {
  registerForPushNotifications =
    require("../../../services/notificationService").registerForPushNotifications;
} catch {}

export default function LoginScreen() {
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [showPass,   setShowPass]   = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { checkLogin(); }, []);

  const checkLogin = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      // ✅ Fixed route path
      if (token) router.replace("/(app)/dashboard" as any);
      else setLoading(false);
    } catch { setLoading(false); }
  };

  const login = async () => {
    if (!email || !password) {
      Alert.alert("Missing fields", "Please enter your email and password.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await API.post("/parents/login", {
        email:    email.trim(),
        password: password.trim(),
      });

      await AsyncStorage.setItem("token",  res.data.token);
      await AsyncStorage.setItem("parent", JSON.stringify(res.data.parent));

      // Register push token if available
      if (registerForPushNotifications) {
        try {
          const pushToken = await registerForPushNotifications();
          if (pushToken) {
            await API.put(
              "/parents/push-token",
              { expoPushToken: pushToken },
              { headers: { Authorization: `Bearer ${res.data.token}` } }
            );
            console.log("✅ Push token registered:", pushToken);
          }
        } catch (e) {
          console.log("Push token registration failed (non-fatal):", e);
        }
      }

      // ✅ Fixed route path
      router.replace("/(app)/dashboard" as any);

    } catch (err: any) {
      Alert.alert("Login Failed", err.response?.data?.message || "Invalid email or password.");
    } finally { setSubmitting(false); }
  };

  // ── Splash ──────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.splash}>
        <StatusBar barStyle="light-content" backgroundColor={C.bgDark} />
        <View style={styles.logoBox}>
          <Text style={{ fontSize: 32 }}>👨‍👩‍👧</Text>
        </View>
        <Text style={styles.splashTitle}>BusTracker</Text>
        <Text style={styles.splashSub}>Parent Portal</Text>
        <ActivityIndicator color={C.primary2} style={{ marginTop: 40 }} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={C.bgDark} />
      <ScrollView
        style={{ flex: 1, backgroundColor: C.bgLight }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.circle1} />
          <View style={styles.circle2} />
          <View style={styles.logoBox}>
            <Text style={{ fontSize: 32 }}>👨‍👩‍👧</Text>
          </View>
          <Text style={styles.heroTitle}>BusTracker</Text>
          <Text style={styles.heroSub}>PARENT PORTAL</Text>
          <View style={styles.pillRow}>
            {["📍 Live Location", "⏱️ ETA Updates", "🔔 Safe Alerts"].map(p => (
              <View key={p} style={styles.featurePill}>
                <Text style={styles.featurePillText}>{p}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSub}>Sign in to track your child's bus</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <View style={styles.inputRow}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                style={styles.input}
                placeholder="parent@example.com"
                placeholderTextColor={C.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <View style={styles.inputRow}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor={C.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity
                onPress={() => setShowPass(!showPass)}
                style={{ padding: 4 }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={{ fontSize: 16 }}>{showPass ? "🙈" : "👁️"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
            onPress={login}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitText}>Sign In  →</Text>
            }
          </TouchableOpacity>

          <View style={styles.helperRow}>
            <View style={styles.helperDot} />
            <Text style={styles.helperText}>Account created by your school admin</Text>
          </View>
        </View>

        <Text style={styles.footer}>BusTracker Parent System · v1.0</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1, backgroundColor: C.bgDark,
    alignItems: "center", justifyContent: "center",
  },
  splashTitle: { color: C.textOnDark, fontSize: 28, fontWeight: "800", marginTop: 14, letterSpacing: -0.5 },
  splashSub:   { color: C.textMuted, fontSize: 13, marginTop: 4, letterSpacing: 2, textTransform: "uppercase" },

  hero: {
    backgroundColor: C.bgDark,
    paddingTop: 68, paddingBottom: 52,
    alignItems: "center",
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    overflow: "hidden", position: "relative",
  },
  circle1: { position:"absolute", width:240, height:240, borderRadius:120, backgroundColor:"#0EA5E9", opacity:0.07, top:-70, right:-60 },
  circle2: { position:"absolute", width:160, height:160, borderRadius:80,  backgroundColor:C.primary, opacity:0.07, bottom:-40, left:-30 },

  logoBox: {
    width:64, height:64, borderRadius:18,
    backgroundColor:C.primary,
    alignItems:"center", justifyContent:"center", marginBottom:14,
    shadowColor:C.primary, shadowOffset:{width:0,height:8},
    shadowOpacity:0.45, shadowRadius:16, elevation:8,
  },
  heroTitle: { color:C.textOnDark, fontSize:26, fontWeight:"800", letterSpacing:-0.4 },
  heroSub:   { color:C.textMuted, fontSize:11, fontWeight:"600", letterSpacing:2.5, textTransform:"uppercase", marginTop:5, marginBottom:20 },

  pillRow: { flexDirection:"row", gap:8, flexWrap:"wrap", justifyContent:"center", paddingHorizontal:20 },
  featurePill: { backgroundColor:"rgba(255,255,255,0.07)", paddingHorizontal:12, paddingVertical:6, borderRadius:20, borderWidth:1, borderColor:"rgba(255,255,255,0.06)" },
  featurePillText: { color:C.textMuted, fontSize:11, fontWeight:"500" },

  card: {
    backgroundColor:C.bgCard, marginHorizontal:20, marginTop:-24,
    borderRadius:20, padding:26,
    shadowColor:"#000", shadowOffset:{width:0,height:4}, shadowOpacity:0.10, shadowRadius:16, elevation:6,
    marginBottom:20,
  },
  cardTitle: { fontSize:20, fontWeight:"800", color:C.textPrimary, letterSpacing:-0.3 },
  cardSub:   { fontSize:13, color:C.textSub, marginTop:3, marginBottom:24 },

  fieldGroup: { marginBottom:16 },
  label:      { fontSize:10, fontWeight:"700", color:C.textMuted, letterSpacing:1, marginBottom:7 },
  inputRow:   { flexDirection:"row", alignItems:"center", borderWidth:1.5, borderColor:C.border, borderRadius:12, backgroundColor:"#F8FAFC", paddingHorizontal:14, paddingVertical:2 },
  inputIcon:  { fontSize:16, marginRight:10, opacity:0.6 },
  input:      { flex:1, fontSize:14, color:C.textPrimary, paddingVertical:12 },

  submitBtn: {
    backgroundColor:C.primary, borderRadius:12, paddingVertical:15,
    alignItems:"center", marginTop:8,
    shadowColor:C.primary, shadowOffset:{width:0,height:6}, shadowOpacity:0.38, shadowRadius:12, elevation:5,
  },
  submitText: { color:"#fff", fontSize:16, fontWeight:"700", letterSpacing:0.2 },

  helperRow: { flexDirection:"row", alignItems:"center", justifyContent:"center", marginTop:20 },
  helperDot: { width:6, height:6, borderRadius:3, backgroundColor:C.success, marginRight:8 },
  helperText:{ fontSize:12, color:C.textSub },

  footer: { textAlign:"center", color:C.textMuted, fontSize:11, paddingBottom:30 },
});
