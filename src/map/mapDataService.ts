// src/map/mapDataService.ts
// Owns every API call the map screen needs.
// Returns a single typed result — map.tsx just awaits it and sets state.

import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../../services/api";
import { formatEta, haversine } from "./helpers";

// ── Types ────────────────────────────────────────────────

export interface Stop {
  lat:  number;
  lng:  number;
  name: string;
}

export interface MapData {
  // Bus
  busLat:    number;
  busLng:    number;
  busLabel:  string;
  busStatus: string;

  // Driver
  driverName:  string;
  driverPhone: string;
  // Pickup (this parent's child)
  pickupLat:  number;
  pickupLng:  number;
  pickupName: string;

  // School (from Route model)
  schoolLat:  number;
  schoolLng:  number;
  schoolName: string;

  // Other stops on the same bus
  stops: Stop[];

  // ETA
  etaText:       string;        // "12 min" | "Arriving!" | "—"
  etaMinutes:    number | null;
  distanceMeters:number;
  totalDistance: number;        // school → pickup (for progress bar)
}

// ── Main loader ─────────────────────────────────────────

/**
 * Loads all data the map needs in parallel where possible.
 * Returns null if the parent has no assigned bus.
 */
export async function loadMapData(): Promise<MapData | null> {
  // 1 ── Read parent from storage
  const raw = await AsyncStorage.getItem("parent");
  if (!raw) return null;
  const parent = JSON.parse(raw);

  const assignedBus = parent?.studentId?.assignedBus as string | undefined;
  if (!assignedBus) return null;

  const pickupLat  = (parent?.studentId?.pickupLatitude  as number) || 0;
  const pickupLng  = (parent?.studentId?.pickupLongitude as number) || 0;
  const pickupName = (parent?.studentId?.pickupPoint     as string) || "Your Pickup";

  // 2 ── Fetch bus, ETA, routes, students in parallel
const [busRes, etaRes, routesRes, studentsRes, driversRes] =
  await Promise.allSettled([
    API.get(`/buses/busno/${encodeURIComponent(assignedBus)}`),
    API.get(`/eta/${encodeURIComponent(assignedBus)}?pickupLat=${pickupLat}&pickupLng=${pickupLng}`),
    API.get("/routes"),
    API.get("/students"),
    API.get("/drivers"),
  ]);

  // 3 ── Bus position
  const bus       = busRes.status === "fulfilled" ? busRes.value.data : null;
  const busLat    = bus?.latitude  || 30.484;
  const busLng    = bus?.longitude || 76.604;
  const busStatus = bus?.status    || "Unknown";


  // 3A ── Driver information
let driverName = "Driver";
let driverPhone = "";

if (driversRes.status === "fulfilled") {
  const drivers: any[] = driversRes.value.data;

  const driver = drivers.find(
    d => d.assignedBus === assignedBus
  );

  if (driver) {
    driverName = driver.name || "Driver";
    driverPhone = driver.phone || "";
  }
}


  // 4 ── ETA
  const etaData      = etaRes.status === "fulfilled" ? etaRes.value.data : null;
  const etaMinutes   = etaData?.etaMinutes   ?? null;
  const distMeters   = etaData?.distanceMeters ?? 0;
  const etaText      = formatEta(etaMinutes);

  // 5 ── School (match bus.route → Route.routeName)
  let schoolLat  = 0, schoolLng  = 0, schoolName = "School";
  let totalDistance = distMeters * 1.3; // rough fallback

  if (routesRes.status === "fulfilled") {
    const routes: any[] = routesRes.value.data;
    const matched = routes.find(r =>
      bus?.route && r.routeName &&
      bus.route.toLowerCase().includes(r.routeName.toLowerCase())
    );
    if (matched?.schoolLatitude && matched?.schoolLongitude) {
      schoolLat  = matched.schoolLatitude;
      schoolLng  = matched.schoolLongitude;
      schoolName = matched.destination || "School";
      // Use real road distance school → pickup for progress bar
      if (pickupLat && pickupLng) {
        totalDistance = haversine(schoolLat, schoolLng, pickupLat, pickupLng);
      }
    }
  }

  // 6 ── Other stops on the same bus
  let stops: Stop[] = [];
  if (studentsRes.status === "fulfilled") {
    const students: any[] = studentsRes.value.data;
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
  }

return {
  busLat,
  busLng,
  busLabel: assignedBus,
  busStatus,

  driverName,
  driverPhone,

  pickupLat,
  pickupLng,
  pickupName,

  schoolLat,
  schoolLng,
  schoolName,

  stops,

  etaText,
  etaMinutes,
  distanceMeters: distMeters,
  totalDistance,
};
};
