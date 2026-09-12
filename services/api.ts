import axios from "axios";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "http://192.168.31.237:5000/api";

const API = axios.create({
  baseURL: API_BASE_URL,
});

console.log("🔥 PARENT API:", API.defaults.baseURL);

export const getRoutes = () =>
  API.get("/routes");

export default API;