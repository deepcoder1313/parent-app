// src/app/map.tsx
// ─────────────────────────────────────────────────────────
// Parent Live Map — orchestrator only
// All logic is in src/map/:
//   mapDataService.ts ← ALL API calls
//   buildMapHtml.ts   ← full Leaflet HTML string
//   socketManager.ts  ← socket.io connection
//   helpers.ts        ← haversine, formatEta, clamp
//   markerFactory.ts  ← Leaflet icon HTML
//   animations.ts     ← JS animation strings
//   routeDecoder.ts   ← OSRM fetch JS string
//   styles.ts         ← StyleSheet

import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { C } from "../../../theme";
import { buildMapHtml } from "../../map/buildMapHtml";
import { fetchAndDrawRoute } from "../../map/fetchAndDrawRoute";
import { loadMapData } from "../../map/mapDataService";
import { BusUpdate, connectSocket } from "../../map/socketManager";
import { mapStyles } from "../../map/styles";
export default function MapScreen() {
    console.log("🔵 MAPSCREEN RENDER");
  const webViewRef = useRef<WebView>(null!);
  useEffect(() => {
  console.log("🟢 MAPSCREEN COMPONENT MOUNTED");

  return () => {
    console.log("🔴 MAPSCREEN COMPONENT UNMOUNTED");
  };
}, []);

  // ── State ──────────────────────────────────────────────
  const [html,       setHtml]       = useState("");
  const mapReadyRef = useRef(false);
const pendingBusUpdateRef = useRef<BusUpdate | null>(null);
  const [busNo,      setBusNo]      = useState("");
  const [busStatus,  setBusStatus]  = useState("Unknown");
  const [connected,  setConnected]  = useState(false);
  const [eta,        setEta]        = useState("—");
  const [etaLoading, setEtaLoading] = useState(false);
  const [speed,      setSpeed]      = useState(0);
  const [distance,   setDistance]   = useState(0);
  const [progress,   setProgress]   = useState(0);
  const [tripEnded,  setTripEnded]  = useState(false);
  const [busLive, setBusLive] = useState(false);
const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [pickupName,     setPickupName]     = useState("Your Pickup");
  const [encodedPolyline, setEncodedPolyline] = useState("");
  const [driverName, setDriverName] = useState("Driver");
const [driverPhone, setDriverPhone] = useState("");
const [nextStopDistance, setNextStopDistance] = useState(0);
const [nextStopEta, setNextStopEta] = useState("--");
const [isArriving, setIsArriving] = useState(false);
const tripEndedRef = useRef(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const busNoRef     = useRef("");
  const totalDistRef = useRef(0);
  const pickupRef    = useRef({ lat: 0, lng: 0 });
  const pickupLatRef = useRef<number | null>(null);
const pickupLngRef = useRef<number | null>(null);

  // ── WebView bridge ─────────────────────────────────────
  const injectJs = (js: string) =>
    webViewRef.current?.injectJavaScript(`${js}\ntrue;`);


const moveBus = (
  lat: number,
  lng: number,
  heading: number,
  speed: number
) => {
  // Keep only the latest location until Leaflet is ready
  if (!mapReadyRef.current) {
    pendingBusUpdateRef.current = {
      latitude: lat,
      longitude: lng,
      heading,
      speed,
    };
    console.log("⏳ Map not ready; queued latest bus location");
    return;
  }

  webViewRef.current?.injectJavaScript(`
    if (window.smoothMoveBus) {
      window.smoothMoveBus(
        ${lat},
        ${lng},
        ${heading},
        ${speed}
      );
    }
    true;
  `);
};


  // ── Socket ──────────────────────────────────────────────
useEffect(() => {
  console.log("🚀 SOCKET EFFECT MOUNTED");

  const cleanup = connectSocket({
    onConnect: () => {
      console.log("🟢 PARENT SOCKET CONNECTED");
      setConnected(true);
    },

    onDisconnect: () => {
      console.log("🔴 PARENT SOCKET DISCONNECTED");
      setConnected(false);
    },


    
onTripStarted: (data) => {
  console.log("🟢 PARENT TRIP STARTED:", data);

  // Clear the previous trip's ended state
  tripEndedRef.current = false;
  setTripEnded(false);

  // The trip is active, but wait for a fresh GPS update
  setBusStatus("Active");
  setBusLive(false);
  setLastUpdate(null);
  setSpeed(0);
  setEta("--");

  console.log("✅ Parent ready for new trip locations");
},




    onBusLocationUpdate: (bus: BusUpdate) => {
      console.log(
        "📡 PARENT RECEIVED BUS:",
        bus.latitude,
        bus.longitude
      );

      if (tripEndedRef.current) return;

      console.log("🚌 LIVE BUS:", bus);

      setBusLive(true);
      setLastUpdate(new Date());

      moveBus(
  bus.latitude,
  bus.longitude,
  bus.heading ?? 0,
  bus.speed ?? 0
);

      if (bus.speed !== undefined) {
        setSpeed(bus.speed);
      }

      if (bus.distance !== undefined) {
        setDistance(bus.distance);
      }

      if (bus.eta !== undefined) {
        setEta(String(bus.eta));
      }
    },

    onTripEnded: (data) => {
      console.log("🛑 PARENT TRIP ENDED:", data);

      if (data.busNo !== busNoRef.current) return;

      tripEndedRef.current = true;

      setTripEnded(true);
      setBusStatus("Offline");
      setEta("--");
      setSpeed(0);
      setBusLive(false);
setLastUpdate(null);
    },
  });

  return () => {
    console.log("💥 SOCKET EFFECT UNMOUNTING");
    cleanup();
  };
}, []);

useEffect(() => {
  if (!lastUpdate) return;

  const timer = setInterval(() => {
    const elapsed =
      Date.now() - lastUpdate.getTime();

    if (elapsed > 15000) {
      setBusLive(false);
    }
  }, 3000);

  return () => clearInterval(timer);
}, [lastUpdate]);

  // ── Load map — one call, service handles everything ────
  useEffect(() => { loadMap(); }, []);

 const loadMap = async () => {
  try {
    const data = await loadMapData();
    if (!data) return;

    setPickupName(data.pickupName);
    setBusNo(data.busLabel);
    setDriverName(data.driverName || "Driver");
setDriverPhone(data.driverPhone || "");
    busNoRef.current = data.busLabel;
    pickupRef.current = { lat: data.pickupLat, lng: data.pickupLng };
    setBusStatus(data.busStatus);
    setEta(data.etaText);
    setDistance(data.distanceMeters);
    totalDistRef.current = data.totalDistance;
    pickupLatRef.current = data.pickupLat;
pickupLngRef.current = data.pickupLng;
setDriverName(data.driverName || "Driver");
setDriverPhone(data.driverPhone || "");
    // ─────────────────────────────────────────────────────
    // Fetch polyline FIRST
    // Then build HTML with the polyline embedded
    // ─────────────────────────────────────────────────────
    let polyline = "";

    if (data.pickupLat && data.pickupLng) {
      try {
      const result = await fetchAndDrawRoute(
  webViewRef,
  data.busLat,
  data.busLng,
  data.pickupLat,
  data.pickupLng,
  true // dryRun: fetch only, don't inject into WebView yet
);

        if (result) {
          // encodedPolyline may not be declared on the RouteResult type — coerce to any
          polyline = (result as any).encodedPolyline ?? "";

          console.log(
            "🔥 POLYLINE RECEIVED:",
            polyline
          );

          console.log(
            "🔥 DECODED POINTS:",
            (result as any).decodedPoints?.length ?? 0
          );

          setEta(
            result.durationMinutes <= 1
              ? "Arriving!"
              : `${result.durationMinutes} min`
          );
        }
      } catch (err) {
        console.log("❌ Route fetch failed:", err);
      }
    }

    // Save polyline
    setEncodedPolyline(polyline);

    console.log(
      "🔥 POLYLINE SENT TO HTML:",
      polyline
    );

    // ─────────────────────────────────────────────────────
    // IMPORTANT:
    // Build HTML AFTER polyline is available
    // ─────────────────────────────────────────────────────
    const htmlContent = buildMapHtml({
      busLat: data.busLat,
      busLng: data.busLng,
      busLabel: data.busLabel,

      pickupLat: data.pickupLat,
      pickupLng: data.pickupLng,
      pickupName: data.pickupName,

      schoolLat: data.schoolLat,
      schoolLng: data.schoolLng,
      schoolName: data.schoolName,

      stops: data.stops,

      // ⭐ THIS WAS MISSING
      encodedPolyline: polyline,
    });
    mapReadyRef.current = false;
setHtml(htmlContent);
  

  } catch (err) {
    console.log("Map load error:", err);
  }
};
function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) {
    return "--";
  }

  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  return `${(meters / 1000).toFixed(1)} km`;
}
  // ── Progress animation ──────────────────────────────────
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress, duration: 600, useNativeDriver: false,
    }).start();
  }, [progress]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100], outputRange: ["0%", "100%"],
  });

  function distanceBetweenMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.atan2(
    Math.sqrt(a),
    Math.sqrt(1 - a)
  );
}
  // ── Loading screen ──────────────────────────────────────
  if (!html) {
    return (
      <View style={mapStyles.loading}>
        <StatusBar barStyle="light-content" backgroundColor={C.bgDark} />
        <View style={mapStyles.loadingIcon}>
          <Text style={{ fontSize: 32 }}>🚌</Text>
        </View>
        <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 16 }} />
        <Text style={mapStyles.loadingText}>Finding your bus…</Text>
        <Text style={mapStyles.loadingSubText}>Connecting to live map</Text>
      </View>
    );
  }

  const isActive = busStatus === "Active" && !tripEnded;

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor={C.bgDark} />

      {/* ── Top bar ─────────────────────────────────────── */}
      <View style={mapStyles.topBar}>
        <TouchableOpacity
          onPress={() => router.canGoBack() ? router.back() : router.replace("/")}
          style={mapStyles.backBtn}
          hitSlop={{ top:10, bottom:10, left:10, right:10 }}
        >
          <Text style={mapStyles.backArrow}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex:1, marginLeft:12 }}>
          <Text style={mapStyles.topTitle}>Live Tracking</Text>
          {busNo ? <Text style={mapStyles.topSub}>🚌 Bus {busNo}</Text> : null}
        </View>
        <View style={[mapStyles.connPill, {
         backgroundColor: busLive
  ? "rgba(16,185,129,0.15)"
  : "rgba(244,63,94,0.12)",
        }]}>
          <View style={[mapStyles.connDot, {
            backgroundColor: busLive ? C.success : C.danger,
          }]} />
          <Text style={[mapStyles.connText, {
           color: busLive ? C.success : C.danger,
          }]}>
           {busLive ? "Live" : "Offline"}
          </Text>
        </View>
      </View>

      {/* ── WebView map ─────────────────────────────────── */}
      
          <WebView
        ref={webViewRef}
        style={{
            flex: 1,
            height: "100%",
            width: "100%",
        }}
        originWhitelist={["*"]}
        source={{ html }}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
   
onMessage={(e) => {
  const message = e.nativeEvent.data;
  console.log("WebView:", message);

  if (message.includes("Map fully initialized")) {
    mapReadyRef.current = true;
    console.log("✅ Parent map is ready for GPS updates");

    const pending = pendingBusUpdateRef.current;

    if (pending) {
      pendingBusUpdateRef.current = null;

      moveBus(
        pending.latitude,
        pending.longitude,
        pending.heading ?? 0,
        pending.speed ?? 0
      );
    }
  }
}}

    />
      {/* ── Glass status card ────────────────────────────── */}
      <View style={mapStyles.statusCardWrapper}>
        <BlurView intensity={55} tint="dark" style={mapStyles.statusCard}>
          <View style={mapStyles.statusHeaderRow}>
            
            <View style={mapStyles.busBadge}>
              <Text style={mapStyles.busBadgeEmoji}>🚌</Text>
            </View>
            <Text style={mapStyles.statusBusNo} numberOfLines={1}>
              {busNo || "—"}
            </Text>
            <View style={{ flex: 1 }} />
            <View style={[mapStyles.liveDot, {
              backgroundColor: tripEnded
                ? "#EF4444"
                : connected ? "#10B981" : "#64748B",
            }]} />
          </View>

          {/* ── Driver information ─────────────────────────── */}
<View
  style={{
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  }}
>
  <Text style={{ fontSize: 22, marginRight: 10 }}>
    👨‍✈️
  </Text>

  <View style={{ flex: 1 }}>
    <Text
      style={{
        color: "#94A3B8",
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 0.8,
      }}
    >
      DRIVER
    </Text>

    <Text
      style={{
        color: "#F8FAFC",
        fontSize: 14,
        fontWeight: "700",
        marginTop: 2,
      }}
      numberOfLines={1}
    >
      {driverName}
    </Text>
  </View>

  {driverPhone ? (
    <TouchableOpacity
      onPress={() => {
        Alert.alert(
          "Driver Contact",
          driverPhone
        );
      }}
      style={{
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 10,
        backgroundColor: "rgba(99,102,241,0.15)",
      }}
    >
      <Text
        style={{
          color: "#818CF8",
          fontWeight: "700",
        }}
      >
        📞 Call
      </Text>
    </TouchableOpacity>
  ) : null}
</View>

          <View style={mapStyles.statusStatsRow}>
            <View style={mapStyles.statCol}>
              <Text style={mapStyles.statLabel}>ETA</Text>
              <Text
                style={[mapStyles.statValue, {
                  color: tripEnded ? "#EF4444" : "#10B981",
                }]}
                numberOfLines={1}
              >
              {tripEnded
  ? "Done"
  : !busLive
    ? "--"
    : etaLoading
      ? "…"
      : eta || "--"}
              </Text>
            </View>
            <View style={mapStyles.statDivider} />
            <View style={mapStyles.statCol}>
              <Text style={mapStyles.statLabel}>SPEED</Text>
              <Text style={mapStyles.statValue} numberOfLines={1}>
                {Math.round(speed)} km/h
              </Text>
            </View>
            <View style={mapStyles.statDivider} />
            <View style={mapStyles.statCol}>
              <Text style={mapStyles.statLabel}>DISTANCE</Text>
              <Text style={mapStyles.statValue} numberOfLines={1}>
  {formatDistance(distance)}
</Text>
            </View>
          </View>

          <View style={mapStyles.statusProgressTrack}>
            <Animated.View
              style={[mapStyles.statusProgressFillWrap, { width: progressWidth }]}
            >
              <LinearGradient
                colors={["#6366F1", "#10B981"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>
          <Text style={mapStyles.statusProgressPct}>
            {progress}% of route completed
          </Text>
<View style={mapStyles.nextStopRow}>

  <Text style={mapStyles.nextStopLabel}>
    {isArriving ? "ARRIVING" : "NEXT STOP"}
  </Text>

  <Text
    style={[
      mapStyles.nextStopName,
      isArriving && {
        color: "#10B981",
      },
    ]}
    numberOfLines={1}
  >
    {isArriving ? "🟢" : "📍"} {pickupName}
  </Text>

  {!isArriving && (
    <Text
      style={{
        color: "#94A3B8",
        fontSize: 11,
        marginTop: 3,
      }}
    >
      {nextStopDistance > 0
        ? `${formatDistance(nextStopDistance)} • ~${nextStopEta}`
        : "--"}
    </Text>
  )}

  {isArriving && (
    <Text
      style={{
        color: "#10B981",
        fontSize: 11,
        fontWeight: "700",
        marginTop: 3,
      }}
    >
      Bus is very close to your pickup point
    </Text>
  )}

</View>
        </BlurView>
      </View>

      {/* ── Bottom bar ──────────────────────────────────── */}
      <View style={mapStyles.bottomBar}>
        <View style={mapStyles.bottomItem}>
          <Text style={mapStyles.bottomLabel}>ETA</Text>
          <Text style={[mapStyles.bottomValueLg, { color: C.success }]}>
           {tripEnded
  ? "Done"
  : !busLive
    ? "--"
    : etaLoading
      ? "…"
      : eta || "--"}
          </Text>
        </View>
        <View style={mapStyles.bottomDivider} />
        <View style={mapStyles.bottomItem}>
          <Text style={mapStyles.bottomLabel}>STATUS</Text>
          <View style={{ flexDirection:"row", alignItems:"center", gap:5 }}>
            <View style={[mapStyles.statusDot, {
              backgroundColor: isActive ? C.success : C.textMuted,
            }]} />
            <Text style={[mapStyles.bottomValue, {
              color: isActive ? C.success : C.textMuted,
            }]}>
              {busStatus}
            </Text>
          </View>
        </View>
        <View style={mapStyles.bottomDivider} />
        <View style={mapStyles.bottomItem}>
          <Text style={mapStyles.bottomLabel}>ROUTE</Text>
          <View style={{ gap:3 }}>
            <View style={{ flexDirection:"row", alignItems:"center", gap:5 }}>
              <View style={{ width:16, height:3, borderRadius:2, backgroundColor:"#3B82F6" }} />
              <Text style={mapStyles.legendText}>Ahead</Text>
            </View>
          
          </View>
        </View>
      </View>
    </View>
  );
}
