// src/lib/api.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error(
    "VITE_API_URL belum diset di file .env"
  );
}

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});