    // src/map/routeManager.ts

    export function routeManagerJs(encodedPolyline: string = ""): string {
    return `

    /* ── Route state ─────────────────────────────────────── */
    var completedRouteLayer = null;
    var remainingRouteLayer = null;
    var routeGlowLayer      = null;
    var fullRouteCoords      = [];

    /* ── Polyline decoder ────────────────────────────────── */
    function decodePolyline(encoded) {
        var points = [], index = 0, lat = 0, lng = 0;
        while (index < encoded.length) {
        var b, shift = 0, result = 0;
        do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
        lat += (result & 1) ? ~(result >> 1) : (result >> 1);
        shift = 0; result = 0;
        do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
        lng += (result & 1) ? ~(result >> 1) : (result >> 1);
        points.push([lat / 1e5, lng / 1e5]);
        }
        return points;
    }

    /* ── Draw route from [lat,lng] array ─────────────────── */
    window.drawRoute = function(coords) {
  console.log("🛣️ DRAW ROUTE CALLED:", coords?.length);

  if (!coords || !coords.length) {
    console.log("❌ NO ROUTE COORDINATES");
    return;
  }

  fullRouteCoords = coords;

  console.log("🛣️ ROUTE FIRST POINT:", coords[0]);
  console.log("🛣️ ROUTE LAST POINT:", coords[coords.length - 1]);

        if (remainingRouteLayer) map.removeLayer(remainingRouteLayer);
        if (completedRouteLayer) map.removeLayer(completedRouteLayer);
        if (routeGlowLayer)      map.removeLayer(routeGlowLayer);

        // White glow
        routeGlowLayer = L.polyline(coords, {
        color: "white", weight: 14, opacity: 0.12, lineCap: "round",
        }).addTo(map);

        // Blue remaining route
        remainingRouteLayer = L.polyline(coords, {
        color: "#2563EB", weight: 7, opacity: 0.95,
        lineCap: "round", lineJoin: "round",
        }).addTo(map);

        // Green completed route (starts empty)
    completedRouteLayer = L.polyline([], {
  color: "#10B981",
  weight: 7,
  opacity: 0.95,
  lineCap: "round",
  lineJoin: "round",
}).addTo(map);
};

   

    /* ── Trim driven portion ─────────────────────────────── */
    function getNearestRouteIndex(lat, lng) {
        if (!fullRouteCoords.length) return 0;
        var nearest = 0, minDist = Infinity;
        fullRouteCoords.forEach(function(p, i) {
        var d = Math.pow(p[0]-lat,2) + Math.pow(p[1]-lng,2);
        if (d < minDist) { minDist = d; nearest = i; }
        });
        return nearest;
    }

 function trimRouteToCurrentPosition(lat, lng) {
  if (!remainingRouteLayer || !fullRouteCoords.length) return;

  var idx = getNearestRouteIndex(lat, lng);

  var driven = fullRouteCoords.slice(0, idx + 1);
  var remaining = fullRouteCoords.slice(idx);

  if (completedRouteLayer) {
    completedRouteLayer.setLatLngs(driven);
  }

  remainingRouteLayer.setLatLngs(remaining);

  console.log("🛣️ ROUTE PROGRESS:", {
    index: idx,
    total: fullRouteCoords.length,
    completed: driven.length,
    remaining: remaining.length
  });
}
  window.updateRouteProgress = function(lat, lng) {
  trimRouteToCurrentPosition(lat, lng);
};

    /* ── Draw initial route if polyline provided ─────────── */
    var encodedPolyline = ${JSON.stringify(encodedPolyline)};
   if (encodedPolyline) {
  console.log("🛣️ ENCODED POLYLINE EXISTS:", encodedPolyline.length);

  var initialCoords = decodePolyline(encodedPolyline);

  console.log("🛣️ INITIAL ROUTE POINTS:", initialCoords.length);

  window.drawRoute(initialCoords);
} else {
  console.log("❌ NO ENCODED POLYLINE IN HTML");
}

    `;
    }
