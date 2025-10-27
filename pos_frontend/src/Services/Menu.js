// src/Services/Menu.js
import { api } from "./api";

// ให้ทนทุกรูปแบบ response (array ตรง หรือ { data: ... })
function unwrap(res) {
  if (Array.isArray(res)) return res;
  if (res && typeof res === "object") {
    if (Array.isArray(res.data)) return res.data;
    if (res.data && typeof res.data === "object") return res.data;
  }
  return res;
}

export async function getMenus() {
  const { data } = await api.get("/menus");
  return unwrap(data); // [{ id, name, price, status, imageUrl, ... }, ...]
}

export async function getMenuById(id) {
  const { data } = await api.get(`/menus/${id}`);
  return unwrap(data); // { id, name, price, status, imageUrl, ... }
}

export async function createMenu(payload) {
  // payload ควรรวม imageUrl (URL เต็ม) ถ้ามี
  const { data } = await api.post("/menus", payload);
  return unwrap(data); // object ที่สร้างเสร็จ
}

export async function updateMenu(id, payload) {
  // payload ควรรวม imageUrl (URL เต็ม) ถ้ามีการอัปเดตรูป
  const { data } = await api.put(`/menus/${id}`, payload);
  return unwrap(data); // object ที่อัปเดตแล้ว
}

export async function resetAllMenus() {
  const { data } = await api.post("/menus/reset");
  return unwrap(data);
}
