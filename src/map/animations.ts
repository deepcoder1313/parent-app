// src/map/animations.ts
// Returns JS strings that are embedded into the WebView HTML.
// Keeping animation logic here makes buildMapHtml.ts much shorter.

/**
 * Smooth marker interpolation using requestAnimationFrame.
 * Injected once into the WebView on load.
 * Exposes: window.smoothMoveBus(lat, lng, heading)
 */
export function smoothBusAnimationJs(
  pickupLat: number,
  pickupLng: number
): string {
  return `
  // ── Smooth bus animation (Phase 5) ──────────────────────
  var animStart    = null;
  var animDuration = 700;
  var fromLat = busLat, fromLng = busLng;
  var targetLat = busLat, targetLng = busLng;
  var currentHeading = 0;
  var lastRouteUpdate = Date.now();
  var fullRouteCoords = [];

  function animateBus(timestamp) {
    if (!animStart) animStart = timestamp;
    var t = Math.min((timestamp - animStart) / animDuration, 1);
    t = 1 - Math.pow(1 - t, 3); // ease-out cubic
    busMarker.setLatLng([
      fromLat + (targetLat - fromLat) * t,
      fromLng + (targetLng - fromLng) * t,
    ]);
    if (t < 1) requestAnimationFrame(animateBus);
    else { fromLat = targetLat; fromLng = targetLng; animStart = null; }
  }

  function getNearestIndex(lat, lng) {
    if (!fullRouteCoords.length) return 0;
    var nearest = 0, minD = Infinity;
    fullRouteCoords.forEach(function(p, i) {
      var d = Math.pow(p[0]-lat,2) + Math.pow(p[1]-lng,2);
      if (d < minD) { minD = d; nearest = i; }
    });
    return nearest;
  }

  window.smoothMoveBus = function(lat, lng, heading) {
    targetLat = lat; targetLng = lng;
    currentHeading = heading || currentHeading;
    animStart = null;

    // Rotate bus body SVG
    var busBody = document.getElementById('bus-body');
    if (busBody) {
      busBody.animate(
        [{ transform: 'rotate(' + heading + 'deg) scale(1)' },
         { transform: 'rotate(' + heading + 'deg) scale(1.08)' },
         { transform: 'rotate(' + heading + 'deg) scale(1)' }],
        { duration: 350, easing: 'ease-out' }
      );
    }

    // Trim driven section from route line
    if (routeLayer) {
      var idx = getNearestIndex(lat, lng);
     remainingRouteLayer.setLatLngs(fullRouteCoords.slice(idx));
    }

    // Extend green trail
    trailCoords.push([lat, lng]);
    trailLine.setLatLngs(trailCoords);

    // Reroute every 30 seconds
    if (Date.now() - lastRouteUpdate > 30000) {
      lastRouteUpdate = Date.now();
      ${pickupLat && pickupLng
        ? `fetchRoute(lat, lng, ${pickupLat}, ${pickupLng});`
        : ""}
    }

    requestAnimationFrame(animateBus);

    // Pan map if bus leaves visible area
    if (!map.getBounds().contains([lat, lng])) {
      map.flyTo([lat, lng], map.getZoom(), { duration: 0.7 });
    }
  };

  // backward compat alias
  window.updateDriverPosition = window.smoothMoveBus;
  `;
}

/**
 * Progress bar update function injected into WebView.
 * Called via injectJavaScript from React Native.
 */
export function progressBarJs(): string {
  return `
  window.updateProgressBar = function(pct) {
    var fill  = document.getElementById('progress-fill');
    var label = document.getElementById('progress-pct');
    if (fill)  fill.style.width = pct + '%';
    if (label) label.textContent = pct + '% of route completed';
  };
  `;
}
