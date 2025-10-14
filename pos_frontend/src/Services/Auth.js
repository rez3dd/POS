// src/Services/Auth.js
import { api, AUTH_TOKEN_KEY } from "./api";

/** ===== Utils ===== */
export function getToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY) || "";
}
export function isAuthenticated() {
  return !!getToken();
}

/** ===== Auth core ===== */
export async function login({ email, password }) {
  const res = await api.post("/auth/login", { email, password });
  const data = res?.data ?? res;

  const token = data?.token || data?.accessToken;
  if (!token) throw new Error(data?.message || "ไม่พบ token จากเซิร์ฟเวอร์");

  localStorage.setItem(AUTH_TOKEN_KEY, token);
  if (data?.user) localStorage.setItem("auth_user", JSON.stringify(data.user));
  return { user: data?.user, token };
}

export async function signUp(payload) {
  const res = await api.post("/auth/signup", payload);
  const data = res?.data ?? res;

  const token = data?.token || data?.accessToken;
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
  if (data?.user) localStorage.setItem("auth_user", JSON.stringify(data.user));
  return data;
}

/** เรียก /auth/me (ถ้ามี) แล้วอัปเดต local user */
export async function fetchMe() {
  const res = await api.get("/auth/me");
  const data = res?.data ?? res;
  const user = data?.user ?? data;
  if (user) localStorage.setItem("auth_user", JSON.stringify(user));
  return user;
}

/** อ่าน user จาก localStorage (ไม่ยิง API) */
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem("auth_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** ออกจากระบบ */
export function logout() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem("auth_user");
}
