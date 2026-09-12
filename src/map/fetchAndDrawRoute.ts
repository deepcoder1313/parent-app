// src/map/fetchAndDrawRoute.ts

import { RefObject } from "react";
import { WebView } from "react-native-webview";
import API from "../../services/api";

export interface RouteResult {
  durationMinutes:  number;
  distanceMeters:   number;
  durationText:     string;
  distanceText:     string;
  encodedPolyline:  string;   // raw encoded string for embedding in HTML
  decodedPoints:    [number, number][];
}

function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b: number, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

/**
 * Fetches Google Directions from your backend.
 * If dryRun=true  → returns result but does NOT inject into WebView
 *                   (used to get polyline before map loads)
 * If dryRun=false → also injects decoded points into WebView
 */
export async function fetchAndDrawRoute(
  webViewRef: RefObject<WebView>,
  fromLat: number, fromLng: number,
  toLat:   number, toLng:   number,
  dryRun = false
): Promise<RouteResult | null> {
  try {
    const res = await API.get("/directions", {
      params: {
        origin:      `${fromLat},${fromLng}`,
        destination: `${toLat},${toLng}`,
      },
    });

    const data = res.data;
    if (!data.routes || !data.routes.length) return null;

    const encoded       = data.routes[0].overview_polyline.points as string;
    const decodedPoints = decodePolyline(encoded);
    const leg           = data.routes[0].legs[0];

    const result: RouteResult = {
      durationMinutes: Math.ceil(leg.duration.value / 60),
      distanceMeters:  leg.distance.value,
      durationText:    leg.duration.text,
      distanceText:    leg.distance.text,
      encodedPolyline: encoded,
      decodedPoints,
    };

    // Inject into running WebView (for live reroute updates)
    if (!dryRun && webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.drawRoute) {
          window.drawRoute(${JSON.stringify(decodedPoints)});
        }
        true;
      `);
    }

    return result;

  } catch (err) {
    console.log("fetchAndDrawRoute error:", err);
    return null;
  }
}
