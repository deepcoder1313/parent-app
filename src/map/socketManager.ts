// src/map/socketManager.ts

import { io, Socket } from "socket.io-client";

const BACKEND = "http://192.168.31.237:5000"; // ⚠️ your WiFi IP

export interface BusUpdate {
  latitude:  number;
  longitude: number;
  heading?:  number;
  speed?:    number;
  distance?: number;
  eta?:      number | string;
  busNo?:    string;
}

export interface TripStartedData {
  tripId:    string;
  busNo:     string;
  driverId:  string;
  tripType:  "morning" | "return";
  startTime: string;
}

export interface SocketCallbacks {
  onConnect:           () => void;
  onDisconnect:        () => void;
  onBusLocationUpdate: (bus: BusUpdate) => void;
  onTripEnded:         (data: { busNo: string }) => void;
  onTripStarted?:      (data: TripStartedData) => void;  // ✅ optional
}

export function connectSocket(callbacks: SocketCallbacks): () => void {
  const socket: Socket = io(BACKEND, {
    transports:           ["websocket"],
    reconnection:         true,
    reconnectionAttempts: Infinity,
    reconnectionDelay:    1000,
    timeout:              10000,
  });

  socket.on("connect", () => {
    console.log("🟢 Socket connected:", socket.id);
    callbacks.onConnect();
  });

  socket.on("disconnect", (reason) => {
    console.log("🔴 Socket disconnected:", reason);
    callbacks.onDisconnect();
  });

  socket.on("connect_error", (err) => {
    console.log("❌ Socket connect error:", err.message);
  });

  socket.on("busLocationUpdated", (bus: BusUpdate) => {
    console.log("📍 busLocationUpdated:", bus.latitude, bus.longitude);
    callbacks.onBusLocationUpdate(bus);
  });

  // ✅ 1. Trip Started
  socket.on("tripStarted", (data: TripStartedData) => {
    console.log("🚌 tripStarted:", data);
    callbacks.onTripStarted?.(data);
  });

  // ✅ 5. Trip Ended
  socket.on("tripEnded", (data: { busNo: string }) => {
    console.log("🛑 tripEnded:", data);
    callbacks.onTripEnded(data);
  });

  return () => {
    socket.removeAllListeners();
    socket.disconnect();
    console.log("🔌 Socket disconnected on cleanup");
  };
}
