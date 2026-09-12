// app/(app)/map.tsx — Parent Live Map
// Phase 1: Bus + Pickup + Route ✅ (already had)
// Phase 2: School marker ✅
// Phase 3: OSRM real road route ✅ (already had)
// Phase 4: Bus stops along route ✅
// Phase 5: Smooth bus animation ✅
// Phase 6: Progress bar ✅
// Phase 7: Arrival notification ✅

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Asset } from "expo-asset";
import { router } from "expo-router";
//import * as Notifications from "expo-notifications";
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
import { io } from "socket.io-client";
import { GOOGLE_MAPS_API_KEY } from "../../constants/config";
import API from "../../services/api";
import { C } from "../../theme";


// ⚠️ Change to your WiFi IP
const BACKEND = "http://192.168.31.237:5000";
const socket = io(BACKEND, {
  autoConnect: false,
});


// ── Phase 7: Setup notifications ────────────────────────────
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge:  false,
//     shouldShowBanner: true,
//     shouldShowList: true,
 // }),
//});

export default function MapScreen() {
  const webViewRef = useRef<WebView>(null);

  const smoothMoveBus = (lat: string | number, lng: string | number, heading: string | number) => {
    webViewRef.current?.injectJavaScript(`
      if (window.smoothMoveBus) {
        window.smoothMoveBus(${JSON.stringify(lat)}, ${JSON.stringify(lng)}, ${JSON.stringify(heading)});
      }
      true;
    `);
  };

  // Existing state
  const [html,        setHtml]        = useState("");
  const [busNo,       setBusNo]       = useState("");
  const [busStatus,   setBusStatus]   = useState("Unknown");
  const [connected,   setConnected]   = useState(false);
  const [updateCount, setUpdateCount] = useState(0);
  const [eta, setEta] = useState<any>("—");
  const [etaLoading,  setEtaLoading]  = useState(false);
  const [distance, setDistance] = useState(0);
  const [busLocation, setBusLocation] = useState({ latitude: 0, longitude: 0 });
  const [speed, setSpeed] = useState(0);
  
  // Phase 6: Progress
  const [progress,      setProgress]      = useState(0);   // 0–100
  const [totalDistance, setTotalDistance] = useState(0);   // meters from school to pickup
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [tripEnded, setTripEnded] = useState(false);
  
  

  // Phase 7: Notification tracking
  const notified5min  = useRef(false);
  const notified1min  = useRef(false);
  const notifiedArriv = useRef(false);

  const pickupRef     = useRef({ lat: 0, lng: 0 });
  const busNoRef      = useRef("");

  const lastSentLocation = useRef<{
  latitude: number;
  longitude: number;
} | null>(null);

  // ── Phase 7: Request notification permission ─────────────
  useEffect(() => {
    // Notifications.requestPermissionsAsync();
  }, []);

  useEffect(() => { loadMap(); }, []);

  // ── Socket ───────────────────────────────────────────────
useEffect(() => {

  const setupSocket = async () => {



    socket.connect();

    socket.on("connect", () => {

      console.log("✅ Socket Connected");

      setConnected(true);




    });

    socket.on("disconnect", () => {
      setConnected(false);
    });
    if (tripEnded) return;

    socket.on("busLocationUpdated", (bus) => {
      socket.on("tripEnded", (data) => {
        Alert.alert(
  "🛑 Trip Completed",
  "Today's bus trip has ended."
);

  if (data.busNo !== busNoRef.current) return;
  

  console.log("🛑 Trip Ended");

  setTripEnded(true);

  setBusStatus("Offline");

  setEta("--");

  setSpeed(0);
  

});

      setBusLocation({
        latitude: bus.latitude,
        longitude: bus.longitude,
      });

      if (bus.distance !== undefined)
        setDistance(bus.distance);

      if (bus.eta !== undefined)
        setEta(bus.eta);

      if (bus.speed !== undefined)
        setSpeed(bus.speed);

      smoothMoveBus(
        `${bus.latitude}`,
        `${bus.longitude}`,
        `${bus.heading || 0}`
      );

      setUpdateCount(c => {
        const next = c + 1;

        if (next % 5 === 0) {
         // refreshETA(
           // busNoRef.current,
            //pickupRef.current.lat,
           // pickupRef.current.lng
         // );
        }

        return next;
      });

    });

  };

  setupSocket();

  return () => {
    socket.off("connect");
    socket.off("disconnect");
    socket.off("busLocationUpdated");
    socket.off("tripEnded");
    socket.disconnect();
  };

}, []);
  
  // ── Phase 6: Animate progress bar when progress changes ──
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue:  progress,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  // ── Phase 7: Fire notifications based on ETA ─────────────
 {/*} useEffect(() => {
    const mins = parseInt(eta);
    if (isNaN(mins)) return;

    if (mins <= 5 && mins > 1 && !notified5min.current) {
      notified5min.current = true;
      sendNotification("🚌 Bus is 5 minutes away", "Get your child ready at the pickup point!");
    }
    if (mins <= 1 && !notified1min.current) {
      notified1min.current = true;
      sendNotification("🚌 Bus arriving now!", "Your child's bus is almost at the pickup point.");
    }
    if (eta === "Arriving!" && !notifiedArriv.current) {
      notifiedArriv.current = true;
      sendNotification("✅ Bus has arrived", "The bus is at your pickup point.");
    }
  }, [eta]);*/}

  //const sendNotification = async (title: string, body: string) => {
    // await Notifications.scheduleNotificationAsync({  
    //   content: { title, body, sound: true },
    //   trigger: null,  // fire immediately
    // });
 // };

  const refreshETA = async (bNo: string, pLat: number, pLng: number) => {
    if (!bNo || !pLat || !pLng) return;
    try {
      setEtaLoading(true);
      const res  = await API.get(
        `/eta/${encodeURIComponent(bNo)}?pickupLat=${pLat}&pickupLng=${pLng}`
      );
      const mins = res.data.etaMinutes;
      const dist = res.data.distanceMeters;

      if (mins !== null) {
        setEta(mins <= 1 ? "Arriving!" : `${mins} min`);
      }

      // Phase 6: Update progress (remaining distance ÷ total distance)
      if (dist && totalDistance > 0) {
        const pct = Math.max(0, Math.min(100,
          Math.round((1 - dist / totalDistance) * 100)
        ));
        setProgress(pct);

        // Also update progress bar inside the map
        webViewRef.current?.injectJavaScript(`
          window.onerror = function(message, source, lineno, colno){
    window.ReactNativeWebView.postMessage(
        message + " Line:" + lineno
    );
};
true;
          updateProgressBar(${pct});
          true;
        `);
      }
    } catch { /* keep last known */ }
    finally { setEtaLoading(false); }
  };

  const loadMap = async () => {
    const busAsset = Asset.fromModule(require("../../assets/images/bus.png"));
await busAsset.downloadAsync();

const busImage = busAsset.localUri || busAsset.uri;
    try {
      const raw = await AsyncStorage.getItem("parent");
      if (!raw) return;
      const parent = JSON.parse(raw);

      const assignedBus = parent?.studentId?.assignedBus;
      const pickupLat   = parent?.studentId?.pickupLatitude  || 0;
      const pickupLng   = parent?.studentId?.pickupLongitude || 0;
      const pickupName  = parent?.studentId?.pickupPoint     || "Your Pickup";

      if (!assignedBus) return;
      setBusNo(assignedBus);
      busNoRef.current = assignedBus;
      pickupRef.current = { lat: pickupLat, lng: pickupLng };

      const busRes = await API.get(`/buses/busno/${encodeURIComponent(assignedBus)}`);
      const bus    = busRes.data;
      setBusStatus(bus.status || "Unknown");

      const busLat = bus.latitude  || 30.484;
      const busLng = bus.longitude || 76.604;

      // Initial ETA
      const etaRes = await API.get(
        `/eta/${encodeURIComponent(assignedBus)}?pickupLat=${pickupLat}&pickupLng=${pickupLng}`
      ).catch(() => null);

      if (etaRes?.data?.etaMinutes != null) {
        setEta(etaRes.data.etaMinutes <= 1 ? "Arriving!" : `${etaRes.data.etaMinutes} min`);
        if (etaRes.data.distanceMeters) {
          setTotalDistance(etaRes.data.distanceMeters * 1.3); // rough total = current + buffer
        }
      }

      // Phase 2: School coords from route
      let schoolLat = 0, schoolLng = 0, schoolName = "School";
      try {
        const routesRes = await API.get("/routes");
        const matched   = (routesRes.data as any[]).find(r =>
          bus.route && r.routeName &&
          bus.route.toLowerCase().includes(r.routeName.toLowerCase())
        );
        if (matched?.schoolLatitude && matched?.schoolLongitude) {
          schoolLat  = matched.schoolLatitude;
          schoolLng  = matched.schoolLongitude;
          schoolName = matched.destination || "School";
          // Phase 6: Set total distance = school → pickup
          if (pickupLat && pickupLng) {
            const d = haversine(schoolLat, schoolLng, pickupLat, pickupLng);
            setTotalDistance(d);
          }
        }
      } catch { /* optional */ }

      // Phase 4: Get stops for this route (students on same bus)
      let stops: Array<{ lat: number; lng: number; name: string }> = [];
      try {
        const studRes = await API.get("/students");
        const students: any[] = studRes.data;
        stops = students
          .filter(s =>
            s.assignedBus === assignedBus &&
            s.pickupLatitude  && s.pickupLatitude  !== 0 &&
            s.pickupLongitude && s.pickupLongitude !== 0
          )
          .map(s => ({
            lat:  s.pickupLatitude,
            lng:  s.pickupLongitude,
            name: s.pickupPoint || s.name,
          }));
      } catch { /* optional */ }

const htmlContent = buildMapHtml({
  busLat,
  busLng,
  busLabel: assignedBus,
  pickupLat,
  pickupLng,
  pickupName,
  schoolLat,
  schoolLng,
  schoolName,
  stops,
  googleApiKey: GOOGLE_MAPS_API_KEY,
  busImage,
});

console.log("HTML Generated:", htmlContent.substring(0, 300));

setHtml(htmlContent);
    } catch (err) {
      console.log("Map load error:", err);
    }
  };

  // Haversine for total distance calculation
  const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R    = 6371000;
    const toR  = (v: number) => v * Math.PI / 180;
    const dLat = toR(lat2 - lat1);
    const dLng = toR(lng2 - lng1);
    const a    = Math.sin(dLat/2)**2 + Math.cos(toR(lat1))*Math.cos(toR(lat2))*Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  // ── Build HTML ───────────────────────────────────────────
  const buildMapHtml = ({
    busLat, busLng, busLabel,
    pickupLat, pickupLng, pickupName,
    schoolLat, schoolLng, schoolName,
    stops,
    googleApiKey,
    busImage,
  }: any) => {
    const stopsJson = JSON.stringify(stops || []);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <style>
    html,body,#map { width:100%; height:100%; margin:0; padding:0; background:#0F172A; }

    /* Phase 5: smooth marker transition */
    .leaflet-marker-icon { transition: transform 0.8s cubic-bezier(0.25,0.46,0.45,0.94) !important; }

    /* Phase 7: pulse ring */
    @keyframes pulse {
      0%   { transform:scale(1);   opacity:0.55; }
      100% { transform:scale(2.5); opacity:0; }
    }
    .pulse-ring {
      position:absolute; top:50%; left:50%;
      transform:translate(-50%,-50%);
      width:44px; height:44px; border-radius:50%;
      background:rgba(99,102,241,0.4);
      animation:pulse 1.8s ease-out infinite;
      pointer-events:none;
    }

    /* Phase 6: in-map progress overlay */
    #progress-overlay {
      position:fixed; bottom:0; left:0; right:0;
      background:rgba(15,23,42,0.92);
      padding:10px 16px 14px;
      z-index:1000;
      border-top:1px solid rgba(255,255,255,0.06);
      display:none;
    }
    #progress-overlay.visible { display:block; }
    #progress-labels {
      display:flex; justify-content:space-between;
      font-size:11px; color:#94A3B8; margin-bottom:6px;
      font-family:sans-serif;
    }
    #progress-track {
      height:6px; background:rgba(255,255,255,0.1);
      border-radius:3px; overflow:hidden;
    }
    #progress-fill {
      height:100%; width:0%;
      background:linear-gradient(90deg,#6366F1,#10B981);
      border-radius:3px;
      transition:width 0.6s ease;
    }
    #progress-pct {
      text-align:center; color:#F8FAFC;
      font-size:12px; font-weight:700;
      margin-top:5px; font-family:sans-serif;
    }
  </style>
</head>
<body>
<div id="map"></div>

<!-- Phase 6: Progress overlay inside map -->
<div id="progress-overlay">
  <div id="progress-labels">
    <span>🏫 ${schoolName}</span>
    <span>📍 ${pickupName}</span>
  </div>
  <div id="progress-track">
    <div id="progress-fill"></div>
  </div>
  <div id="progress-pct">0% of route completed</div>
</div>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
window.ReactNativeWebView.postMessage(
  "Leaflet loaded: " + (typeof L)
);
</script>
<script>
window.onerror = function(message, source, line, column, error) {
    window.ReactNativeWebView.postMessage(
        JSON.stringify({
            type: "JS_ERROR",
            message,
            line,
            column
        })
    );
};
  // ── State ──────────────────────────────────────────────
  var busLat    = ${busLat};
  var busLng    = ${busLng};
  var pickupLat = ${pickupLat};
  var pickupLng = ${pickupLng};
  var schoolLat = ${schoolLat};
  var schoolLng = ${schoolLng};
  var stops     = ${stopsJson};

  var routeLayer  = null;
  var fullRouteCoords = [];
  var trailCoords = [[busLat, busLng]];
  var lastRouteUpdate = Date.now();

  // Phase 5: animation target
  var currentHeading = 0;
  var targetLat = busLat;
  var targetLng = busLng;
  var currentLat = busLat;
  var currentLng = busLng;

  // ── Map ────────────────────────────────────────────────
  var map = L.map('map', { zoomControl:false, attributionControl:false })
    .setView([busLat, busLng], 15);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom:19
  }).addTo(map);
  L.control.zoom({ position:'bottomright' }).addTo(map);

  // ── Icons ──────────────────────────────────────────────

  // Bus — pulsing indigo (Phase 1)
var busIcon = L.divIcon({
  className: "",
  html: '
  <div id="bus-container"
     style="
      position:relative;
      width:70px;
      height:70px;
      display:flex;
      align-items:center;
      justify-content:center;
     ">

    <div class="pulse-ring"></div>

    <img
      id="bus-body"
      src="${busImage}"
      style="
        width:52px;
        height:52px;
        transform:rotate(0deg);
        transition:transform .5s linear;
      "
    />

  </div>
  ',
    iconSize:[70,70],
    iconAnchor:[35,35],
});
  // Pickup — emerald (Phase 1)
  var pickupIcon = L.divIcon({
    className:'',
    html: '<div style="background:#10B981;width:42px;height:42px;border-radius:50%;'
        + 'display:flex;align-items:center;justify-content:center;font-size:20px;'
        + 'box-shadow:0 4px 14px rgba(16,185,129,0.55);border:3px solid white;">📍</div>',
    iconSize:[42,42], iconAnchor:[21,42],
  });

  // School — amber (Phase 2)
  var schoolIcon = L.divIcon({
    className:'',
    html: '<div style="background:#F59E0B;width:42px;height:42px;border-radius:50%;'
        + 'display:flex;align-items:center;justify-content:center;font-size:20px;'
        + 'box-shadow:0 4px 14px rgba(245,158,11,0.55);border:3px solid white;">🏫</div>',
    iconSize:[42,42], iconAnchor:[21,42],
  });

  // Stop — slate (Phase 4)
  function makeStopIcon(name) {
    return L.divIcon({
      className:'',
      html: '<div style="background:#334155;width:34px;height:34px;border-radius:50%;'
          + 'display:flex;align-items:center;justify-content:center;font-size:16px;'
          + 'box-shadow:0 2px 8px rgba(0,0,0,0.4);border:2px solid #64748B;">🚏</div>',
      iconSize:[34,34], iconAnchor:[17,34],
    });
  }

  // ── Add markers ────────────────────────────────────────

  // Phase 1: Bus
  var busMarker = L.marker([busLat,busLng], { icon:busIcon, zIndexOffset:1000 })
    .addTo(map)
    .bindPopup('<b>🚌 ' + '${busLabel}' + '</b><br><span style="color:#818CF8">Live location</span>');

  // Phase 1: Pickup
  ${pickupLat && pickupLng ? `
  L.marker([pickupLat,pickupLng], { icon:pickupIcon })
    .addTo(map)
    .bindPopup('<b>📍 ${pickupName}</b><br>Your pickup stop');
  ` : ""}

  // Phase 2: School
  ${schoolLat && schoolLng ? `
  L.marker([schoolLat,schoolLng], { icon:schoolIcon })
    .addTo(map)
    .bindPopup('<b>🏫 ${schoolName}</b><br>School destination');
  document.getElementById('progress-overlay').classList.add('visible');
  ` : ""}

  // Phase 4: Bus stops
  stops.forEach(function(stop) {
    L.marker([stop.lat, stop.lng], { icon:makeStopIcon(stop.name), zIndexOffset:500 })
      .addTo(map)
      .bindPopup('<b>🚏 ' + stop.name + '</b>');
  });

  // Green trail (Phase 1)
  var trailLine = L.polyline(trailCoords, {
    color:'#10B981', weight:3, opacity:0.5
  }).addTo(map);

  // ── Phase 3: OSRM road route ───────────────────────────
  function fetchRoute(fromLat, fromLng, toLat, toLng) {
    if (!toLat || !toLng) return;
var url =
"https://maps.googleapis.com/maps/api/directions/json?" +
"origin=" + fromLat + "," + fromLng +
"&destination=" + toLat + "," + toLng +
"&mode=driving" +
"&key=${googleApiKey}";

    fetch(url)
  .then(function(r){
    console.log("Route response", r);
    return r.json();
  })
      .then(function(r){ return r.json(); })
      .then(function(data){
      window.ReactNativeWebView.postMessage(
  JSON.stringify(data)
);
        if (!data.routes || !data.routes[0]) return;
        if (routeLayer) map.removeLayer(routeLayer);
        var coords = data.routes[0].geometry.coordinates.map(function(c){
          return [c[1], c[0]];
        });
        fullRouteCoords = coords;
        routeLayer = L.polyline(coords, {
          color:'#3B82F6', weight:6, opacity:0.88,
          lineCap:'round', lineJoin:'round',
        }).addTo(map);
        busMarker.bringToFront();
      })
      .catch(function(){
        if (routeLayer) map.removeLayer(routeLayer);
        routeLayer = L.polyline(
          [[fromLat,fromLng],[toLat,toLng]],
          { color:'#3B82F6', weight:4, dashArray:'10,8', opacity:0.7 }
        ).addTo(map);
      });
  }

  // Initial route draw + fit bounds
  ${pickupLat && pickupLng ? `
  fetchRoute(busLat, busLng, pickupLat, pickupLng);
  try {
    var pts = [[busLat,busLng]];
    pts.push([pickupLat,pickupLng]);
    ${schoolLat && schoolLng ? `pts.push([schoolLat,schoolLng]);` : ""}
    if (pts.length > 1) map.fitBounds(L.latLngBounds(pts), { padding:[80,40] });
  } catch(e){}
  ` : ""}

  // ── Phase 5: Smooth animation ──────────────────────────
  var animStart    = null;
  var animDuration = 800;
  var fromLat = busLat, fromLng = busLng;

  function animateBus(timestamp) {
    if (!animStart) animStart = timestamp;
    var elapsed = timestamp - animStart;
    var t = Math.min(elapsed / animDuration, 1);
    t = 1 - Math.pow(1 - t, 3); // ease-out cubic
    var lat = fromLat + (targetLat - fromLat) * t;
    var lng = fromLng + (targetLng - fromLng) * t;
    busMarker.setLatLng([lat, lng]);
    if (t < 1) {
      requestAnimationFrame(animateBus);
    } else {
      fromLat = targetLat;
      fromLng = targetLng;
      animStart = null;
    }
  }

  // ── Phase 6: Progress bar update ──────────────────────
  window.updateProgressBar = function(pct) {
    var fill = document.getElementById('progress-fill');
    var label = document.getElementById('progress-pct');
    if (fill)  fill.style.width = pct + '%';
    if (label) label.textContent = pct + '% of route completed';
  };

  // ── Called from React Native on every socket update ────
  // Phase 5: smoothMoveBus instead of setLatLng directly
  function getNearestIndex(lat, lng) {

    if (!fullRouteCoords.length) return 0;

    var nearest = 0;
    var minDist = Number.MAX_VALUE;

    fullRouteCoords.forEach(function(point, index){

        var d =
            Math.pow(point[0]-lat,2) +
            Math.pow(point[1]-lng,2);

        if(d < minDist){
            minDist = d;
            nearest = index;
        }

    });

    return nearest;
}


  window.smoothMoveBus = function(lat, lng, heading) {
    targetLat = lat;
    targetLng = lng;
    currentHeading = heading || currentHeading;
    animStart = null;

    var busBody = document.getElementById("bus-body");

    if (Date.now() - lastRouteUpdate > 30000) {
      lastRouteUpdate = Date.now();
      ${pickupLat && pickupLng ? `
      fetchRoute(lat, lng, pickupLat, pickupLng);
      ` : ""}
    }

    if (busBody) {
      busBody.style.transform = "rotate(" + currentHeading + "deg)";
    }

    // Extend trail
    trailCoords.push([lat, lng]);
    var idx = getNearestIndex(lat, lng);

if(routeLayer){

    routeLayer.setLatLngs(
        fullRouteCoords.slice(idx)
    );

}
    trailLine.setLatLngs(trailCoords);

    requestAnimationFrame(animateBus);

    if (!map.getBounds().contains([lat, lng])) {
      map.panTo([lat, lng], {
        animate:true,
        duration:0.8
      });
    }
  };

  // Keep old name working too
  window.updateDriverPosition = window.smoothMoveBus;

</script>
</body>
</html>`;
  };

  // ── Loading screen ──────────────────────────────────────
  if (!html) {
    return (
      <View style={styles.loading}>
        <StatusBar barStyle="light-content" backgroundColor={C.bgDark} />
        <View style={styles.loadingIcon}>
          <Text style={{ fontSize: 32 }}>🚌</Text>
        </View>
        <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 16 }} />
        <Text style={styles.loadingText}>Finding your bus…</Text>
        <Text style={styles.loadingSubText}>Connecting to live map</Text>
      </View>
    );
  }

  const isActive =
    busStatus === "Active" && !tripEnded;

  // Phase 6: Progress bar width
  const progressWidth = progressAnim.interpolate({
    inputRange:  [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor={C.bgDark} />

      {/* ── Top bar ─────────────────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/"); // fallback to app home
            }
          }}
          style={styles.backBtn}
          hitSlop={{ top:10, bottom:10, left:10, right:10 }}
        >
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>

        <View style={{ flex:1, marginLeft:12 }}>
          <Text style={styles.topTitle}>Live Tracking</Text>
          {busNo ? <Text style={styles.topSub}>🚌 Bus {busNo}</Text> : null}
        </View>

        <View style={[styles.connPill, {
          backgroundColor: connected
            ? "rgba(16,185,129,0.15)"
            : "rgba(244,63,94,0.12)"
        }]}>
          <View style={[styles.connDot, {
            backgroundColor: connected ? C.success : C.danger
          }]} />
          <Text style={[styles.connText, {
            color: connected ? C.success : C.danger
          }]}>
            {connected ? "Live" : "Offline"}
          </Text>
        </View>
      </View>

      {/* ── Map ─────────────────────────────────────────── */}
      <WebView
         onMessage={(e) => {
  console.log("WEBVIEW ERROR:", e.nativeEvent.data);
  alert(e.nativeEvent.data);
}}
         onError={(e) => console.log("WEBVIEW ERROR", e.nativeEvent)}
        onHttpError={(e) => console.log("HTTP ERROR", e.nativeEvent)}
        ref={webViewRef}
        originWhitelist={["*"]}
source={{ html }}
        style={{ flex: 1 }}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
      />
      <View
style={{
    position: "absolute",
    bottom: 20,
    left: 15,
    right: 15,

    backgroundColor: "white",

    borderRadius: 15,

    padding: 15,

    elevation: 8,
}}
>

<Text
style={{
    fontSize:18,
    fontWeight:"700",
}}
>
🚌 Live Bus Status
</Text>

<Text>
📍 Distance :
{" "}
{Math.round(distance)}
 m
</Text>

<Text
style={{
    fontSize:34,
    fontWeight:"700",
    color: tripEnded ? "#EF4444" : "#10B981",
}}
>
{tripEnded ? "Completed" : (eta ? `${eta} min` : "--")}
</Text>

<View
style={{
    marginTop:8,
    alignItems:"center"
}}
>

<Text
style={{
    color:"#94A3B8",
    fontSize:13
}}
>
Distance
</Text>

<Text
style={{
    fontSize:18,
    fontWeight:"700",
    color:"#3B82F6"
}}
>

{Math.round(distance)} m

</Text>

</View>
<Text
style={{
    fontSize:32,
    color:"#10B981",
    fontWeight:"700"
}}
>

{speed}

</Text>

<Text>
km/h
</Text>
</View>

      {/* ── Phase 6: Progress bar (React Native layer) ──── */}
      {progress > 0 && (
        <View style={styles.progressBar}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>🏫 School</Text>
            <Text style={styles.progressPct}>{progress}%</Text>
            <Text style={styles.progressLabel}>📍 Pickup</Text>
          </View>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
        </View>
      )}

      {/* ── Bottom bar ──────────────────────────────────── */}
      <View style={styles.bottomBar}>
        {/* ETA */}
        <View style={styles.bottomItem}>
          <Text style={styles.bottomLabel}>ETA</Text>
          <Text style={[styles.bottomValueLg, { color: C.success }]}>
            {etaLoading ? "…" : eta}
          </Text>
        </View>

        <View style={styles.bottomDivider} />

        {/* Bus status */}
        <View style={styles.bottomItem}>
          <Text style={styles.bottomLabel}>STATUS</Text>
          <View style={{ flexDirection:"row", alignItems:"center", gap:5 }}>
            <View style={[styles.statusDot, {
              backgroundColor: isActive ? C.success : C.textMuted
            }]} />
            <Text style={[styles.bottomValue, {
              color: isActive ? C.success : C.textMuted
            }]}>
              {busStatus}
            </Text>
          </View>
        </View>

        <View style={styles.bottomDivider} />

        {/* Legend */}
        <View style={styles.bottomItem}>
          <Text style={styles.bottomLabel}>ROUTE</Text>
          <View style={{ gap:3 }}>
            <View style={{ flexDirection:"row", alignItems:"center", gap:5 }}>
              <View style={{ width:16, height:3, borderRadius:2, backgroundColor:"#3B82F6" }} />
              <Text style={styles.legendText}>Ahead</Text>
            </View>
            <View style={{ flexDirection:"row", alignItems:"center", gap:5 }}>
              <View style={{ width:16, height:3, borderRadius:2, backgroundColor:C.success }} />
              <Text style={styles.legendText}>Driven</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex:1, backgroundColor:C.bgDark,
    alignItems:"center", justifyContent:"center",
  },
  loadingIcon:    {
    width:72, height:72, borderRadius:20,
    backgroundColor:C.primary+"22",
    alignItems:"center", justifyContent:"center",
  },
  loadingText:    { color:C.textOnDark, fontSize:17, fontWeight:"700", marginTop:12 },
  loadingSubText: { color:C.textMuted,  fontSize:13, marginTop:4 },

  topBar: {
    position:"absolute", top:0, left:0, right:0, zIndex:100,
    backgroundColor:C.bgDark,
    paddingTop:52, paddingBottom:14, paddingHorizontal:16,
    flexDirection:"row", alignItems:"center",
    borderBottomLeftRadius:20, borderBottomRightRadius:20,
    shadowColor:"#000", shadowOffset:{width:0,height:6},
    shadowOpacity:0.4, shadowRadius:16, elevation:12,
  },
  backBtn:   {
    width:36, height:36, backgroundColor:C.bgMid,
    borderRadius:10, alignItems:"center", justifyContent:"center",
  } as any,
  backArrow: { color:C.textOnDark, fontSize:22, fontWeight:"300", lineHeight:28 },
  topTitle:  { color:C.textOnDark, fontSize:17, fontWeight:"700" },
  topSub:    { color:C.textMuted,  fontSize:12, marginTop:1 },
  connPill:  {
    flexDirection:"row", alignItems:"center",
    paddingHorizontal:10, paddingVertical:6, borderRadius:20,
  },
  connDot:   { width:7, height:7, borderRadius:4, marginRight:5 },
  connText:  { fontSize:12, fontWeight:"700" },

  // Phase 6: Progress bar
  progressBar: {
    position:"absolute", bottom:90, left:16, right:16, zIndex:99,
    backgroundColor:C.bgDark,
    borderRadius:12, padding:12,
    shadowColor:"#000", shadowOffset:{width:0,height:2},
    shadowOpacity:0.3, shadowRadius:8, elevation:8,
  },
  progressLabels: {
    flexDirection:"row", justifyContent:"space-between",
    alignItems:"center", marginBottom:6,
  },
  progressLabel: { fontSize:10, color:C.textMuted, fontWeight:"600" },
  progressPct:   { fontSize:12, color:C.textOnDark, fontWeight:"800" },
  progressTrack: {
    height:6, backgroundColor:"rgba(255,255,255,0.08)",
    borderRadius:3, overflow:"hidden",
  },
  progressFill: {
    height:"100%" as any,
    borderRadius:3,
    backgroundColor:C.primary,
  },

  bottomBar: {
    position:"absolute", bottom:0, left:0, right:0, zIndex:100,
    backgroundColor:C.bgDark,
    flexDirection:"row",
    paddingVertical:18, paddingHorizontal:20,
    borderTopLeftRadius:24, borderTopRightRadius:24,
    shadowColor:"#000", shadowOffset:{width:0,height:-6},
    shadowOpacity:0.4, shadowRadius:16, elevation:12,
  },
  bottomItem:    { flex:1, alignItems:"center", gap:5 },
  bottomLabel:   { fontSize:9, fontWeight:"700", color:C.textMuted, letterSpacing:1.2 },
  bottomValueLg: { fontSize:20, fontWeight:"800" },
  bottomValue:   { fontSize:14, fontWeight:"700", color:C.textOnDark },
  bottomDivider: { width:1, height:36, backgroundColor:C.bgMid, alignSelf:"center" },
  statusDot:     { width:7, height:7, borderRadius:4 },
  legendText:    { fontSize:10, color:C.textMuted, fontWeight:"600" },
});
