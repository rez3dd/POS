// src/Services/api.js
import axios from "axios";

export const AUTH_TOKEN_KEY = "pos_auth_token";
export const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN || "http://localhost:3001";

export const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  withCredentials: true,
});

// ✅ ฟังก์ชันแปลง path รูปให้เต็ม URL
export function fileUrl(p) {
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  if (p.startsWith("/")) return `${API_ORIGIN}${p}`;
  return `${API_ORIGIN}/${p}`;
}

// === token helpers ===
export function setAuthToken(token) {
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
}
export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}
export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY) || "";
}

// === interceptors ===
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      clearAuthToken();
      if (!location.pathname.startsWith("/login")) location.replace("/login");
    }
    return Promise.reject(err);
  }
);

export default api;
