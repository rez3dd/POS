// src/Services/Users.js
// ใช้ axios instance กลาง (แนบ token ให้อัตโนมัติ)
import { api } from "./api";

// ดึงผู้ใช้ทั้งหมด
export async function getUsers() {
  const { data } = await api.get("/users");
  return data;
}

// สร้างผู้ใช้
export async function createUser(body) {
  const { data } = await api.post("/users", body);
  return data;
}

// อัปเดตข้อมูลผู้ใช้
export async function updateUser(id, body) {
  const { data } = await api.put(`/users/${id}`, body);
  return data;
}

// เปลี่ยนสิทธิ์
export async function setUserRole(id, role) {
  const { data } = await api.patch(`/users/${id}/role`, { role });
  return data;
}

// เปลี่ยนสถานะ
export async function setUserStatus(id, status) {
  const { data } = await api.patch(`/users/${id}/status`, { status });
  return data;
}

// ลบผู้ใช้
export async function deleteUser(id) {
  const { data } = await api.delete(`/users/${id}`);
  return data;
}
