// src/Services/Categories.js
import { api } from "./api";

// ดึงหมวดหมู่ทั้งหมด (เรียงตามชื่อ)
export async function listCategories() {
  const { data } = await api.get("/categories");
  // เผื่อบาง backend ห่อ response ไว้ใน data/items
  if (Array.isArray(data)) return data;
  return data?.data || data?.items || [];
}

// เพิ่มหมวดหมู่ใหม่ (ถ้าชื่อซ้ำ backend จะตอบ 409)
export async function createCategory(name) {
  const { data } = await api.post("/categories", { name });
  return data;
}
