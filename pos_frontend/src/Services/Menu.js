// src/Services/Menu.js
import api from "./api"; // ✅ ใช้ default import

// helper: แปลง payload -> FormData ให้คีย์ถูกต้อง
function toFormData(payload = {}) {
  const fd = new FormData();
  if (payload.name != null) fd.append("name", payload.name);
  if (payload.price != null) fd.append("price", String(payload.price));
  if (payload.category != null) fd.append("category", payload.category || "");
  if (payload.status != null)
    fd.append("status", String(payload.status).toUpperCase());

  // รองรับ payload.imageFile หรือ payload.image (ต้องเป็น File/Blob)
  const file = payload.imageFile || payload.image;
  if (file instanceof File || file instanceof Blob) {
    fd.append("image", file); // 👈 ชื่อคีย์ฝั่ง backend รอ "image"
  }
  return fd;
}

// ดึงเมนูทั้งหมด
export async function getMenus() {
  const { data } = await api.get("/menus");
  return Array.isArray(data) ? data : data?.data || [];
}

// ดึงเมนูตาม id
export async function getMenuById(id) {
  const { data } = await api.get(`/menus/${id}`);
  return data;
}

// สร้างเมนู (รองรับอัปโหลดรูป)
export async function createMenu(payload) {
  const { data } = await api.post("/menus", toFormData(payload), {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

// อัปเดตเมนู (รองรับอัปโหลดรูป)
export async function updateMenu(id, payload) {
  const { data } = await api.put(`/menus/${id}`, toFormData(payload), {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

// ⚠️ รีเซ็ตเมนูทั้งหมด (ถ้ามีใช้งาน endpoint นี้)
export async function resetAllMenus() {
  const { data } = await api.post("/admin/reset-menus");
  return data;
}
