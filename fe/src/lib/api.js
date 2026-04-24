// src/lib/api.js
import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3000", // sesuaikan BE lu
  withCredentials: true, // penting buat cookie JWT
});