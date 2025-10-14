// src/Services/api.js
import axios from "axios";

function normalizeBase(input) {
  let base = input || "http://localhost:3001";
  base = base.replace(/\/+$/, "");
  if (!/\/api$/.test(base)) base = `${base}/api`;
  return base;
}

export const API_BASE = normalizeBase(import.meta.env.VITE_API_BASE || "");
export const AUTH_TOKEN_KEY = "token";

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
