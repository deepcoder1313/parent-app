import axios from "axios";

const API = axios.create({
  baseURL: "http://192.168.31.237:5000/api" // ⚠️ your WiFi IP
});
console.log("🔥 CURRENT API:", API.defaults.baseURL);

export const getRoutes = () =>
  API.get("/routes");

export default API;
