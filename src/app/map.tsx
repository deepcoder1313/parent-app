import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { io } from "socket.io-client";
import API from "../../services/api";


const socket = io("http://192.168.31.237:5000");
export default function MapScreen() {
  const webViewRef = useRef<WebView>(null);

  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);

  const loadBusLocation = async () => {
    try {
      const parentString = await AsyncStorage.getItem("parent");

      if (!parentString) return;

      const parent = JSON.parse(parentString);

      const busNo = parent.studentId.assignedBus;

      if (!busNo) return;

      const res = await API.get(
        `/buses/busno/${encodeURIComponent(busNo)}`
      );

      const bus = res.data;

      const mapHTML = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet"
href="https://unpkg.com/leaflet/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>

<style>
html,body,#map{
height:100%;
margin:0;
padding:0;
}
</style>
</head>

<body>

<div id="map"></div>

<script>

var map=L.map('map').setView(
[${bus.latitude},${bus.longitude}],
16
);

L.tileLayer(
'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
{
maxZoom:19
}
).addTo(map);

var marker=L.marker(
[${bus.latitude},${bus.longitude}]
)
.addTo(map)
.bindPopup("🚌 ${bus.busNo}")
.openPopup();

window.updateBusLocation=function(lat,lng){

marker.setLatLng([lat,lng]);

map.panTo([lat,lng]);

}

</script>

</body>
</html>
`;

      setHtml(mapHTML);
      setLoading(false);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadBusLocation();

    const interval = setInterval(() => {
      loadBusLocation();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("✅ Parent Socket Connected");
    });

    socket.on("busLocationUpdated", (bus) => {
      console.log("📍 Parent Live:", bus);

      webViewRef.current?.injectJavaScript(`
        if (window.updateBusLocation) {
          window.updateBusLocation(${bus.latitude}, ${bus.longitude});
        }
        true;
      `);
    });

    return () => {
      socket.off("connect");
      socket.off("busLocationUpdated");
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <WebView
      ref={webViewRef}
      originWhitelist={["*"]}
      source={{ html }}
      style={{ flex: 1 }}
    />
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});