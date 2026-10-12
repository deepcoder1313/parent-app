import axios from "axios";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "http://172.16.141.107/api";

const API = axios.create({
  baseURL: API_BASE_URL,
});

console.log("🔥 PARENT API:", API.defaults.baseURL);

export const getRoutes = () =>
  API.get("/routes");

export default API;