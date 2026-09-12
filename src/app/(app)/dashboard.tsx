// src/app/(app)/dashboard.tsx — Parent Dashboard
import AsyncStorage from "@react-native-async-storage/async-storage";

import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import API from "../../../services/api";
import { C, S } from "../../../theme";
import { connectSocket, TripStartedData } from "../../map/socketManager";

// ── Haversine distance ──────────────────────────────────
function getDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000, toR = (v: number) => v * Math.PI / 180;
  const dLat = toR(lat2 - lat1), dLng = toR(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toR(lat1))*Math.cos(toR(lat2))*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function statusColor(status: string) {
  if (status === "Active")      return C.success;
  if (status === "Maintenance") return C.warning;
  return C.textMuted;
}

// ── Pulsing live dot ────────────────────────────────────
function LiveDot({ active }: { active: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!active) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.8, duration: 900, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1,   duration: 900, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [active]);
  const color = active ? C.success : C.textMuted;
  return (
    <View style={{ width: 16, height: 16, alignItems: "center", justifyContent: "center" }}>
      {active && (
        <Animated.View style={{
          position: "absolute", width: 16, height: 16, borderRadius: 8,
          backgroundColor: C.success, opacity: 0.25, transform: [{ scale }],
        }} />
      )}
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
    </View>
  );
}

function InfoRow({ icon, label, value, accent }: any) {
  return (
    <View style={[styles.infoRow, { borderLeftColor: accent }]}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={1}>{value || "—"}</Text>
      </View>
    </View>
  );
}

export default function Dashboard() {
  const [parent,     setParent]     = useState<any>(null);
  const [bus,        setBus]        = useState<any>(null);
  const [eta,        setEta]        = useState("");
  const [busStatus,  setBusStatus]  = useState("Offline");
  const [distance,   setDistance]   = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // ✅ Trip status state
  const [tripActive,  setTripActive]  = useState(false);
  const [tripType,    setTripType]    = useState<"morning"|"return">("morning");
  const [tripStarted, setTripStarted] = useState<Date | null>(null);

  useEffect(() => {
    loadData();

    // ✅ Socket — listen for trip events on dashboard
    const cleanup = connectSocket({
      onConnect:    () => {},
      onDisconnect: () => {},

      onBusLocationUpdate: (busUpdate) => {
        // Refresh ETA when bus moves
        if (parent?.studentId?.pickupLatitude && busUpdate.latitude) {
          const dist = getDistance(
            busUpdate.latitude, busUpdate.longitude,
            parent.studentId.pickupLatitude,
            parent.studentId.pickupLongitude
          );
          setDistance(Math.round(dist));
          const mins = Math.ceil((dist / 1000 / 30) * 60);
          setEta(mins <= 1 ? "Arriving now" : `${mins} min`);
        }
      },

      // ✅ 1. Trip Started
      onTripStarted: (data: TripStartedData) => {
        console.log("🚌 Dashboard: trip started", data);
        setTripActive(true);
        setTripType(data.tripType);
        setTripStarted(new Date(data.startTime));
        setBusStatus("Active");
        loadData(); // refresh bus info
      },

      // ✅ 5. Trip Ended
      onTripEnded: (data) => {
        console.log("🛑 Dashboard: trip ended", data);
        setTripActive(false);
        setBusStatus("Offline");
        setEta("");
        setDistance(null);
      },
    });

    return cleanup;
  }, [parent]);

  const loadData = async () => {
    const data = await AsyncStorage.getItem("parent");
    if (!data) return;
    const p = JSON.parse(data);
    setParent(p);
    await fetchBus(p);
  };

  const fetchBus = async (p: any) => {
    const assignedBus = p?.studentId?.assignedBus;
    if (!assignedBus) return;
    try {
      const res = await API.get(`/buses/busno/${encodeURIComponent(assignedBus)}`);
      const busData = res.data;
      setBus(busData);
      setBusStatus(busData.status || "Offline");
      setLastUpdate(new Date());
      if (busData.status === "Active") setTripActive(true);

      const pickupLat = p.studentId?.pickupLatitude;
      const pickupLng = p.studentId?.pickupLongitude;
      if (busData.latitude && busData.longitude && pickupLat && pickupLng) {
        const dist = getDistance(busData.latitude, busData.longitude, pickupLat, pickupLng);
        setDistance(Math.round(dist));
        const mins = Math.ceil((dist / 1000 / 30) * 60);
        setEta(mins <= 1 ? "Arriving now" : `${mins} min`);
      }
    } catch (e) {
      console.log("Bus fetch error:", e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const logout = () =>
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out", style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove(["token", "parent"]);
          router.replace("/" as any);
        },
      },
    ]);

  const isActive   = busStatus === "Active";
  const fmtDist    = distance != null
    ? distance < 1000 ? `${distance} m away` : `${(distance/1000).toFixed(1)} km away`
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: C.bgLight }}>
      <StatusBar barStyle="light-content" backgroundColor={C.bgDark} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.parentName}>{parent?.name ?? "Parent"}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={{ fontSize: 17 }}>🚪</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.pillRow}>
          <View style={[styles.pill, { backgroundColor: isActive ? C.success+"22" : "rgba(255,255,255,0.07)" }]}>
            <LiveDot active={isActive} />
            <Text style={[styles.pillText, { color: isActive ? C.success : C.textMuted, marginLeft: 7 }]}>
              {isActive ? "Bus is Live" : "Bus Offline"}
            </Text>
          </View>
          {lastUpdate && (
            <View style={styles.pill}>
              <Text style={styles.pillText}>
                Updated {lastUpdate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 18, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
      >
        {/* ✅ Trip Status Card */}
        {tripActive && (
          <View style={styles.tripCard}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <Text style={{ fontSize: 22 }}>{tripType === "return" ? "🏠" : "🚌"}</Text>
              <View>
                <Text style={styles.tripCardTitle}>
                  {tripType === "return" ? "Return Trip Active" : "Morning Trip Active"}
                </Text>
                {tripStarted && (
                  <Text style={styles.tripCardSub}>
                    Started {tripStarted.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1 }} />
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveBadgeText}>LIVE</Text>
              </View>
            </View>
          </View>
        )}

        {/* ETA Hero Card */}
        {eta ? (
          <View style={styles.etaCard}>
            <View style={styles.etaLeft}>
              <Text style={styles.etaLabel}>Estimated Arrival</Text>
              <Text style={styles.etaValue}>{eta}</Text>
              {fmtDist && <Text style={styles.etaDist}>{fmtDist}</Text>}
            </View>
            <View style={styles.etaIcon}><Text style={{ fontSize: 36 }}>🚌</Text></View>
          </View>
        ) : null}

        {/* Child Info */}
        <Text style={styles.sectionLabel}>Child Details</Text>
        <View style={styles.section}>
          <InfoRow icon="👦" label="Student Name"  value={parent?.studentId?.name}        accent={C.purple ?? "#8B5CF6"} />
          <View style={styles.divider} />
          <InfoRow icon="🏫" label="Class"         value={parent?.studentId?.className}   accent={C.teal ?? "#0EA5E9"} />
          <View style={styles.divider} />
          <InfoRow icon="📍" label="Pickup Point"  value={parent?.studentId?.pickupPoint} accent={C.success} />
        </View>

        {/* Bus Info */}
        <Text style={styles.sectionLabel}>Bus Details</Text>
        <View style={styles.section}>
          <InfoRow icon="🚌" label="Bus Number" value={bus?.busNo}    accent={C.primary} />
          <View style={styles.divider} />
          <InfoRow icon="🗺️" label="Route"      value={bus?.route}   accent={C.warning} />
          <View style={styles.divider} />
          <View style={[styles.infoRow, { borderLeftColor: statusColor(busStatus) }]}>
            <Text style={styles.infoIcon}>🚦</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Bus Status</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: statusColor(busStatus) }} />
                <Text style={[styles.infoValue, { color: statusColor(busStatus) }]}>{busStatus}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Track Button */}
        <TouchableOpacity
          style={styles.trackBtn}
          onPress={() => router.push("/(app)/map" as any)}
          activeOpacity={0.85}
        >
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <Text style={{ fontSize: 22, marginRight: 10 }}>📍</Text>
            <View>
              <Text style={styles.trackBtnTitle}>Track Bus Live</Text>
              <Text style={styles.trackBtnSub}>See real-time location on map</Text>
            </View>
          </View>
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 20 }}>›</Text>
        </TouchableOpacity>

        {/* Info Banner */}
        <View style={styles.banner}>
          <Text style={{ fontSize: 18, marginRight: 10 }}>💡</Text>
          <Text style={styles.bannerText}>
            Pull down to refresh. You'll receive notifications when the bus is nearby.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const C_purple = "#8B5CF6";
const C_teal   = "#0EA5E9";

const styles = StyleSheet.create({
  header: {
    backgroundColor: C.bgDark, paddingTop: 56,
    paddingHorizontal: 20, paddingBottom: 28,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    overflow: "hidden", position: "relative",
  },
  circle1: { position:"absolute", width:220, height:220, borderRadius:110, backgroundColor:C_teal, opacity:0.07, top:-70, right:-50 },
  circle2: { position:"absolute", width:150, height:150, borderRadius:75,  backgroundColor:C.primary, opacity:0.06, bottom:-40, left:-20 },
  headerRow:  { flexDirection:"row", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 },
  greeting:   { color:C.textMuted, fontSize:13, marginBottom:3 },
  parentName: { color:C.textOnDark, fontSize:24, fontWeight:"800", letterSpacing:-0.4 },
  logoutBtn:  { backgroundColor:C.bgMid as any, padding:10, borderRadius:10 },
  pillRow:    { flexDirection:"row", gap:8 },
  pill:       { flexDirection:"row", alignItems:"center", backgroundColor:"rgba(255,255,255,0.07)", paddingHorizontal:12, paddingVertical:6, borderRadius:20 },
  pillText:   { color:C.textMuted, fontSize:12, fontWeight:"500" },

  // Trip status card
  tripCard: {
    backgroundColor: C.primary+"18", borderRadius:14, padding:16, marginBottom:16,
    borderWidth:1, borderColor:C.primary+"30",
  },
  tripCardTitle: { color:C.textOnDark as any, fontSize:15, fontWeight:"700" },
  tripCardSub:   { color:C.textMuted, fontSize:12, marginTop:2 },
  liveBadge:     { flexDirection:"row", alignItems:"center", backgroundColor:C.success+"22", paddingHorizontal:8, paddingVertical:4, borderRadius:12 },
  liveDot:       { width:6, height:6, borderRadius:3, backgroundColor:C.success, marginRight:5 },
  liveBadgeText: { color:C.success, fontSize:10, fontWeight:"800", letterSpacing:1 },

  // ETA card
  etaCard:  { backgroundColor:C.bgDark, borderRadius:S.radiusLg, padding:20, marginBottom:18, flexDirection:"row", alignItems:"center", justifyContent:"space-between", ...S.shadowMd },
  etaLeft:  { flex:1 },
  etaLabel: { color:C.textMuted, fontSize:11, fontWeight:"700", textTransform:"uppercase", letterSpacing:1, marginBottom:6 },
  etaValue: { color:C.textOnDark as any, fontSize:36, fontWeight:"800", letterSpacing:-1, lineHeight:42 },
  etaDist:  { color:C.textMuted, fontSize:13, marginTop:4 },
  etaIcon:  { width:64, height:64, borderRadius:18, backgroundColor:C.primary+"22", alignItems:"center", justifyContent:"center" },

  sectionLabel: { fontSize:10, fontWeight:"700", color:C.textMuted, textTransform:"uppercase", letterSpacing:1, marginBottom:8, marginTop:4, marginLeft:2 },
  section:      { backgroundColor:C.bgCard, borderRadius:S.radiusLg, marginBottom:18, ...S.shadow, overflow:"hidden" },
  infoRow:      { flexDirection:"row", alignItems:"center", paddingVertical:14, paddingHorizontal:16, borderLeftWidth:3 },
  infoIcon:     { fontSize:20, marginRight:14, width:28, textAlign:"center" },
  infoLabel:    { fontSize:10, fontWeight:"700", color:C.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:2 },
  infoValue:    { fontSize:15, fontWeight:"700", color:C.textPrimary },
  divider:      { height:1, backgroundColor:C.border, marginLeft:58 },

  trackBtn: {
    backgroundColor:C.primary, borderRadius:S.radiusLg, padding:18, marginBottom:16,
    flexDirection:"row", alignItems:"center", justifyContent:"space-between",
    shadowColor:C.primary, shadowOffset:{width:0,height:6}, shadowOpacity:0.35, shadowRadius:14, elevation:6,
  },
  trackBtnTitle: { color:"#fff", fontSize:16, fontWeight:"700", marginBottom:2 },
  trackBtnSub:   { color:"rgba(255,255,255,0.65)", fontSize:12 },

  banner: { flexDirection:"row", alignItems:"flex-start", backgroundColor:C_teal+"15", borderRadius:S.radiusMd, padding:14, borderWidth:1, borderColor:C_teal+"25" },
  bannerText: { flex:1, fontSize:13, color:C_teal, fontWeight:"500", lineHeight:20 },
});
