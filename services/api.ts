import axios from "axios";

const API = axios.create({
  // Replace with your backend IP when testing on a phone
  baseURL: "http://192.168.31.237:5000/api",
});

export default API;