    // src/map/routeManager.ts

    export function routeManagerJs(encodedPolyline: string = ""): string {
    return `

    /* ── Route state ─────────────────────────────────────── */
   
    var remainingRouteLayer = null;
    var routeGlowLayer      = null;
    var fullRouteCoords      = [];
    var lastRouteIndex = 0;

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
  lastRouteIndex = 0

  console.log("🛣️ ROUTE FIRST POINT:", coords[0]);
  console.log("🛣️ ROUTE LAST POINT:", coords[coords.length - 1]);

  if (remainingRouteLayer) map.removeLayer(remainingRouteLayer);
  if (routeGlowLayer) map.removeLayer(routeGlowLayer);

  // White glow behind the blue route
  routeGlowLayer = L.polyline(coords, {
    color: "white",
    weight: 14,
    opacity: 0.12,
    lineCap: "round",
    lineJoin: "round",
  }).addTo(map);

  // Blue route
  remainingRouteLayer = L.polyline(coords, {
    color: "#2563EB",
    weight: 7,
    opacity: 0.95,
    lineCap: "round",
    lineJoin: "round",
  }).addTo(map);

  console.log("✅ BLUE ROUTE DRAWN");
};



function distanceMeters(a, b) {
  var lat1 = a[0] * Math.PI / 180;
  var lat2 = b[0] * Math.PI / 180;
  var dLat = (b[0] - a[0]) * Math.PI / 180;
  var dLng = (b[1] - a[1]) * Math.PI / 180;

  var h = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLng / 2) ** 2;

  return 6371000 * 2 *
    Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function trimRouteToCurrentPosition(lat, lng) {
  if (!remainingRouteLayer || fullRouteCoords.length < 2) return;

  var busPoint = [lat, lng];
  var nearest = lastRouteIndex;
  var minDist = Infinity;

  // Search only forward: never restore a route already completed.
  for (var i = lastRouteIndex; i < fullRouteCoords.length; i++) {
    var d = distanceMeters(busPoint, fullRouteCoords[i]);

    if (d < minDist) {
      minDist = d;
      nearest = i;
    }
  }

  // Don't trim if the bus is far away from the route.
  if (minDist > 100) {
    console.log("⚠️ Bus is off route; keeping blue route", {
      distanceMeters: Math.round(minDist)
    });
    return;
  }

  lastRouteIndex = Math.max(lastRouteIndex, nearest);

  var remaining = fullRouteCoords.slice(lastRouteIndex);

  remainingRouteLayer.setLatLngs(remaining);

  if (routeGlowLayer) {
    routeGlowLayer.setLatLngs(remaining);
  }

  console.log("🛣️ ROUTE PROGRESS:", {
    index: lastRouteIndex,
    total: fullRouteCoords.length,
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
