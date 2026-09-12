// src/map/routeDecoder.ts
// Returns the JS string for OSRM route fetching embedded in the WebView.
// Using OSRM (free, no API key) — Google Directions requires a billing key
// and is blocked by CORS from inside a WebView anyway.

export interface Stop {
  lat:  number;
  lng:  number;
  name: string;
}

/**
 * Returns the JS fetchRoute() function string to embed in the WebView.
 * Uses OSRM public API — road-following, no API key needed.
 */
export function osrmFetchRouteJs(): string {
  return `
  // ── OSRM road route (Phase 3) ─────────────────────────
  var remainingRouteLayer = null;

  function fetchRoute(fromLat, fromLng, toLat, toLng) {
    if (!toLat || !toLng) return;

    var url =
      'https://router.project-osrm.org/route/v1/driving/' +
      fromLng + ',' + fromLat + ';' +
      toLng   + ',' + toLat +
      '?overview=full&geometries=geojson';

    fetch(url)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (!data.routes || !data.routes[0]) return;

        // Flip [lng,lat] → [lat,lng] for Leaflet
        var coords = data.routes[0].geometry.coordinates.map(function(c) {
          return [c[1], c[0]];
        });

        fullRouteCoords = coords;

        if (remainingRouteLayer) map.removeLayer(remainingRouteLayer);

        // Blue Uber-style road line
        remainingRouteLayer = L.polyline(coords, {
          color:    '#3B82F6',
          weight:   7,
          opacity:  0.92,
          lineCap:  'round',
          lineJoin: 'round',
        }).addTo(map);

        // Subtle white glow under blue line
        L.polyline(coords, {
          color:   'white',
          weight:  12,
          opacity: 0.12,
        }).addTo(map);

        
      })
      .catch(function() {
        // Fallback: straight dashed line if OSRM unreachable
        if (remainingRouteLayer) map.removeLayer(remainingRouteLayer);
        remainingRouteLayer = L.polyline(
          [[fromLat, fromLng], [toLat, toLng]],
          { color: '#3B82F6', weight: 5, dashArray: '10,8', opacity: 0.75 }
        ).addTo(map);
      });
  }
  `;
}
