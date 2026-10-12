// src/map/socketManager.ts

import { io, Socket } from "socket.io-client";

const BACKEND = "https://school-bus-backend-b3nc.onrender.com";

export interface BusUpdate {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  distance?: number;
  eta?: number | string;
  busNo?: string;
}

export interface TripStartedData {
  tripId: string;
  busNo: string;
  driverId: string;
  tripType: "morning" | "return";
  startTime: string;
}

export interface SocketCallbacks {
  onConnect: () => void;
  onDisconnect: () => void;
  onBusLocationUpdate: (bus: BusUpdate) => void;
  onTripEnded: (data: { busNo: string }) => void;
  onTripStarted?: (data: TripStartedData) => void;
}

// ⭐ ONE persistent socket for the whole Parent App
let socket: Socket | null = null;

export function connectSocket(
  callbacks: SocketCallbacks
): () => void {

  // Create socket only once
  if (!socket) {
    console.log("🔵 Creating MAIN socket...");

    socket = io(BACKEND, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socket.on("connect", () => {
      console.log("🟢 Socket connected:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("🔴 Socket disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.log("❌ Socket connect error:", err.message);
    });
  }

  // ------------------------------------------------
  // Attach THIS screen's callbacks
  // ------------------------------------------------

  const handleConnect = () => {
    console.log("🟢 PARENT SOCKET CONNECTED");
    callbacks.onConnect();
  };

  const handleDisconnect = () => {
    console.log("🔴 PARENT SOCKET DISCONNECTED");
    callbacks.onDisconnect();
  };

  const handleBusLocation = (bus: BusUpdate) => {
    console.log(
      "📡 PARENT RECEIVED BUS:",
      bus.latitude,
      bus.longitude
    );

    callbacks.onBusLocationUpdate(bus);
  };

  const handleTripStarted = (data: TripStartedData) => {
    console.log("🚌 tripStarted:", data);

    callbacks.onTripStarted?.(data);
  };

  const handleTripEnded = (data: { busNo: string }) => {
    console.log("🛑 tripEnded:", data);

    callbacks.onTripEnded(data);
  };

  socket.on("connect", handleConnect);
  socket.on("disconnect", handleDisconnect);
  socket.on("busLocationUpdated", handleBusLocation);
  socket.on("tripStarted", handleTripStarted);
  socket.on("tripEnded", handleTripEnded);

  // If socket was already connected when MapScreen mounted
  if (socket.connected) {
    console.log(
      "🟢 Socket already connected:",
      socket.id
    );

    setTimeout(() => {
      callbacks.onConnect();
    }, 0);
  }

  // ------------------------------------------------
  // Cleanup ONLY this screen's listeners
  // DO NOT disconnect the global socket
  // ------------------------------------------------

  return () => {
    console.log(
      "🧹 Removing MapScreen socket listeners"
    );

    socket?.off("connect", handleConnect);
    socket?.off("disconnect", handleDisconnect);
    socket?.off("busLocationUpdated", handleBusLocation);
    socket?.off("tripStarted", handleTripStarted);
    socket?.off("tripEnded", handleTripEnded);

    // ❌ DO NOT:
    // socket.disconnect();
  };
}