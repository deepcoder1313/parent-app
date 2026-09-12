// src/map/buildMapHtml.ts

import { animationEngineJs } from "./animationEngine";
import { markerFactoryJs } from "./markerFactory";
import { routeManagerJs } from "./routeManager";
import { webMapStyles } from "./webMapStyles";

export interface MapHtmlOptions {
  busLat:     number;
  busLng:     number;
  busLabel:   string;
  pickupLat:  number;
  pickupLng:  number;
  pickupName: string;
  schoolLat:  number;
  schoolLng:  number;
  schoolName: string;
  stops:      Array<{ lat: number; lng: number; name: string }>;
  encodedPolyline?: string;   // ✅ pass polyline at build time
}

export function buildMapHtml(o: MapHtmlOptions): string {
  const {
    busLat, busLng, busLabel,
    pickupLat, pickupLng, pickupName,
    schoolLat, schoolLng, schoolName,
    stops,
    encodedPolyline = "",
  } = o;

  const hasPickup = typeof pickupLat === "number" && pickupLat !== 0
                 && typeof pickupLng === "number" && pickupLng !== 0;
  const hasSchool = typeof schoolLat === "number" && schoolLat !== 0
                 && typeof schoolLng === "number" && schoolLng !== 0;

  const stopsJson = JSON.stringify(
    (stops ?? []).filter(s => s.lat && s.lng)
  );

  const markers   = markerFactoryJs();
  const router    = routeManagerJs(encodedPolyline);
  const animation = animationEngineJs(pickupLat, pickupLng);

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0"/>
  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    crossorigin=""
  />
  <style>${webMapStyles}</style>
</head>
<body>

<div id="map"></div>

<div id="progress-overlay">
  <div id="progress-labels">
    <span>🎓 ${schoolName}</span>
    <span>📍 ${pickupName}</span>
  </div>
  <div id="progress-track"><div id="progress-fill"></div></div>
  <div id="progress-pct">0% completed</div>
</div>

<script
  src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
  crossorigin=""
></script>

<script>
try {

window.onerror = function(msg, src, line, col) {
  window.ReactNativeWebView &&
  window.ReactNativeWebView.postMessage(
    JSON.stringify({ type:"JS_ERROR", msg:msg, line:line, col:col })
  );
};

if (typeof L === "undefined") {
  window.ReactNativeWebView &&
  window.ReactNativeWebView.postMessage("ERROR: Leaflet not loaded");
} else {

  window.ReactNativeWebView &&
  window.ReactNativeWebView.postMessage("Leaflet OK, creating map...");

  var busLat    = ${busLat};
  var busLng    = ${busLng};
  var pickupLat = ${pickupLat};
  var pickupLng = ${pickupLng};
  var schoolLat = ${schoolLat};
  var schoolLng = ${schoolLng};
  var stops     = ${stopsJson};

  var map = L.map("map", { zoomControl: false, attributionControl: false })
    .setView([busLat, busLng], 15);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    crossOrigin: "anonymous",
  }).addTo(map);

  L.control.zoom({ position: "bottomright" }).addTo(map);

  window.ReactNativeWebView &&
  window.ReactNativeWebView.postMessage("Map created, adding markers...");

  ${markers}

  var busMarker = L.marker([busLat, busLng], { icon: busIcon, zIndexOffset: 1000 })
    .addTo(map)
    .bindPopup("<b>🚌 ${busLabel}</b><br>Live location");

  ${hasPickup ? `
  L.marker([pickupLat, pickupLng], { icon: pickupIcon })
    .addTo(map)
    .bindPopup("<b>📍 ${pickupName}</b><br>Your pickup stop");
  ` : ""}

  ${hasSchool ? `
  L.marker([schoolLat, schoolLng], { icon: schoolIcon })
    .addTo(map)
    .bindPopup("<b>🎓 ${schoolName}</b><br>School destination");
  var overlay = document.getElementById("progress-overlay");
  if (overlay) overlay.classList.add("visible");
  ` : ""}

  stops.forEach(function(stop) {
    if (!stop.lat || !stop.lng) return;
    L.marker([stop.lat, stop.lng], { icon: makeStopIcon(), zIndexOffset: 500 })
      .addTo(map)
      .bindPopup("<b>🚏 " + stop.name + "</b>");
  });

  window.ReactNativeWebView &&
  window.ReactNativeWebView.postMessage("Markers added, loading modules...");

 ${router}

// ── Draw initial road route ─────────────────────────




${animation}

  try {
    var pts = [[busLat, busLng]];
    ${hasPickup ? `pts.push([pickupLat, pickupLng]);` : ""}
    ${hasSchool ? `pts.push([schoolLat, schoolLng]);` : ""}
    if (pts.length > 1) {
      map.fitBounds(L.latLngBounds(pts), { padding: [80, 40] });
    }
  } catch(e) {}

  window.ReactNativeWebView &&
  window.ReactNativeWebView.postMessage("Map fully initialized");
}

} catch(e) {
  window.ReactNativeWebView &&
  window.ReactNativeWebView.postMessage("CATCH ERROR: " + e.message);
}
</script>
</body>
</html>`;
}
