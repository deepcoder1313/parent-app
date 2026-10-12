// src/map/animationEngine.ts

export function animationEngineJs(
  pickupLat: number,
  pickupLng: number
): string {
  return `
  // ── Animation state ───────────────────────────────────
  var animStart    = null;
  var animDuration = 700;
  var fromLat      = busLat;
  var fromLng      = busLng;
  var targetLat    = busLat;
  var targetLng    = busLng;
var trailCoords = [];
var trailLine = null;

  // ── Smooth interpolation ──────────────────────────────
  function animateBus(timestamp) {
    if (!animStart) animStart = timestamp;
    var t = Math.min((timestamp - animStart) / animDuration, 1);
    t = 1 - Math.pow(1 - t, 3);

    busMarker.setLatLng([
      fromLat + (targetLat - fromLat) * t,
      fromLng + (targetLng - fromLng) * t,
    ]);

    if (t < 1) {
      requestAnimationFrame(animateBus);
    } else {
      fromLat   = targetLat;
      fromLng   = targetLng;
      animStart = null;
    }
  }

  // ── Rotate bus icon ───────────────────────────────────
  function rotateBus(heading) {
    var busBody = document.getElementById("bus-body");
    if (!busBody || !heading) return;
    busBody.style.transform = "rotate(" + heading + "deg)";
  }

  // ── Camera pan ────────────────────────────────────────
  function updateCamera(lat, lng) {
    if (!map) return;
    var safeBounds = map.getBounds().pad(-0.25);
    if (!safeBounds.contains(L.latLng(lat, lng))) {
      map.panTo([lat, lng], { animate: true, duration: 0.6 });
    }
  }
window.smoothMoveBus = function(lat, lng, heading, speed) {

  var currentPos = busMarker.getLatLng();

  fromLat = currentPos.lat;
  fromLng = currentPos.lng;

  targetLat = lat;
  targetLng = lng;

  animStart = null;

  rotateBus(heading);

  // Don't draw driven route while vehicle is stationary
  if (speed <= 3) {
    console.log("⏸️ BUS STATIONARY:", speed, "km/h");

    requestAnimationFrame(animateBus);
    return;
  }

  // Vehicle is actually moving
  if (!trailLine) {

    trailCoords = [
      [currentPos.lat, currentPos.lng],
      [lat, lng]
    ];

    trailLine = L.polyline(trailCoords, {
      color: "#10B981",
      weight: 3,
      opacity: 0.5,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map);

  } else {

    trailCoords.push([lat, lng]);
    trailLine.setLatLngs(trailCoords);

  }

  trimRouteToCurrentPosition(lat, lng);

  requestAnimationFrame(animateBus);

  updateCamera(lat, lng);
};

  // Backward-compat alias
  window.updateDriverPosition = window.smoothMoveBus;

  // ── Progress bar (called from React Native) ───────────
  window.updateProgressBar = function(pct) {
    var fill  = document.getElementById("progress-fill");
    var label = document.getElementById("progress-pct");
    if (fill)  fill.style.width = pct + "%";
    if (label) label.textContent = pct + "% of route completed";
  };
  `;
}
