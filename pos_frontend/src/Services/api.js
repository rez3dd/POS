// src/Services/api.js
import axios from "axios";

export const AUTH_TOKEN_KEY = "pos_auth_token";

// ⚙️ ตั้งค่าต้นทาง API (รองรับ .env และ fallback)
export const API_ORIGIN =
  (import.meta?.env?.VITE_API_ORIGIN || "http://localhost:3001").replace(/\/+$/, "");

// ฐาน URL ที่รวม /api (ลบ / ท้ายออกก่อนต่อ)
export const API_BASE = `${API_ORIGIN}/api`;

// ⚡️ อินสแตนซ์ Axios กลาง
export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// 🖼️ ช่วยแปลง path ไฟล์/รูป -> URL เต็ม (รองรับทั้ง http(s), /uploads/*, และชื่อไฟล์ล้วน)
export function fileUrl(p) {
  if (!p) return "";
  const s = String(p).trim();
  if (/^https?:\/\//i.test(s)) return s;          // เป็น URL เต็มอยู่แล้ว
  if (s.startsWith("/")) return `${API_ORIGIN}${s}`; // นำหน้าด้วย / เช่น /uploads/xxx.jpg
  if (s.startsWith("uploads/")) return `${API_ORIGIN}/${s}`; // เป็นพาธในโฟลเดอร์ uploads
  return `${API_ORIGIN}/${s}`; // กรณีส่งมาเป็นชื่อไฟล์อย่างเดียว
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

// 🆙 helper สำหรับอัปโหลดรูป (ให้ component/service อื่นเรียกใช้ได้)
export async function uploadImage(file) {
  const fd = new FormData();
  fd.append("image", file);
  const { data } = await api.post("/upload", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  // data คาดหวัง: { url, filename, size, mimetype }
  return data;
}

export default api;
